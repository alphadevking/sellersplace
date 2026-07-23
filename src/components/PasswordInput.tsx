"use client";

import { useState } from "react";
import { Check, Eye, EyeOff, Sparkles } from "lucide-react";
import { generatePassword } from "@/lib/password";

/**
 * Password field with a show/hide toggle. When `generate` is set (new-password
 * contexts — signup, reset, change), it also offers a "suggest strong
 * password" button that fills a crypto-secure password, reveals it, and copies
 * it to the clipboard so it can be saved or pasted into a confirm field.
 */
export default function PasswordInput({
  value,
  onChange,
  minLength,
  autoComplete,
  generate = false,
}: {
  value: string;
  onChange: (value: string) => void;
  minLength?: number;
  autoComplete?: string;
  generate?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  async function suggest() {
    const pwd = generatePassword(16);
    onChange(pwd);
    setVisible(true);
    try {
      await navigator.clipboard.writeText(pwd);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard blocked (insecure context) — the revealed value is enough.
    }
  }

  // Reserve right-edge room for one or two icon buttons.
  const padRight = generate ? "pr-16" : "pr-10";

  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        required
        minLength={minLength}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`input-field w-full ${padRight}`}
      />
      <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
        {generate && (
          <button
            type="button"
            onClick={suggest}
            aria-label="Suggest a strong password"
            title="Suggest a strong password"
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface hover:text-foreground"
          >
            {copied ? (
              <Check className="h-4 w-4" style={{ color: "var(--brand)" }} />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
          </button>
        )}
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface hover:text-foreground"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
