import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getCustomerUnreadCount,
  getMessagesAfter,
  getOpenTicket,
} from "@/lib/chat";

/**
 * Poll endpoint for the support chat. Customers get their own thread;
 * ADMIN/STAFF may pass ?conversationId= to read any thread (admin inbox).
 * Query: ?after=<ISO timestamp> returns only newer messages.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const after = req.nextUrl.searchParams.get("after") || undefined;
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
    return NextResponse.json({ messages: [], unread: 0, ticket: null });
  }

  const [messages, ticket, unread] = await Promise.all([
    getMessagesAfter(conversationId, after),
    getOpenTicket(conversationId),
    requestedId && isStaff ? Promise.resolve(0) : getCustomerUnreadCount(session.user.id),
  ]);

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      sender: m.sender,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
    })),
    unread,
    ticket: ticket ? { number: ticket.number, status: ticket.status } : null,
  });
}
