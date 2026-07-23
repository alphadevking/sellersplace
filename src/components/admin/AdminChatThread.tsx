"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ChevronDown, Send, ThumbsDown, ThumbsUp, Ticket as TicketIcon } from "lucide-react";
import { adminReply, resolveTicket } from "@/app/actions/chat";
import { TICKET_STYLE } from "@/components/admin/ticketStyles";

type Message = {
  id: string;
  sender: "CUSTOMER" | "STORE" | "BOT";
  body: string;
  ticketId: string | null;
  createdAt: string;
};

type Ticket = {
  id: string;
  number: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  rating: number | null;
  openedAt: string;
  resolvedAt: string | null;
};

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short" });

const POLL_MS = 5_000;

/** Admin-side thread: live-polls new messages, replies, resolves tickets. */
export default function AdminChatThread({
  conversationId,
  customer,
  tickets,
  initialMessages,
}: {
  conversationId: string;
  customer: { name: string | null; email: string; phone: string | null };
  tickets: Ticket[];
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticketList, setTicketList] = useState(tickets);
  const [showTickets, setShowTickets] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<string | undefined>(
    initialMessages.length ? initialMessages[initialMessages.length - 1].createdAt : undefined
  );

  const openTicket = ticketList.find((t) => t.status !== "RESOLVED");

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
    });
  }, []);

  const poll = useCallback(async () => {
    try {
      const qs = new URLSearchParams({ conversationId });
      if (cursorRef.current) qs.set("after", cursorRef.current);
      const res = await fetch(`/api/chat?${qs.toString()}`);
      if (!res.ok) return;
      const data = (await res.json()) as { messages: Message[] };
      if (data.messages.length > 0) {
        cursorRef.current = data.messages[data.messages.length - 1].createdAt;
        setMessages((prev) => {
          const seen = new Set(prev.map((m) => m.id));
          return [...prev, ...data.messages.filter((m) => !seen.has(m.id))];
        });
        scrollToEnd();
      }
    } catch {
      // Retry on next tick.
    }
  }, [conversationId, scrollToEnd]);

  useEffect(() => {
    scrollToEnd();
    const interval = setInterval(poll, POLL_MS);
    return () => clearInterval(interval);
  }, [poll, scrollToEnd]);

  async function handleSend() {
    const body = input.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    setInput("");
    const result = await adminReply(conversationId, body);
    if (!result.ok) setError(result.error || "Failed to send.");
    // Reflect OPEN → IN_PROGRESS locally; the poll picks up the message row.
    setTicketList((prev) =>
      prev.map((t) => (t.status === "OPEN" ? { ...t, status: "IN_PROGRESS" as const } : t))
    );
    await poll();
    setSending(false);
  }

  /** Toggle a ticket filter and jump to its first message in the thread. */
  function selectTicket(id: string) {
    const next = selectedTicketId === id ? null : id;
    setSelectedTicketId(next);
    if (next) {
      const first = messages.find((m) => m.ticketId === next);
      if (first) {
        requestAnimationFrame(() => {
          listRef.current
            ?.querySelector(`[data-mid="${first.id}"]`)
            ?.scrollIntoView({ block: "center", behavior: "smooth" });
        });
      }
    }
  }

  async function handleResolve() {
    if (!openTicket || sending) return;
    setSending(true);
    const result = await resolveTicket(openTicket.id);
    if (!result.ok) setError(result.error || "Failed to resolve.");
    setTicketList((prev) =>
      prev.map((t) => (t.id === openTicket.id ? { ...t, status: "RESOLVED" as const } : t))
    );
    await poll();
    setSending(false);
  }

  return (
    <div className="flex h-[calc(100vh-11rem)] flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/chat"
            aria-label="Back to inbox"
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex flex-col">
            <h1 className="text-base font-semibold">{customer.name || customer.email}</h1>
            <span className="text-xs text-muted">
              {customer.email}
              {customer.phone ? ` · ${customer.phone}` : ""}
              {openTicket ? ` · ${openTicket.number}` : ""}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {ticketList.length > 0 && (
            <button
              type="button"
              onClick={() => setShowTickets((v) => !v)}
              className="btn-ghost px-3 py-2 text-xs"
              aria-expanded={showTickets}
            >
              <TicketIcon className="h-3.5 w-3.5" /> Tickets ({ticketList.length})
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${showTickets ? "rotate-180" : ""}`}
              />
            </button>
          )}
          {openTicket && (
            <button
              type="button"
              onClick={handleResolve}
              disabled={sending}
              className="btn-outline px-3 py-2 text-xs"
            >
              <Check className="h-3.5 w-3.5" /> Resolve {openTicket.number}
            </button>
          )}
        </div>
      </div>

      {/* Ticket history — tap one to spotlight its slice of the thread */}
      {showTickets && (
        <div
          className="card flex max-h-44 flex-col divide-y overflow-y-auto [&>*]:border-[var(--border)]"
          style={{ borderColor: "var(--border)" }}
        >
          {ticketList.map((t) => {
            const s = TICKET_STYLE[t.status];
            const sel = t.id === selectedTicketId;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => selectTicket(t.id)}
                aria-pressed={sel}
                className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-left text-xs transition-colors hover:bg-surface"
                style={sel ? { background: "var(--brand-soft)" } : undefined}
              >
                <span className="flex items-center gap-2 font-medium">
                  {t.number}
                  {t.rating != null &&
                    (t.rating >= 3 ? (
                      <ThumbsUp className="h-3.5 w-3.5" style={{ color: "#16a34a" }} aria-label="Rated positive" />
                    ) : (
                      <ThumbsDown className="h-3.5 w-3.5" style={{ color: "#dc2626" }} aria-label="Rated negative" />
                    ))}
                </span>
                <span className="flex shrink-0 items-center gap-2 text-muted">
                  {shortDate(t.openedAt)}
                  {t.resolvedAt ? ` → ${shortDate(t.resolvedAt)}` : ""}
                  <span
                    className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                    style={{ background: s.bg, color: s.fg }}
                  >
                    {s.label}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div
        ref={listRef}
        className="card flex-1 space-y-2.5 overflow-y-auto overscroll-contain p-4"
      >
        {messages.map((m) => {
          const store = m.sender !== "CUSTOMER";
          const dimmed = selectedTicketId != null && m.ticketId !== selectedTicketId;
          return (
            <div
              key={m.id}
              data-mid={m.id}
              className={`flex transition-opacity ${store ? "justify-end" : "justify-start"} ${
                dimmed ? "opacity-30" : ""
              }`}
            >
              <div
                className={`max-w-[75%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                  store ? "rounded-br-md text-brand-foreground" : "rounded-bl-md bg-surface"
                }`}
                style={store ? { background: "var(--brand)" } : undefined}
              >
                <span
                  className={`mb-0.5 block text-[10px] font-semibold uppercase tracking-wide ${
                    store ? "text-brand-foreground/70" : "text-muted"
                  }`}
                >
                  {m.sender === "CUSTOMER"
                    ? customer.name || customer.email
                    : m.sender === "BOT"
                      ? "Bot"
                      : "You"}
                </span>
                {m.body}
                <span
                  className={`mt-1 block text-[10px] ${store ? "text-brand-foreground/60" : "text-muted"}`}
                >
                  {new Date(m.createdAt).toLocaleString("en-NG", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <p className="alert-error text-xs" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleSend();
            }
          }}
          placeholder="Reply to the customer…"
          className="input-field flex-1"
          disabled={sending}
        />
        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={sending || !input.trim()}
          aria-label="Send reply"
          className="btn-primary p-3"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
