"use client";

import { useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import PasswordInput from "@/components/PasswordInput";
import { deleteMyAccount } from "@/app/actions/account";

/**
 * Self-serve account deletion (NDPR right to erasure). Collapsed by default;
 * expands to a password-confirmed danger zone. Password-bearing accounts must
 * re-enter their password; passwordless accounts confirm by session alone.
 *
 * When `blockers` are present (pending orders, unpaid balance) deletion is
 * withheld — erasure can't be used to escape an obligation — and the reasons
 * are shown instead of the delete control.
 */
export default function DeleteAccountForm({
  hasPassword,
  passwordError,
  blockers = [],
}: {
  hasPassword: boolean;
  passwordError?: boolean;
  blockers?: string[];
}) {
  const [confirming, setConfirming] = useState(passwordError ?? false);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const blocked = blockers.length > 0;

  if (blocked) {
    return (
      <details className="rounded-2xl p-4" style={{ background: "var(--surface)" }}>
        <summary className="flex cursor-pointer items-center gap-1.5 text-xs text-muted">
          <Trash2 className="h-3.5 w-3.5" /> Delete my account
        </summary>
        <div className="mt-3 flex flex-col gap-2">
          <p className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--danger)" }}>
            <AlertTriangle className="h-3.5 w-3.5" /> Account deletion is on hold
          </p>
          <ul className="flex flex-col gap-1.5">
            {blockers.map((reason) => (
              <li key={reason} className="text-xs text-foreground/80">
                • {reason}
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-muted">
            Once resolved, you&apos;ll be able to delete your account here. Contact
            support if you need help.
          </p>
        </div>
      </details>
    );
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="flex items-center justify-center gap-1.5 self-center text-xs text-muted transition-colors hover:text-foreground"
      >
        <Trash2 className="h-3.5 w-3.5" /> Delete my account
      </button>
    );
  }

  return (
    <form
      action={deleteMyAccount}
      onSubmit={() => setSubmitting(true)}
      className="flex flex-col gap-3 rounded-2xl p-4"
      style={{ background: "var(--danger-soft)" }}
    >
      <div className="flex flex-col gap-1">
        <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--danger)" }}>
          <Trash2 className="h-4 w-4" /> Delete account
        </span>
        <p className="text-xs text-foreground/80">
          This permanently removes your personal data. Records tied to past
          orders are kept for accounting but anonymized. This can&apos;t be undone.
        </p>
      </div>

      {hasPassword && (
        <label className="field-label">
          Confirm your password
          <PasswordInput value={password} onChange={setPassword} autoComplete="current-password" />
        </label>
      )}

      {passwordError && (
        <p className="alert-error text-xs" role="alert">
          Incorrect password. Please try again.
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={submitting}
          className="btn-outline"
        >
          Keep account
        </button>
        <button
          type="submit"
          disabled={submitting || (hasPassword && password.length === 0)}
          className="rounded-full px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          style={{ background: "var(--danger)" }}
        >
          {submitting ? "Deleting…" : "Delete permanently"}
        </button>
      </div>
    </form>
  );
}
