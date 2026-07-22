import Link from "next/link";
import { ArrowLeft, Headset } from "lucide-react";
import { storeConfig } from "@/config/store";
import ThemeToggle from "@/components/ThemeToggle";

/**
 * Focused, full-screen chrome for the support chat — deliberately outside the
 * (storefront) layout so there's no search bar, footer, or bottom nav
 * competing for space. A compact header with a back button is all the
 * navigation the page needs; the conversation gets the rest of the viewport.
 */
export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh flex-col bg-background [padding-top:env(safe-area-inset-top)]">
      <header
        className="flex shrink-0 items-center justify-between border-b px-4 py-3"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/"
            aria-label="Back to store"
            className="rounded-full p-1.5 text-muted transition-colors hover:bg-surface hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ background: "var(--brand-soft)" }}
          >
            <Headset className="h-4 w-4" style={{ color: "var(--brand)" }} />
          </span>
          <div className="flex flex-col">
            <span className="font-display text-base font-semibold leading-tight">Support</span>
            <span className="text-[11px] text-muted">
              {storeConfig.name} · instant answers, agents on request
            </span>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <main className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col gap-3 px-4 py-3 [padding-bottom:calc(env(safe-area-inset-bottom)+0.75rem)]">
        {children}
      </main>
    </div>
  );
}
