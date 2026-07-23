"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** Full URL in a selectable field with a one-tap copy button. */
export default function CopyLinkField({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard API unavailable (http, old browser) — fall back to selection.
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      el.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative">
      <input
        readOnly
        value={url}
        onFocus={(e) => e.currentTarget.select()}
        className="input-field w-full pr-10 text-xs"
      />
      <button
        type="button"
        onClick={copy}
        title={copied ? "Copied" : "Copy link"}
        aria-label={copied ? "Copied" : "Copy link"}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted transition-colors hover:bg-surface hover:text-foreground"
      >
        {copied ? (
          <Check className="h-4 w-4" style={{ color: "var(--brand)" }} />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
