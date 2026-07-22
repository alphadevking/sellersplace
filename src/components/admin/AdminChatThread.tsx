"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Send } from "lucide-react";
import { adminReply, resolveTicket } from "@/app/actions/chat";

type Message = {
  id: string;
  sender: "CUSTOMER" | "STORE" | "BOT";
  body: string;
  createdAt: string;
};

type Ticket = { id: string; number: string; status: "OPEN" | "IN_PROGRESS" | "RESOLVED" };

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

      <div
        ref={listRef}
        className="card flex-1 space-y-2.5 overflow-y-auto overscroll-contain p-4"
      >
        {messages.map((m) => {
          const store = m.sender !== "CUSTOMER";
          return (
            <div key={m.id} className={`flex ${store ? "justify-end" : "justify-start"}`}>
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
