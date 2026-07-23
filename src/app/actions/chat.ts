"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin";
import {
  CHAT_BODY_MAX,
  getOpenTicket,
  getOrCreateConversation,
  isRateLimited,
  newTicketNumber,
} from "@/lib/chat";
import { FAQ_TOPICS, matchFaqTopic } from "@/config/faq";
import { generateSupportReply, isLlmConfigured } from "@/lib/llm";
import { sendPushToAdmins, sendPushToUser } from "@/lib/push";

export type SendResult = { ok: boolean; error?: string };

const AGENT_KEYWORDS = ["agent", "human", "person", "someone", "talk to", "speak to", "representative"];

/** Latest-order summary for the "where is my order?" flow. */
async function orderStatusAnswer(userId: string): Promise<string | null> {
  const order = await prisma.order.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { orderNumber: true, status: true, trackingNumber: true, carrier: true },
  });
  if (!order) return null;
  const tracking = order.trackingNumber
    ? ` Tracking: ${order.carrier ? `${order.carrier} · ` : ""}${order.trackingNumber}.`
    : "";
  return `Your latest order ${order.orderNumber} is currently ${order.status.toLowerCase()}.${tracking} You can see full details under Account → Order history.`;
}

/**
 * Customer sends a free-text message. Tiered handling:
 *   1. While a ticket is open → straight to the agent (no bot noise).
 *   2. Explicit ask for a human → open a ticket.
 *   3. FAQ keyword match → canned answer.
 *   4. LLM (if a provider key is configured) → generated answer.
 *   5. Otherwise → offer escalation.
 */
export async function sendChatMessage(rawBody: string): Promise<SendResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Sign in to chat with support." };
  const body = rawBody.trim();
  if (!body) return { ok: false, error: "Type a message first." };
  if (body.length > CHAT_BODY_MAX) {
    return { ok: false, error: `Keep messages under ${CHAT_BODY_MAX} characters.` };
  }

  const conversation = await getOrCreateConversation(session.user.id);
  if (await isRateLimited(conversation.id)) {
    return { ok: false, error: "You're sending messages too quickly — give it a moment." };
  }

  const openTicket = await getOpenTicket(conversation.id);
  await prisma.chatMessage.create({
    data: {
      conversationId: conversation.id,
      sender: "CUSTOMER",
      body,
      ticketId: openTicket?.id,
    },
  });
  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { lastMessageAt: new Date(), userLastReadAt: new Date() },
  });

  // 1. Escalated thread — the agent answers, not the bot.
  if (openTicket) {
    void sendPushToAdmins({
      title: `Support · ${openTicket.number}`,
      body: body.slice(0, 120),
      url: `/admin/chat/${conversation.id}`,
    });
    return { ok: true };
  }

  // 2. Explicit request for a human.
  const lower = body.toLowerCase();
  if (AGENT_KEYWORDS.some((k) => lower.includes(k))) {
    return requestAgent();
  }

  // 3. FAQ keyword match (order-status gets live data).
  const topic = matchFaqTopic(body);
  if (topic) {
    const answer =
      topic.id === "order-status"
        ? (await orderStatusAnswer(session.user.id)) ?? topic.answer
        : topic.answer;
    await botReply(conversation.id, answer);
    return { ok: true };
  }

  // 4. LLM tier, when configured.
  if (isLlmConfigured()) {
    const history = await prisma.chatMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    const turns = history.reverse().map((m) => ({
      role: m.sender === "CUSTOMER" ? ("user" as const) : ("assistant" as const),
      text: m.body,
    }));
    const reply = await generateSupportReply(turns);
    if (reply) {
      await botReply(conversation.id, reply);
      return { ok: true };
    }
  }

  // 5. Nothing matched — offer the human.
  await botReply(
    conversation.id,
    "I'm not sure about that one. Tap “Talk to an agent” below and our team will pick this up — or reach us on WhatsApp."
  );
  return { ok: true };
}

/** Quick-reply FAQ tap: stores the question + canned answer. */
export async function askFaqTopic(topicId: string): Promise<SendResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Sign in to chat with support." };
  const topic = FAQ_TOPICS.find((t) => t.id === topicId);
  if (!topic) return { ok: false, error: "Unknown topic." };

  const conversation = await getOrCreateConversation(session.user.id);
  if (await isRateLimited(conversation.id)) {
    return { ok: false, error: "You're sending messages too quickly — give it a moment." };
  }

  const answer =
    topic.id === "order-status"
      ? (await orderStatusAnswer(session.user.id)) ?? topic.answer
      : topic.answer;

  await prisma.chatMessage.create({
    data: { conversationId: conversation.id, sender: "CUSTOMER", body: topic.label },
  });
  await botReply(conversation.id, answer);
  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { userLastReadAt: new Date() },
  });
  return { ok: true };
}

/** Escalate: open a ticket (unless one is already open) and alert the team. */
export async function requestAgent(): Promise<SendResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Sign in to chat with support." };
  const conversation = await getOrCreateConversation(session.user.id);

  const existing = await getOpenTicket(conversation.id);
  if (existing) {
    await botReply(
      conversation.id,
      `You're already in the queue — ticket ${existing.number} is open and our team will reply here.`
    );
    return { ok: true };
  }

  const ticket = await prisma.ticket.create({
    data: { conversationId: conversation.id, number: newTicketNumber() },
  });
  await botReply(
    conversation.id,
    `Ticket ${ticket.number} opened — a member of our team will reply right here. You'll also get a notification if you've enabled them.`,
    ticket.id
  );
  void sendPushToAdmins({
    title: `New support ticket ${ticket.number}`,
    body: `${session.user.name || session.user.email || "A customer"} needs help.`,
    url: `/admin/chat/${conversation.id}`,
  });
  return { ok: true };
}

/**
 * Post-resolve CSAT: 5 = thumbs-up, 1 = thumbs-down. One rating per ticket,
 * only by the ticket's own customer, only after resolution.
 */
export async function rateTicket(
  ticketId: string,
  rating: number,
  comment?: string
): Promise<SendResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Sign in first." };
  if (rating !== 1 && rating !== 5) return { ok: false, error: "Invalid rating." };

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { conversation: { select: { userId: true } } },
  });
  if (!ticket || ticket.conversation.userId !== session.user.id) {
    return { ok: false, error: "Ticket not found." };
  }
  if (ticket.status !== "RESOLVED") return { ok: false, error: "Ticket isn't resolved yet." };
  if (ticket.rating != null) return { ok: false, error: "Already rated — thank you!" };

  await prisma.ticket.update({
    where: { id: ticketId },
    data: { rating, ratingComment: comment?.trim().slice(0, 500) || null },
  });
  return { ok: true };
}

/** Mark everything as read for the customer (called when the panel is open). */
export async function markChatRead(): Promise<void> {
  const session = await auth();
  if (!session?.user) return;
  await prisma.conversation.updateMany({
    where: { userId: session.user.id },
    data: { userLastReadAt: new Date() },
  });
}

async function botReply(conversationId: string, body: string, ticketId?: string) {
  await prisma.chatMessage.create({
    data: { conversationId, sender: "BOT", body, ticketId },
  });
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: new Date() },
  });
}

// ---------------------------------------------------------------------------
// Admin actions
// ---------------------------------------------------------------------------

export async function adminReply(conversationId: string, rawBody: string): Promise<SendResult> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: "Not authorized." };
  const body = rawBody.trim();
  if (!body) return { ok: false, error: "Type a reply first." };
  if (body.length > CHAT_BODY_MAX) {
    return { ok: false, error: `Keep replies under ${CHAT_BODY_MAX} characters.` };
  }

  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation) return { ok: false, error: "Conversation not found." };

  const ticket = await getOpenTicket(conversationId);
  await prisma.chatMessage.create({
    data: {
      conversationId,
      sender: "STORE",
      senderUserId: session.user.id,
      body,
      ticketId: ticket?.id,
    },
  });
  const now = new Date();
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: now, adminLastReadAt: now },
  });
  if (ticket && ticket.status === "OPEN") {
    await prisma.ticket.update({ where: { id: ticket.id }, data: { status: "IN_PROGRESS" } });
  }
  void sendPushToUser(conversation.userId, {
    title: "Support replied",
    body: body.slice(0, 120),
    url: "/",
  });
  return { ok: true };
}

export async function resolveTicket(ticketId: string): Promise<SendResult> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: "Not authorized." };
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) return { ok: false, error: "Ticket not found." };
  await prisma.ticket.update({
    where: { id: ticketId },
    data: { status: "RESOLVED", resolvedAt: new Date() },
  });
  await botReply(
    ticket.conversationId,
    `Ticket ${ticket.number} has been resolved. If you need anything else, just send a new message.`
  );
  return { ok: true };
}

export async function adminMarkRead(conversationId: string): Promise<void> {
  const session = await getAdminSession();
  if (!session) return;
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { adminLastReadAt: new Date() },
  });
}
