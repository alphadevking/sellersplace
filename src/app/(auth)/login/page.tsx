"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import LoadingOverlay from "@/components/LoadingOverlay";
import PasswordInput from "@/components/PasswordInput";

// useSearchParams() needs a Suspense boundary for prerendering.
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/account";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Incorrect email or password.");
      setSubmitting(false);
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="card flex flex-col gap-5 p-6">
      <LoadingOverlay show={submitting} label="Signing in…" />
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-[-0.01em]">Welcome back</h1>
        <p className="text-sm text-muted">Sign in to track orders and check out faster.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="field-label">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
          />
        </label>
        <label className="field-label">
          Password
          <PasswordInput value={password} onChange={setPassword} autoComplete="current-password" />
        </label>

        {error && (
          <p className="alert-error" role="alert">{error}</p>
        )}

        <button type="submit" disabled={submitting} className="btn-primary justify-center">
          {submitting ? "Signing in…" : "Sign in"}
        </button>

        <p className="text-center text-[11px] leading-relaxed text-muted">
          By signing in you agree to our{" "}
          <Link href="/terms" target="_blank" className="underline hover:text-foreground">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" target="_blank" className="underline hover:text-foreground">
            Privacy Policy
          </Link>
          .
        </p>
      </form>

      <p className="text-center text-sm text-muted">
        New here?{" "}
        <Link href="/signup" className="font-medium" style={{ color: "var(--brand)" }}>
          Create an account
        </Link>
      </p>
    </div>
  );
}
