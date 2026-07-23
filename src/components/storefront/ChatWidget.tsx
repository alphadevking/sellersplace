"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Headset, Maximize2 } from "lucide-react";
import { storeConfig } from "@/config/store";
import ChatConversation from "@/components/storefront/ChatConversation";
import CountBadge from "@/components/storefront/CountBadge";

const BADGE_POLL_MS = 30_000;

/**
 * Floating support launcher + slide-in panel. The conversation itself lives in
 * ChatConversation (shared with the dedicated /support page); this shell owns
 * the launcher, the closed-state unread badge, and the PDP open-chat event.
 */
export default function ChatWidget({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [prefill, setPrefill] = useState<string | undefined>(undefined);
  const [prefillNonce, setPrefillNonce] = useState(0);
  const pathname = usePathname();

  // Closed-state badge poll: cursor pinned to "now" so no message payload comes
  // back — just the unread count.
  const pollUnread = useCallback(async () => {
    if (!signedIn) return;
    try {
      const res = await fetch(`/api/chat?after=${encodeURIComponent(new Date().toISOString())}`);
      if (!res.ok) return;
      const data = (await res.json()) as { unread: number };
      setUnread(data.unread);
    } catch {
      // Retry next tick.
    }
  }, [signedIn]);

  useEffect(() => {
    if (!signedIn || open) return;
    void pollUnread();
    const interval = setInterval(pollUnread, BADGE_POLL_MS);
    const onFocus = () => void pollUnread();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [signedIn, open, pollUnread]);

  // PDP "Message us" → open with an optional composer prefill.
  useEffect(() => {
    function onOpenChat(e: Event) {
      const detail = (e as CustomEvent<{ prefill?: string }>).detail;
      setOpen(true);
      if (detail?.prefill) {
        setPrefill(detail.prefill);
        setPrefillNonce((n) => n + 1);
      }
    }
    window.addEventListener("sellersplace:openchat", onOpenChat);
    return () => window.removeEventListener("sellersplace:openchat", onOpenChat);
  }, []);

  useEffect(() => {
    if (open) setUnread(0);
  }, [open]);

  // The dedicated page renders the same conversation — hide the widget there.
  if (pathname.startsWith("/support")) return null;

  return (
    <>
      {/* Launcher */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close support chat" : "Chat with support"}
        className="btn-primary fixed bottom-20 right-4 z-50 flex items-center gap-2 rounded-full px-4 py-3 shadow-lg md:bottom-6 md:right-6 [margin-bottom:env(safe-area-inset-bottom)]"
      >
        {open ? <X className="h-5 w-5" /> : <Headset className="h-5 w-5" />}
        <span className="hidden text-sm font-medium sm:inline">Support</span>
        {!open && <CountBadge count={unread} />}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="fixed inset-x-3 bottom-36 top-24 z-50 flex flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl md:inset-auto md:bottom-24 md:right-6 md:h-[560px] md:w-[380px] [margin-bottom:env(safe-area-inset-bottom)]"
          style={{ borderColor: "var(--border)" }}
          role="dialog"
          aria-label="Support chat"
        >
          {/* Header */}
          <div
            className="flex items-center justify-between border-b px-4 py-3"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full"
                style={{ background: "var(--brand-soft)" }}
              >
                <Headset className="h-4 w-4" style={{ color: "var(--brand)" }} />
              </span>
              <div className="flex flex-col">
                <span className="font-display text-sm font-semibold">
                  {storeConfig.name} support
                </span>
                <span className="text-[11px] text-muted">
                  Instant answers · agents on request
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Link
                href="/support"
                onClick={() => setOpen(false)}
                aria-label="Open full support page"
                className="rounded-full p-1.5 text-muted transition-colors hover:bg-surface hover:text-foreground"
              >
                <Maximize2 className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="rounded-full p-1.5 text-muted transition-colors hover:bg-surface hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <ChatConversation signedIn={signedIn} prefill={prefill} prefillNonce={prefillNonce} />
        </div>
      )}
    </>
  );
}
