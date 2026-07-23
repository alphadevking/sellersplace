"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import PasswordInput from "@/components/PasswordInput";

/** Collapsible security card on the account page — change password in place. */
export default function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDone(false);
    if (next !== confirm) {
      setError("New passwords don't match.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not change password. Please try again.");
      } else {
        setDone(true);
        setCurrent("");
        setNext("");
        setConfirm("");
      }
    } catch {
      setError("Network error — please try again.");
    }
    setSubmitting(false);
  }

  return (
    <details className="card p-4">
      <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium">
        <KeyRound className="h-4 w-4" style={{ color: "var(--brand)" }} />
        Change password
      </summary>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
        <label className="field-label">
          Current password
          <PasswordInput value={current} onChange={setCurrent} autoComplete="current-password" />
        </label>
        <label className="field-label">
          New password
          <PasswordInput value={next} onChange={setNext} minLength={8} autoComplete="new-password" generate />
          <span className="text-[11px] text-muted">At least 8 characters.</span>
        </label>
        <label className="field-label">
          Confirm new password
          <PasswordInput value={confirm} onChange={setConfirm} minLength={8} autoComplete="new-password" />
        </label>

        {error && (
          <p className="alert-error text-xs" role="alert">
            {error}
          </p>
        )}
        {done && (
          <p
            className="rounded-lg p-2.5 text-xs font-medium"
            style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
            role="status"
          >
            Password updated.
          </p>
        )}

        <button type="submit" disabled={submitting} className="btn-outline justify-center">
          {submitting ? "Updating…" : "Update password"}
        </button>

        <Link
          href="/forgot-password"
          className="text-center text-xs text-muted hover:text-foreground"
        >
          Forgot your current password? Reset it by email.
        </Link>
      </form>
    </details>
  );
}
