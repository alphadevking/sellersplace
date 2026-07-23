import Link from "next/link";
import { Headset, ThumbsDown, ThumbsUp } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { getAdminInbox } from "@/lib/chat";
import { TICKET_STYLE } from "@/components/admin/ticketStyles";

export const metadata = { title: "Support chat" };

export default async function AdminChatPage() {
  await requireAdmin("/admin/chat");
  const conversations = await getAdminInbox();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">Support chat</h1>
        <p className="text-sm text-muted">
          Escalated conversations — customers who asked for an agent. FAQ/bot-only
          chats don&apos;t appear here.
        </p>
      </div>

      {conversations.length === 0 ? (
        <div className="card-surface flex flex-col items-center gap-3 p-10 text-center">
          <Headset className="h-8 w-8" style={{ color: "var(--muted)" }} />
          <p className="text-sm text-muted">
            No tickets yet. When a customer taps &ldquo;Talk to an agent&rdquo;, the
            thread lands here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {conversations.map((c) => {
            const ticket = c.tickets[0];
            const last = c.messages[0];
            const unread =
              last &&
              last.sender === "CUSTOMER" &&
              (!c.adminLastReadAt || last.createdAt > c.adminLastReadAt);
            const style = ticket ? TICKET_STYLE[ticket.status] : undefined;
            return (
              <Link
                key={c.id}
                href={`/admin/chat/${c.id}`}
                className="card flex items-center gap-3 p-4 transition-colors hover:bg-surface"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {c.user.name || c.user.email}
                    {c.user.name && (
                      <span className="truncate text-xs font-normal text-muted">
                        {c.user.email}
                      </span>
                    )}
                    {unread && (
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: "var(--brand)" }}
                        aria-label="Unread"
                      />
                    )}
                  </span>
                  <span className="truncate text-xs text-muted">
                    {last ? `${last.sender === "CUSTOMER" ? "" : "You: "}${last.body}` : "No messages yet"}
                  </span>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {ticket && style && (
                    <span className="flex items-center gap-1.5">
                      {ticket.rating != null &&
                        (ticket.rating >= 3 ? (
                          <ThumbsUp className="h-3.5 w-3.5" style={{ color: "#16a34a" }} aria-label="Rated positive" />
                        ) : (
                          <ThumbsDown className="h-3.5 w-3.5" style={{ color: "#dc2626" }} aria-label="Rated negative" />
                        ))}
                      <span
                        className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                        style={{ background: style.bg, color: style.fg }}
                      >
                        {ticket.number} · {style.label}
                      </span>
                    </span>
                  )}
                  <span className="text-[11px] text-muted">
                    {c.lastMessageAt.toLocaleString("en-NG", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
