"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteCustomer } from "@/app/actions/admin";

/**
 * Deletes a customer (NDPR erasure) with an inline confirm step. Notes that
 * customers with orders are anonymized rather than removed, so the admin knows
 * the order records survive.
 */
export default function DeleteCustomerButton({
  userId,
  label,
  hasOrders,
}: {
  userId: string;
  label: string;
  hasOrders: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label={`Delete ${label}`}
        className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface"
        style={{ color: "var(--muted)" }}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    );
  }

  return (
    <form
      action={deleteCustomer}
      onSubmit={() => setSubmitting(true)}
      className="flex flex-col items-end gap-1.5"
    >
      <input type="hidden" name="userId" value={userId} />
      <p className="text-right text-[11px] text-muted">
        {hasOrders
          ? "Personal data removed; order records kept (anonymized)."
          : "Permanently delete this customer?"}
      </p>
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={submitting}
          className="rounded-lg border px-2.5 py-1 text-xs"
          style={{ borderColor: "var(--border)" }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg px-2.5 py-1 text-xs font-medium text-white"
          style={{ background: "var(--danger)" }}
        >
          {submitting ? "Deleting…" : "Delete"}
        </button>
      </div>
    </form>
  );
}
