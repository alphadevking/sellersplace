"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import LoadingOverlay from "@/components/LoadingOverlay";
import PasswordInput from "@/components/PasswordInput";

/**
 * Password reset by email code. Two steps: request a code, then submit the
 * code + a new password. On success the user is signed straight in.
 */
export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"email" | "reset" | "unavailable">("email");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/auth/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, purpose: "PASSWORD_RESET" }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong. Please try again.");
      return;
    }
    if (data.required === false) {
      // Email isn't configured on this deployment — reset by code isn't possible.
      setStep("unavailable");
      return;
    }
    setStep("reset");
  }

  async function submitReset(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Could not reset password. Please try again.");
      setSubmitting(false);
      return;
    }
    await signIn("credentials", { email, password, redirect: false });
    router.push("/account");
    router.refresh();
  }

  if (step === "unavailable") {
    return (
      <div className="card flex flex-col gap-4 p-6 text-center">
        <h1 className="font-display text-2xl font-semibold tracking-[-0.01em]">Reset password</h1>
        <p className="text-sm text-muted">
          Password reset by email isn&apos;t available on this store yet. Please contact
          support to recover your account.
        </p>
        <Link href="/login" className="btn-outline justify-center">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="card flex flex-col gap-5 p-6">
      <LoadingOverlay show={submitting} label={step === "reset" ? "Resetting…" : "Please wait…"} />

      {step === "email" ? (
        <>
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-2xl font-semibold tracking-[-0.01em]">Forgot password</h1>
            <p className="text-sm text-muted">
              Enter your email and we&apos;ll send a code to reset your password.
            </p>
          </div>
          <form onSubmit={requestCode} className="flex flex-col gap-4">
            <label className="field-label">
              Email
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
              />
            </label>
            {error && <p className="alert-error" role="alert">{error}</p>}
            <button type="submit" disabled={submitting} className="btn-primary justify-center">
              {submitting ? "Please wait…" : "Send reset code"}
            </button>
          </form>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-2xl font-semibold tracking-[-0.01em]">Reset password</h1>
            <p className="text-sm text-muted">
              Enter the 6-digit code sent to{" "}
              <span className="font-medium text-foreground">{email}</span> and choose a new
              password. If you don&apos;t have an account, no code was sent.
            </p>
          </div>
          <form onSubmit={submitReset} className="flex flex-col gap-4">
            <label className="field-label">
              Verification code
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="input-field text-center text-2xl tracking-[0.5em]"
                placeholder="000000"
              />
            </label>
            <label className="field-label">
              New password
              <PasswordInput
                value={password}
                onChange={setPassword}
                minLength={8}
                autoComplete="new-password"
              />
              <span className="text-[11px] text-muted">At least 8 characters.</span>
            </label>
            {error && <p className="alert-error" role="alert">{error}</p>}
            <button
              type="submit"
              disabled={submitting || code.length !== 6 || password.length < 8}
              className="btn-primary justify-center disabled:opacity-60"
            >
              {submitting ? "Resetting…" : "Reset password"}
            </button>
          </form>
        </>
      )}

      <p className="text-center text-sm text-muted">
        Remembered it?{" "}
        <Link href="/login" className="font-medium" style={{ color: "var(--brand)" }}>
          Sign in
        </Link>
      </p>
    </div>
  );
}
