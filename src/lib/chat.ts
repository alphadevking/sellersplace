import { prisma } from "@/lib/prisma";

/**
 * Shared queries for the in-app support chat. One conversation per user
 * (reopened, never duplicated); a conversation is "with an agent" while it has
 * an unresolved ticket, otherwise the FAQ/LLM bot answers.
 */

export const CHAT_BODY_MAX = 2000;
/** Max customer messages per minute before the rate limit trips. */
export const CHAT_RATE_LIMIT_PER_MIN = 20;

export async function getOrCreateConversation(userId: string) {
  return prisma.conversation.upsert({
    where: { userId },
    create: { userId },
    update: { status: "OPEN" },
  });
}

/** The conversation's unresolved ticket, if any — the "escalated" state. */
export async function getOpenTicket(conversationId: string) {
  return prisma.ticket.findFirst({
    where: { conversationId, status: { not: "RESOLVED" } },
    orderBy: { openedAt: "desc" },
  });
}

/** Messages after an ISO-timestamp cursor (or all when no cursor). */
export async function getMessagesAfter(conversationId: string, afterIso?: string) {
  const after = afterIso ? new Date(afterIso) : undefined;
  return prisma.chatMessage.findMany({
    where: {
      conversationId,
      ...(after && !Number.isNaN(after.getTime()) ? { createdAt: { gt: after } } : {}),
    },
    orderBy: { createdAt: "asc" },
    take: 200,
  });
}

/** True when the user has sent too many messages in the last minute. */
export async function isRateLimited(conversationId: string) {
  const oneMinuteAgo = new Date(Date.now() - 60_000);
  const recent = await prisma.chatMessage.count({
    where: { conversationId, sender: "CUSTOMER", createdAt: { gt: oneMinuteAgo } },
  });
  return recent >= CHAT_RATE_LIMIT_PER_MIN;
}

/** Unread (non-customer) messages for the customer's badge. */
export async function getCustomerUnreadCount(userId: string) {
  const conversation = await prisma.conversation.findUnique({ where: { userId } });
  if (!conversation) return 0;
  return prisma.chatMessage.count({
    where: {
      conversationId: conversation.id,
      sender: { not: "CUSTOMER" },
      createdAt: { gt: conversation.userLastReadAt },
    },
  });
}

/** Admin inbox: conversations that have ever been escalated (have tickets). */
export async function getAdminInbox() {
  return prisma.conversation.findMany({
    where: { tickets: { some: {} } },
    orderBy: { lastMessageAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      tickets: { orderBy: { openedAt: "desc" }, take: 1 },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    take: 100,
  });
}

/** Same shape as the customer's ticket-number generator used for invoices. */
export function newTicketNumber() {
  return `TKT-${Date.now().toString(36).toUpperCase()}`;
}
