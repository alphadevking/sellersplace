import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getCustomerUnreadCount,
  getMessagesAfter,
  getMessagePage,
  getOpenTicket,
  getRateableTicket,
} from "@/lib/chat";

type ChatMessageRow = Awaited<ReturnType<typeof getMessagesAfter>>[number];

function serialize(m: ChatMessageRow) {
  return {
    id: m.id,
    sender: m.sender,
    body: m.body,
    createdAt: m.createdAt.toISOString(),
  };
}

/**
 * Support-chat read endpoint. Customers get their own thread; ADMIN/STAFF may
 * pass ?conversationId= to read any thread (admin inbox).
 *
 * Modes:
 *   (none)          latest page of history + hasEarlier flag
 *   ?after=<ISO>    live poll — only newer messages
 *   ?before=<ISO>   older page for "Load earlier" + hasEarlier flag
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const after = req.nextUrl.searchParams.get("after") || undefined;
  const before = req.nextUrl.searchParams.get("before") || undefined;
  const requestedId = req.nextUrl.searchParams.get("conversationId");
  const isStaff = session.user.role === "ADMIN" || session.user.role === "STAFF";

  let conversationId: string | null = null;
  if (requestedId && isStaff) {
    conversationId = requestedId;
  } else {
    const conversation = await prisma.conversation.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    conversationId = conversation?.id ?? null;
  }

  if (!conversationId) {
    return NextResponse.json({
      messages: [],
      unread: 0,
      ticket: null,
      rateable: null,
      hasEarlier: false,
    });
  }

  // Older page for "Load earlier" — no unread/ticket bookkeeping needed.
  if (before) {
    const page = await getMessagePage(conversationId, before);
    return NextResponse.json({
      messages: page.messages.map(serialize),
      hasEarlier: page.hasEarlier,
    });
  }

  const isCustomerView = !(requestedId && isStaff);
  const [batch, ticket, rateable, unread] = await Promise.all([
    after
      ? getMessagesAfter(conversationId, after).then((messages) => ({
          messages,
          hasEarlier: undefined as boolean | undefined,
        }))
      : getMessagePage(conversationId),
    getOpenTicket(conversationId),
    isCustomerView ? getRateableTicket(conversationId) : Promise.resolve(null),
    isCustomerView ? getCustomerUnreadCount(session.user.id) : Promise.resolve(0),
  ]);

  return NextResponse.json({
    messages: batch.messages.map(serialize),
    unread,
    ticket: ticket ? { number: ticket.number, status: ticket.status } : null,
    rateable: rateable ? { id: rateable.id, number: rateable.number } : null,
    hasEarlier: batch.hasEarlier ?? undefined,
  });
}
