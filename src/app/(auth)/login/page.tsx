"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

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
      <div>
        <h1 className="text-lg font-semibold">Welcome back</h1>
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
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
          />
        </label>

        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
        )}

        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? "Signing in…" : "Sign in"}
        </button>
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
