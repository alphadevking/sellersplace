"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/currency";

/** Kicks off a Paystack payment for the outstanding balance on an order. */
export default function PayBalanceButton({
  orderId,
  balance,
  payUrl,
}: {
  orderId: string;
  balance: number;
  /** Override endpoint (used by tokenized invoice pages); defaults to the owner route. */
  payUrl?: string;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(payUrl ?? `/api/orders/${orderId}/pay-balance`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not start payment. Please try again.");
        setSubmitting(false);
        return;
      }
      window.location.href = data.authorizationUrl;
    } catch {
      setError("Network error — please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button onClick={handlePay} disabled={submitting} className="btn-primary">
        {submitting ? "Redirecting to payment…" : `Pay balance ${formatCurrency(balance)}`}
      </button>
      {error && <p className="rounded-lg bg-red-50 p-2.5 text-xs text-red-700">{error}</p>}
    </div>
  );
}
