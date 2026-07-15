"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { formatCurrency } from "@/lib/currency";
import { storeConfig } from "@/config/store";

type Product = { id: string; price: string };

export default function CheckoutPage() {
  const { lines, clear } = useCart();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    email: "",
    fullName: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
  });

  useEffect(() => {
    if (lines.length === 0) return;
    const ids = lines.map((l) => l.productId).join(",");
    fetch(`/api/products?ids=${encodeURIComponent(ids)}`)
      .then((res) => res.json())
      .then((data) => setProducts(data.products || []));
  }, [lines]);

  if (lines.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-muted">
        Your cart is empty — nothing to check out yet.
      </div>
    );
  }

  const subtotal = lines.reduce((sum, line) => {
    const product = products.find((p) => p.id === line.productId);
    return product ? sum + Number(product.price) * line.quantity : sum;
  }, 0);
  const total = subtotal + storeConfig.deliveryFeeFlat;

  function updateField(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
          shippingAddress: {
            fullName: form.fullName,
            phone: form.phone,
            line1: form.line1,
            line2: form.line2 || undefined,
            city: form.city,
            state: form.state,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      clear();
      window.location.href = data.authorizationUrl; // redirect to Paystack
    } catch {
      setError("Network error — please check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <h1 className="text-lg font-semibold">Checkout</h1>

      <div className="flex flex-col gap-3 rounded-xl bg-surface p-4">
        <Field label="Email" type="email" value={form.email} onChange={(v) => updateField("email", v)} required />
        <Field label="Full name" value={form.fullName} onChange={(v) => updateField("fullName", v)} required />
        <Field label="Phone" type="tel" value={form.phone} onChange={(v) => updateField("phone", v)} required />
        <Field label="Address line 1" value={form.line1} onChange={(v) => updateField("line1", v)} required />
        <Field label="Address line 2 (optional)" value={form.line2} onChange={(v) => updateField("line2", v)} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="City" value={form.city} onChange={(v) => updateField("city", v)} required />
          <Field label="State" value={form.state} onChange={(v) => updateField("state", v)} required />
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-xl bg-surface p-4 text-sm">
        <div className="flex justify-between text-muted">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-muted">
          <span>Delivery fee</span>
          <span>{formatCurrency(storeConfig.deliveryFeeFlat)}</span>
        </div>
        <div className="flex justify-between border-t border-black/5 pt-2 font-semibold">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-xl py-3 text-sm font-medium text-brand-foreground disabled:opacity-60"
        style={{ background: "var(--brand)" }}
      >
        {submitting ? "Redirecting to payment…" : `Pay ${formatCurrency(total)}`}
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-muted">
      {label}
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg bg-background px-3 py-2 text-sm text-foreground outline-none"
      />
    </label>
  );
}
