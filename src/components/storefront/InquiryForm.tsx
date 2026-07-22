"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { submitInquiry, type InquiryFormState } from "@/app/actions/inquiries";

const INITIAL: InquiryFormState = { ok: false };

/**
 * On-platform inquiry capture for contact-mode offerings — works even when
 * WhatsApp isn't configured, and every submission lands in admin → Inquiries.
 */
export default function InquiryForm({
  productId,
  variantName,
}: {
  productId: string;
  variantName?: string;
}) {
  const [state, formAction, pending] = useActionState(submitInquiry, INITIAL);

  if (state.ok) {
    return (
      <div className="card-surface flex items-center gap-3 p-4 text-sm">
        <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: "var(--brand)" }} />
        <div>
          <p className="font-medium">Inquiry sent</p>
          <p className="text-muted">The seller will get back to you shortly.</p>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="card-surface flex flex-col gap-3 p-4">
      <span className="text-sm font-semibold">Send an inquiry</span>
      <input type="hidden" name="productId" value={productId} />
      {variantName && <input type="hidden" name="variantName" value={variantName} />}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="field-label">
          Your name
          <input name="name" required maxLength={120} className="input-field" />
        </label>
        <label className="field-label">
          Phone or email
          <input name="contact" required maxLength={160} className="input-field" />
        </label>
      </div>
      <label className="field-label">
        What do you need?
        <textarea
          name="message"
          required
          rows={3}
          maxLength={2000}
          placeholder="Tell the seller what you're looking for…"
          className="input-field"
        />
      </label>
      {state.error && (
        <p className="alert-error text-xs" role="alert">{state.error}</p>
      )}
      <button type="submit" disabled={pending} className="btn-primary self-start">
        {pending ? "Sending…" : "Send inquiry"}
      </button>
    </form>
  );
}
