"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import LoadingOverlay from "@/components/LoadingOverlay";
import PasswordInput from "@/components/PasswordInput";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [agreed, setAgreed] = useState(false);
  const [code, setCode] = useState("");
  // "details" collects the account; "code" verifies the email before creating it.
  const [step, setStep] = useState<"details" | "code">("details");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function createAccount(verificationCode?: string) {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, agreed, code: verificationCode }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Something went wrong. Please try again.");
      setSubmitting(false);
      return;
    }
    // Auto sign-in right after creating the account.
    await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });
    router.push("/account");
    router.refresh();
  }

  // Step 1: validate inputs, then either request an email code or (when email
  // isn't configured) create the account straight away.
  async function handleDetails(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/auth/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.email, purpose: "SIGNUP" }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Could not start signup. Please try again.");
      setSubmitting(false);
      return;
    }
    if (data.required === false) {
      // No email verification on this deployment — create the account now.
      await createAccount();
      return;
    }
    setStep("code");
    setSubmitting(false);
  }

  // Step 2: submit the code (server verifies it and creates the account).
  async function handleCode(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    await createAccount(code);
  }

  async function resend() {
    setError(null);
    await fetch("/api/auth/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.email, purpose: "SIGNUP" }),
    });
  }

  return (
    <div className="card flex flex-col gap-5 p-6">
      <LoadingOverlay show={submitting} label={step === "code" ? "Verifying…" : "Please wait…"} />

      {step === "details" ? (
        <>
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-2xl font-semibold tracking-[-0.01em]">Create your account</h1>
            <p className="text-sm text-muted">
              Save your details for faster checkout and order tracking.
            </p>
          </div>

          <form onSubmit={handleDetails} className="flex flex-col gap-4">
            <label className="field-label">
              Full name
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-field"
              />
            </label>
            <label className="field-label">
              Email
              <input
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-field"
              />
            </label>
            <label className="field-label">
              Password
              <PasswordInput
                value={form.password}
                onChange={(password) => setForm({ ...form, password })}
                minLength={8}
                autoComplete="new-password"
                generate
              />
              <span className="text-[11px] text-muted">At least 8 characters.</span>
            </label>

            <label className="flex items-start gap-2.5 text-xs leading-relaxed text-muted">
              <input
                type="checkbox"
                required
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-3.5 w-3.5 shrink-0"
              />
              <span>
                I have read and agree to the{" "}
                <Link href="/terms" target="_blank" className="font-medium underline hover:text-foreground">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" target="_blank" className="font-medium underline hover:text-foreground">
                  Privacy Policy
                </Link>
                , including how my personal data is handled under the NDPR.
              </span>
            </label>

            {error && <p className="alert-error" role="alert">{error}</p>}

            <button
              type="submit"
              disabled={submitting || !agreed}
              className="btn-primary justify-center disabled:opacity-60"
            >
              {submitting ? "Please wait…" : "Continue"}
            </button>
          </form>

          <p className="text-center text-sm text-muted">
            Already have an account?{" "}
            <Link href="/login" className="font-medium" style={{ color: "var(--brand)" }}>
              Sign in
            </Link>
          </p>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-2xl font-semibold tracking-[-0.01em]">Verify your email</h1>
            <p className="text-sm text-muted">
              We sent a 6-digit code to <span className="font-medium text-foreground">{form.email}</span>.
              Enter it to finish creating your account.
            </p>
          </div>

          <form onSubmit={handleCode} className="flex flex-col gap-4">
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

            {error && <p className="alert-error" role="alert">{error}</p>}

            <button
              type="submit"
              disabled={submitting || code.length !== 6}
              className="btn-primary justify-center disabled:opacity-60"
            >
              {submitting ? "Verifying…" : "Create account"}
            </button>
          </form>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => {
                setStep("details");
                setCode("");
                setError(null);
              }}
              className="text-muted hover:text-foreground"
            >
              ← Change details
            </button>
            <button
              type="button"
              onClick={resend}
              className="font-medium"
              style={{ color: "var(--brand)" }}
            >
              Resend code
            </button>
          </div>
        </>
      )}
    </div>
  );
}
