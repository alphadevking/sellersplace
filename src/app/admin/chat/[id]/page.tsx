import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { adminMarkRead } from "@/app/actions/chat";
import AdminChatThread from "@/components/admin/AdminChatThread";

export const metadata = { title: "Support thread" };

export default async function AdminChatThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin("/admin/chat");
  const { id } = await params;

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      tickets: { orderBy: { openedAt: "desc" } },
      messages: { orderBy: { createdAt: "asc" }, take: 200 },
    },
  });
  if (!conversation) notFound();

  await adminMarkRead(conversation.id);

  return (
    <AdminChatThread
      conversationId={conversation.id}
      customer={{
        name: conversation.user.name,
        email: conversation.user.email,
        phone: conversation.user.phone,
      }}
      tickets={conversation.tickets.map((t) => ({
        id: t.id,
        number: t.number,
        status: t.status,
      }))}
      initialMessages={conversation.messages.map((m) => ({
        id: m.id,
        sender: m.sender,
        body: m.body,
        createdAt: m.createdAt.toISOString(),
      }))}
    />
  );
}
