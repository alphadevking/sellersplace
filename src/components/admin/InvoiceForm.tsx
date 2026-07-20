"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createInvoice } from "@/app/actions/admin";
import { formatCurrency } from "@/lib/currency";
import FormPendingOverlay from "@/components/FormPendingOverlay";

type Line = { title: string; quantity: string; unitPrice: string };

const EMPTY_LINE: Line = { title: "", quantity: "1", unitPrice: "" };

/** Line-item invoice builder for quoted work — submits to the createInvoice action. */
export default function InvoiceForm({
  defaultEmail = "",
  defaultName = "",
  defaultNote = "",
  inquiryId,
}: {
  defaultEmail?: string;
  defaultName?: string;
  defaultNote?: string;
  inquiryId?: string;
}) {
  const [lines, setLines] = useState<Line[]>([{ ...EMPTY_LINE }]);

  function updateLine(index: number, field: keyof Line, value: string) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  }

  const total = lines.reduce(
    (sum, l) => sum + (Number(l.unitPrice) || 0) * (Number(l.quantity) || 0),
    0
  );

  return (
    <form action={createInvoice} className="flex flex-col gap-4">
      <FormPendingOverlay label="Issuing invoice…" />
      {inquiryId && <input type="hidden" name="inquiryId" value={inquiryId} />}
      <input
        type="hidden"
        name="lines"
        value={JSON.stringify(
          lines.map((l) => ({
            title: l.title,
            quantity: Number(l.quantity) || 1,
            unitPrice: Number(l.unitPrice) || 0,
          }))
        )}
      />

      <div className="card-surface flex flex-col gap-3 p-4">
        <span className="text-sm font-semibold">Customer</span>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="field-label">
            Email
            <input name="email" type="email" required defaultValue={defaultEmail} className="input-field" />
          </label>
          <label className="field-label">
            Full name
            <input name="name" required defaultValue={defaultName} className="input-field" />
          </label>
        </div>
        <label className="field-label">
          Phone (optional)
          <input name="phone" type="tel" className="input-field" />
        </label>
      </div>

      <div className="card-surface flex flex-col gap-3 p-4">
        <span className="text-sm font-semibold">Line items</span>
        {lines.map((line, index) => (
          <div key={index} className="flex items-end gap-2">
            <label className="field-label flex-1">
              Description
              <input
                required
                value={line.title}
                onChange={(e) => updateLine(index, "title", e.target.value)}
                placeholder="e.g. Full-day event coverage"
                className="input-field"
              />
            </label>
            <label className="field-label w-16">
              Qty
              <input
                type="number"
                min="1"
                required
                value={line.quantity}
                onChange={(e) => updateLine(index, "quantity", e.target.value)}
                className="input-field"
              />
            </label>
            <label className="field-label w-32">
              Unit price (₦)
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={line.unitPrice}
                onChange={(e) => updateLine(index, "unitPrice", e.target.value)}
                className="input-field"
              />
            </label>
            <button
              type="button"
              onClick={() => setLines((prev) => prev.filter((_, i) => i !== index))}
              disabled={lines.length === 1}
              aria-label="Remove line"
              className="btn-ghost px-2.5 py-2.5 disabled:opacity-30"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setLines((prev) => [...prev, { ...EMPTY_LINE }])}
          className="btn-ghost self-start px-3 py-2 text-xs"
        >
          <Plus className="h-3.5 w-3.5" /> Add line
        </button>
        <div className="flex justify-between border-t pt-3 text-sm font-semibold" style={{ borderColor: "var(--border)" }}>
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      <label className="field-label">
        Note to customer (optional)
        <textarea name="note" rows={2} defaultValue={defaultNote} className="input-field" />
      </label>

      <button type="submit" className="btn-primary self-start">
        Issue invoice
      </button>
    </form>
  );
}
