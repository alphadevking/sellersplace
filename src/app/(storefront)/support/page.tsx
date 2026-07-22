import { Headset } from "lucide-react";
import { auth } from "@/lib/auth";
import { storeConfig } from "@/config/store";
import ChatConversation from "@/components/storefront/ChatConversation";

export const metadata = { title: "Support" };

/**
 * Dedicated full-page support chat — the same conversation as the floating
 * widget (shared ChatConversation), with room to breathe. The widget hides
 * itself on this route to avoid two copies polling side by side.
 */
export default async function SupportPage() {
  const session = await auth();

  return (
    // Admin-thread structure: viewport-fit column — header, then a card list
    // that scrolls internally, then the pinned composer row.
    <div className="mx-auto flex h-[calc(100dvh-18.5rem)] min-h-[420px] w-full max-w-2xl flex-col gap-4 lg:h-[calc(100dvh-15rem)]">
      <div className="flex shrink-0 items-center gap-3">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-full"
          style={{ background: "var(--brand-soft)" }}
        >
          <Headset className="h-5 w-5" style={{ color: "var(--brand)" }} />
        </span>
        <div className="flex flex-col">
          <h1 className="section-title">Support</h1>
          <p className="text-sm text-muted">
            Instant answers from {storeConfig.name} — and real agents when you need one.
          </p>
        </div>
      </div>

      <ChatConversation signedIn={!!session?.user} variant="page" />
    </div>
  );
}
