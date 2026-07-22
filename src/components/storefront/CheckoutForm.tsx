"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart-context";
import { formatCurrency } from "@/lib/currency";
import { storeConfig } from "@/config/store";
import LoadingOverlay from "@/components/LoadingOverlay";

type Product = {
  id: string;
  price: string;
  offeringType?: "PRODUCT" | "SERVICE";
  variants?: { id: string; price: string | null }[];
};

export default function CheckoutForm({
  defaultEmail = "",
  defaultName = "",
  loggedIn = false,
}: {
  defaultEmail?: string;
  defaultName?: string;
  loggedIn?: boolean;
}) {
  const { lines, clear } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    email: defaultEmail,
    fullName: defaultName,
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    serviceDate: "",
    note: "",
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
    if (!product) return sum;
    const variant = line.variantId
      ? product.variants?.find((v) => v.id === line.variantId)
      : undefined;
    return sum + Number(variant?.price ?? product.price) * line.quantity;
  }, 0);
  // Service-only checkouts skip shipping entirely: no address, no delivery fee.
  const hasPhysical =
    products.length === 0 ||
    lines.some(
      (line) =>
        products.find((p) => p.id === line.productId)?.offeringType !== "SERVICE"
    );
  const deliveryFee = hasPhysical ? storeConfig.deliveryFeeFlat : 0;
  const total = subtotal + deliveryFee;

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
          fullName: form.fullName,
          phone: form.phone,
          items: lines.map((l) => ({
            productId: l.productId,
            variantId: l.variantId,
            quantity: l.quantity,
          })),
          shippingAddress: hasPhysical
            ? {
                fullName: form.fullName,
                phone: form.phone,
                line1: form.line1,
                line2: form.line2 || undefined,
                city: form.city,
                state: form.state,
              }
            : undefined,
          serviceDate: form.serviceDate || undefined,
          note: form.note.trim() || undefined,
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
      <LoadingOverlay show={submitting} label="Redirecting to payment…" />
      <div className="flex flex-col gap-1">
        <span className="eyebrow">Almost there</span>
        <h1 className="section-title">Checkout</h1>
      </div>

      <div className="card-surface flex flex-col gap-3 p-4">
        {loggedIn ? (
          <div className="field-label">
            Email
            <div className="input-field bg-surface text-foreground/70">{form.email}</div>
          </div>
        ) : (
          <Field label="Email" type="email" value={form.email} onChange={(v) => updateField("email", v)} required />
        )}
        <Field label="Full name" value={form.fullName} onChange={(v) => updateField("fullName", v)} required />
        <Field label="Phone" type="tel" value={form.phone} onChange={(v) => updateField("phone", v)} required />
        {hasPhysical ? (
          <>
            <Field label="Address line 1" value={form.line1} onChange={(v) => updateField("line1", v)} required />
            <Field label="Address line 2 (optional)" value={form.line2} onChange={(v) => updateField("line2", v)} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="City" value={form.city} onChange={(v) => updateField("city", v)} required />
              <Field label="State" value={form.state} onChange={(v) => updateField("state", v)} required />
            </div>
          </>
        ) : (
          <>
            <Field
              label="Preferred date & time"
              type="datetime-local"
              value={form.serviceDate}
              onChange={(v) => updateField("serviceDate", v)}
              required
            />
            <label className="field-label">
              Notes for the provider (optional)
              <textarea
                rows={3}
                value={form.note}
                onChange={(e) => updateField("note", e.target.value)}
                placeholder="Location, requirements, anything they should know…"
                className="input-field"
              />
            </label>
          </>
        )}
      </div>

      <div className="card-surface flex flex-col gap-2 p-4 text-sm">
        <div className="flex justify-between text-muted">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        {hasPhysical && (
          <div className="flex justify-between text-muted">
            <span>Delivery fee</span>
            <span>{formatCurrency(deliveryFee)}</span>
          </div>
        )}
        <div className="flex justify-between border-t pt-2 font-semibold" style={{ borderColor: "var(--border)" }}>
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      {error && (
        <p className="alert-error" role="alert">{error}</p>
      )}

      <button type="submit" disabled={submitting} className="btn-primary btn-lg justify-center">
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
    <label className="field-label">
      {label}
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="input-field"
      />
    </label>
  );
}
