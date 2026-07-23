"use client";

import { useState } from "react";
import { MessageCircle, XCircle } from "lucide-react";
import { cancelOrder } from "@/app/actions/orders";

/**
 * Pre-dispatch cancellation — a deliberately quiet control with an explicit
 * confirm step so it can't be fat-fingered.
 */
export function CancelOrderButton({ orderId, token }: { orderId: string; token?: string }) {
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="flex items-center gap-1.5 self-center text-xs text-muted transition-colors hover:text-foreground"
      >
        <XCircle className="h-3.5 w-3.5" /> Cancel this order
      </button>
    );
  }

  return (
    <form
      action={cancelOrder}
      onSubmit={() => setSubmitting(true)}
      className="card-surface flex flex-col gap-2.5 p-4 text-center"
    >
      <input type="hidden" name="orderId" value={orderId} />
      {token && <input type="hidden" name="token" value={token} />}
      <p className="text-sm font-medium">Cancel this order?</p>
      <p className="text-xs text-muted">
        Any payment already made will be refunded. This can&apos;t be undone.
      </p>
      <div className="flex justify-center gap-2">
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="btn-outline"
          disabled={submitting}
        >
          Keep order
        </button>
        <button
          type="submit"
          className="btn-primary"
          disabled={submitting}
          style={{ background: "var(--danger)" }}
        >
          {submitting ? "Cancelling…" : "Yes, cancel it"}
        </button>
      </div>
    </form>
  );
}

/**
 * "Need help with this order?" — opens the in-app support chat prefilled with
 * the order number for signed-in customers; guests fall back to WhatsApp when
 * the store has it configured.
 */
export function OrderHelpButton({
  orderNumber,
  signedIn,
  whatsappHref,
}: {
  orderNumber: string;
  signedIn: boolean;
  whatsappHref?: string;
}) {
  if (signedIn) {
    return (
      <button
        type="button"
        onClick={() =>
          window.dispatchEvent(
            new CustomEvent("sellersplace:openchat", {
              detail: { prefill: `Hi, I need help with my order ${orderNumber}: ` },
            })
          )
        }
        className="flex items-center gap-1.5 self-center text-xs font-medium"
        style={{ color: "var(--brand)" }}
      >
        <MessageCircle className="h-3.5 w-3.5" /> Need help with this order?
      </button>
    );
  }

  if (!whatsappHref) return null;
  return (
    <a
      href={whatsappHref}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 self-center text-xs font-medium"
      style={{ color: "var(--brand)" }}
    >
      <MessageCircle className="h-3.5 w-3.5" /> Need help? Chat on WhatsApp
    </a>
  );
}
