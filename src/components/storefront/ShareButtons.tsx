"use client";

import { useEffect, useState } from "react";
import { Check, Link2 } from "lucide-react";

/** Official brand marks (simple-icons paths, CC0) — lucide dropped these. */
function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  );
}
function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden>
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}
function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

/**
 * "Share this product" row (Jumia-style) with real brand marks. Each network is
 * a real anchor (target=_blank) so Safari — which blocks `window.open()` called
 * after an await, or with a features string — navigates them natively like any
 * link. WhatsApp additionally offers the native share sheet when available.
 * Copy-link shows a "Copied!" overlay.
 */
export default function ShareButtons({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  // Resolved on the client after mount; empty during SSR so hrefs are stable.
  const [href, setHref] = useState("");

  useEffect(() => {
    setHref(window.location.href);
  }, []);

  const enc = encodeURIComponent;
  const waHref = `https://wa.me/?text=${enc(`${title} — ${href}`)}`;
  const xHref = `https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(href)}`;
  const tgHref = `https://t.me/share/url?url=${enc(href)}&text=${enc(title)}`;
  const fbHref = `https://www.facebook.com/sharer/sharer.php?u=${enc(href)}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(href || window.location.href);
    } catch {
      // Clipboard blocked — still flash the confirmation; the intents work regardless.
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  // WhatsApp: prefer the OS share sheet when present, but the anchor's own
  // href is the fallback — so nothing depends on a post-await window.open.
  function onWhatsApp(e: React.MouseEvent<HTMLAnchorElement>) {
    if (typeof navigator.share === "function") {
      e.preventDefault();
      navigator.share({ title, url: href || window.location.href }).catch(() => {
        // Sheet dismissed/failed — same-tab nav is always allowed on Safari.
        window.location.href = waHref;
      });
    }
    // Otherwise let the anchor navigate to wa.me normally.
  }

  const link =
    "flex h-9 w-9 items-center justify-center rounded-full border text-white transition-transform hover:scale-105 active:scale-95";

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
        Share this product
      </span>
      <div className="relative flex items-center gap-2">
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on WhatsApp"
          onClick={onWhatsApp}
          className={link}
          style={{ background: "#25D366", borderColor: "#25D366" }}
        >
          <WhatsAppIcon />
        </a>
        <a
          href={xHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on X"
          className={`${link} !text-[color:var(--background)]`}
          style={{ background: "var(--foreground)", borderColor: "var(--foreground)" }}
        >
          <XIcon />
        </a>
        <a
          href={tgHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on Telegram"
          className={link}
          style={{ background: "#26A5E4", borderColor: "#26A5E4" }}
        >
          <TelegramIcon />
        </a>
        <a
          href={fbHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on Facebook"
          className={link}
          style={{ background: "#1877F2", borderColor: "#1877F2" }}
        >
          <FacebookIcon />
        </a>
        <button
          type="button"
          aria-label="Copy link"
          onClick={copyLink}
          className="flex h-9 w-9 items-center justify-center rounded-full border text-foreground/80 transition-colors hover:bg-surface hover:text-foreground"
          style={{ borderColor: "var(--border)" }}
        >
          {copied ? (
            <Check className="h-4 w-4" style={{ color: "var(--brand)" }} />
          ) : (
            <Link2 className="h-4 w-4" />
          )}
        </button>

        {copied && (
          <span
            role="status"
            className="pointer-events-none absolute -top-9 right-0 rounded-lg px-2.5 py-1 text-xs font-medium shadow-lg"
            style={{ background: "var(--foreground)", color: "var(--background)" }}
          >
            Link copied!
          </span>
        )}
      </div>
    </div>
  );
}
