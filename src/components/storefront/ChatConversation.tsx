"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessageCircle, Send } from "lucide-react";
import { FAQ_TOPICS } from "@/config/faq";
import { storeConfig, whatsappLink } from "@/config/store";
import {
  askFaqTopic,
  markChatRead,
  requestAgent,
  sendChatMessage,
} from "@/app/actions/chat";

type Message = {
  id: string;
  sender: "CUSTOMER" | "STORE" | "BOT";
  body: string;
  createdAt: string;
};

type TicketInfo = { number: string; status: "OPEN" | "IN_PROGRESS" | "RESOLVED" } | null;

const POLL_MS = 4_000;

/**
 * The support conversation — message list, quick replies, composer, escalation
 * and WhatsApp links. Shared between the floating ChatWidget panel and the
 * dedicated /support page. Both variants are regular chat interfaces (list
 * scrolls internally, composer pinned); they differ only in chrome:
 *   "panel" — borderless internals for the widget's bordered shell.
 *   "page"  — admin-thread structure: the list is its own card, the composer
 *             row sits below it.
 * Polls while mounted, so mount it only when the conversation is on screen.
 */
export default function ChatConversation({
  signedIn,
  prefill,
  prefillNonce = 0,
  variant = "panel",
}: {
  signedIn: boolean;
  /** Composer prefill (e.g. from the PDP "Message us" button). */
  prefill?: string;
  /** Bump to re-apply the same prefill text. */
  prefillNonce?: number;
  variant?: "panel" | "page";
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [ticket, setTicket] = useState<TicketInfo>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<string | undefined>(undefined);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
    });
  }, []);

  const poll = useCallback(async () => {
    if (!signedIn) return;
    try {
      const qs = cursorRef.current ? `?after=${encodeURIComponent(cursorRef.current)}` : "";
      const res = await fetch(`/api/chat${qs}`);
      if (!res.ok) return;
      const data = (await res.json()) as { messages: Message[]; ticket: TicketInfo };
      setTicket(data.ticket);
      if (data.messages.length > 0) {
        cursorRef.current = data.messages[data.messages.length - 1].createdAt;
        setMessages((prev) => {
          // Server rows are the source of truth — drop optimistic echoes
          // (tmp- ids) before merging so a sent message never shows twice.
          const base = prev.filter((m) => !m.id.startsWith("tmp-"));
          const seen = new Set(base.map((m) => m.id));
          return [...base, ...data.messages.filter((m) => !seen.has(m.id))];
        });
        scrollToEnd();
        void markChatRead();
      }
    } catch {
      // Network blip — the next poll retries.
    }
  }, [signedIn, scrollToEnd]);

  useEffect(() => {
    if (!signedIn) return;
    void poll();
    void markChatRead();
    const interval = setInterval(poll, POLL_MS);
    const onFocus = () => void poll();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [signedIn, poll]);

  useEffect(() => {
    if (prefill) setInput(prefill);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill, prefillNonce]);

  async function runAction(action: () => Promise<{ ok: boolean; error?: string }>) {
    setSending(true);
    setError(null);
    const result = await action();
    if (!result.ok) {
      setError(result.error || "Something went wrong.");
      // The message never persisted — remove its optimistic echo.
      setMessages((prev) => prev.filter((m) => !m.id.startsWith("tmp-")));
    }
    await poll();
    setSending(false);
    scrollToEnd();
  }

  function handleSend() {
    const body = input.trim();
    if (!body || sending) return;
    setInput("");
    // Optimistic echo — replaced by the persisted row on the next poll.
    setMessages((prev) => [
      ...prev,
      {
        id: `tmp-${Date.now()}`,
        sender: "CUSTOMER",
        body,
        createdAt: new Date().toISOString(),
      },
    ]);
    scrollToEnd();
    void runAction(() => sendChatMessage(body));
  }

  const waHref = whatsappLink(`Hi ${storeConfig.name}! I need some help.`);
  const showQuickReplies = messages.length === 0 && signedIn;

  if (!signedIn) {
    return (
      <div
        className={`flex flex-col items-center gap-4 px-6 text-center ${
          variant === "page" ? "py-16" : "flex-1 justify-center"
        }`}
      >
        <p className="text-sm text-muted">
          Sign in to message us in-app and keep your conversation across devices.
        </p>
        <Link
          href="/login?callbackUrl=/support"
          className="btn-primary btn-pill w-full max-w-xs justify-center"
        >
          Sign in
        </Link>
        {waHref && (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline btn-pill w-full max-w-xs justify-center"
          >
            <MessageCircle className="h-4 w-4" /> Chat on WhatsApp instead
          </a>
        )}
      </div>
    );
  }

  const listContent = (
    <>
      {/* Greeting (not persisted) */}
      <Bubble sender="BOT">
        {`👋 Welcome to ${storeConfig.name}. Pick a topic below or type a question — and you can ask for an agent anytime.`}
      </Bubble>
      {messages.map((m) => (
        <Bubble key={m.id} sender={m.sender} at={m.createdAt}>
          {m.body}
        </Bubble>
      ))}
      {showQuickReplies && (
        <div className="flex flex-wrap gap-2 pt-1">
          {FAQ_TOPICS.map((t) => (
            <button
              key={t.id}
              type="button"
              disabled={sending}
              onClick={() => void runAction(() => askFaqTopic(t.id))}
              className="chip transition-colors hover:bg-surface disabled:opacity-50"
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
    </>
  );

  const composer = (
    <div className="flex items-center gap-2">
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        placeholder="Type a message…"
        className="input-field flex-1 rounded-full"
        disabled={sending}
      />
      <button
        type="button"
        onClick={handleSend}
        disabled={sending || !input.trim()}
        aria-label="Send message"
        className="btn-primary rounded-full p-3"
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  );

  const secondaryActions = (
    <div className="flex items-center justify-between px-1">
      {!ticket || ticket.status === "RESOLVED" ? (
        <button
          type="button"
          disabled={sending}
          onClick={() => void runAction(() => requestAgent())}
          className="text-xs font-medium transition-colors hover:opacity-80"
          style={{ color: "var(--brand)" }}
        >
          Talk to an agent
        </button>
      ) : (
        <span className="text-[11px] text-muted">An agent will reply here</span>
      )}
      {waHref && (
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted transition-colors hover:text-foreground"
        >
          Continue on WhatsApp
        </a>
      )}
    </div>
  );

  if (variant === "page") {
    // Admin-thread structure: card list with internal scroll, composer below.
    return (
      <>
        {ticket && ticket.status !== "RESOLVED" && (
          <div
            className="shrink-0 rounded-xl px-4 py-2 text-[11px] font-medium"
            style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
          >
            Ticket {ticket.number} ·{" "}
            {ticket.status === "OPEN" ? "waiting for an agent" : "an agent is on it"}
          </div>
        )}

        <div
          ref={listRef}
          className="card flex-1 space-y-2.5 overflow-y-auto overscroll-contain p-4"
        >
          {listContent}
        </div>

        {error && (
          <p className="alert-error text-xs" role="alert">
            {error}
          </p>
        )}

        <div className="flex shrink-0 flex-col gap-2">
          {composer}
          {secondaryActions}
        </div>
      </>
    );
  }

  // Widget panel: borderless internals inside the panel's bordered shell.
  return (
    <>
      {ticket && ticket.status !== "RESOLVED" && (
        <div
          className="border-b px-4 py-2 text-[11px] font-medium"
          style={{ borderColor: "var(--border)", background: "var(--brand-soft)", color: "var(--brand)" }}
        >
          Ticket {ticket.number} ·{" "}
          {ticket.status === "OPEN" ? "waiting for an agent" : "an agent is on it"}
        </div>
      )}

      <div ref={listRef} className="flex-1 space-y-2.5 overflow-y-auto overscroll-contain px-4 py-3">
        {listContent}
      </div>

      {error && (
        <p className="alert-error mx-4 mb-2 text-xs" role="alert">
          {error}
        </p>
      )}

      <div
        className="flex flex-col gap-2 border-t px-3 py-2.5"
        style={{ borderColor: "var(--border)" }}
      >
        {composer}
        {secondaryActions}
      </div>
    </>
  );
}

function Bubble({
  sender,
  at,
  children,
}: {
  sender: "CUSTOMER" | "STORE" | "BOT";
  /** ISO timestamp — omitted for the ephemeral greeting bubble. */
  at?: string;
  children: React.ReactNode;
}) {
  const mine = sender === "CUSTOMER";
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
          mine ? "rounded-br-md text-brand-foreground" : "rounded-bl-md bg-surface"
        }`}
        style={mine ? { background: "var(--brand)" } : undefined}
      >
        {sender !== "CUSTOMER" && (
          <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-muted">
            {sender === "BOT" ? "Assistant · automated" : "Support Team Agent"}
          </span>
        )}
        {children}
        {at && (
          <span
            className={`mt-1 block text-[10px] ${
              mine ? "text-brand-foreground/60" : "text-muted"
            }`}
          >
            {new Date(at).toLocaleString("en-NG", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>
    </div>
  );
}
