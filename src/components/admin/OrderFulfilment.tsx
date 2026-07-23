import { Check, PackageCheck, Truck, XCircle } from "lucide-react";
import { OrderStatus } from "@prisma/client";
import { setOrderStatus, setOrderTracking, shipOrder } from "@/app/actions/admin";

const STEPS = [
  { status: "CONFIRMED", label: "Confirmed" },
  { status: "PROCESSING", label: "Processing" },
  { status: "SHIPPED", label: "Shipped" },
  { status: "DELIVERED", label: "Delivered" },
] as const;

const STATUS_ERRORS: Record<string, string> = {
  same: "The order is already in that status — nothing changed.",
  tracking: "Add a carrier or tracking number before shipping — the customer gets notified with nothing to follow otherwise.",
  backward: "That would move the order backwards in fulfilment. Tick the override to confirm it's a correction.",
  notready: "Only confirmed or processing orders can be shipped.",
};

type FulfilmentOrder = {
  id: string;
  status: OrderStatus;
  carrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
};

/** Hidden-field one-click status advance. */
function AdvanceButton({
  orderId,
  to,
  label,
  primary = true,
}: {
  orderId: string;
  to: OrderStatus;
  label: string;
  primary?: boolean;
}) {
  return (
    <form action={setOrderStatus}>
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="status" value={to} />
      <button type="submit" className={`${primary ? "btn-primary" : "btn-outline"} w-full`}>
        {label}
      </button>
    </form>
  );
}

function TrackingFields({
  order,
  required,
}: {
  order: FulfilmentOrder;
  required: boolean;
}) {
  return (
    <>
      <label className="field-label">
        Carrier{required ? "" : " (optional)"}
        <input
          name="carrier"
          defaultValue={order.carrier ?? ""}
          placeholder="e.g. GIG Logistics"
          className="input-field"
        />
      </label>
      <label className="field-label">
        Tracking number{required ? "" : " (optional)"}
        <input
          name="trackingNumber"
          defaultValue={order.trackingNumber ?? ""}
          placeholder="e.g. GIGL-2049-XYZ"
          className="input-field"
        />
      </label>
      <label className="field-label">
        Tracking link (optional)
        <input
          name="trackingUrl"
          type="url"
          defaultValue={order.trackingUrl ?? ""}
          placeholder="https://…"
          className="input-field"
        />
      </label>
    </>
  );
}

function ShipForm({ order, hasPhysical }: { order: FulfilmentOrder; hasPhysical: boolean }) {
  return (
    <form action={shipOrder} className="flex flex-col gap-3">
      <input type="hidden" name="orderId" value={order.id} />
      {hasPhysical && <TrackingFields order={order} required />}
      <label className="field-label">
        Note to customer (optional)
        <input
          name="note"
          placeholder={hasPhysical ? "Defaults to “Dispatched via <carrier>”" : "e.g. Team is on the way"}
          className="input-field"
        />
      </label>
      <button type="submit" className="btn-primary w-full">
        <Truck className="h-4 w-4" /> Mark as shipped &amp; notify
      </button>
      {hasPhysical && (
        <p className="text-[11px] text-muted">
          Saves tracking and ships in one step — the customer&apos;s notification links
          straight to it.
        </p>
      )}
    </form>
  );
}

/**
 * Stage-aware fulfilment panel: shows where the order is and offers exactly
 * the next action — dispatch captures tracking in the same step. The raw
 * status dropdown lives under "Advanced" for corrections only.
 */
export default function OrderFulfilment({
  order,
  hasPhysical,
  statusError,
}: {
  order: FulfilmentOrder;
  hasPhysical: boolean;
  statusError?: string;
}) {
  const stepIndex = STEPS.findIndex((s) => s.status === order.status);

  return (
    <section className="card flex flex-col gap-4 p-4">
      <h2 className="text-sm font-semibold">Fulfilment</h2>

      {statusError && STATUS_ERRORS[statusError] && (
        <p className="alert-error text-xs" role="alert">
          {STATUS_ERRORS[statusError]}
        </p>
      )}

      {/* Compact stage strip */}
      {order.status !== "CANCELLED" && (
        <div className="flex items-center gap-1">
          {STEPS.map((step, i) => {
            const reached = stepIndex >= i;
            return (
              <div key={step.status} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="h-1.5 w-full rounded-full"
                  style={{ background: reached ? "var(--brand)" : "var(--border)" }}
                />
                <span
                  className={`text-[10px] ${
                    stepIndex === i ? "font-semibold" : "text-muted"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {order.status === "PENDING" && (
        <div className="flex flex-col gap-2.5">
          <p className="text-xs text-muted">
            Awaiting payment — the order confirms automatically when Paystack
            reports the charge.
          </p>
          <AdvanceButton
            orderId={order.id}
            to="CONFIRMED"
            label="Confirm manually (paid outside Paystack)"
            primary={false}
          />
        </div>
      )}

      {order.status === "CONFIRMED" && (
        <div className="flex flex-col gap-3">
          <AdvanceButton orderId={order.id} to="PROCESSING" label="Start processing" />
          <details>
            <summary className="cursor-pointer text-xs font-medium text-muted">
              Ship now instead
            </summary>
            <div className="mt-3">
              <ShipForm order={order} hasPhysical={hasPhysical} />
            </div>
          </details>
        </div>
      )}

      {order.status === "PROCESSING" && <ShipForm order={order} hasPhysical={hasPhysical} />}

      {order.status === "SHIPPED" && (
        <div className="flex flex-col gap-3">
          {(order.carrier || order.trackingNumber) && (
            <div
              className="flex items-center gap-2.5 rounded-xl p-3 text-sm"
              style={{ background: "var(--brand-soft)" }}
            >
              <Truck className="h-4 w-4 shrink-0" style={{ color: "var(--brand)" }} />
              <span className="min-w-0 truncate">
                {order.carrier}
                {order.carrier && order.trackingNumber ? " · " : ""}
                {order.trackingNumber}
              </span>
            </div>
          )}
          <AdvanceButton orderId={order.id} to="DELIVERED" label="Mark as delivered" />
          <p className="text-[11px] text-muted">
            Customers can also confirm receipt themselves from their order page.
          </p>
          <details>
            <summary className="cursor-pointer text-xs font-medium text-muted">
              Edit tracking
            </summary>
            <form action={setOrderTracking} className="mt-3 flex flex-col gap-3">
              <input type="hidden" name="orderId" value={order.id} />
              <TrackingFields order={order} required={false} />
              <button type="submit" className="btn-outline w-full">
                Save tracking
              </button>
            </form>
          </details>
        </div>
      )}

      {order.status === "DELIVERED" && (
        <p className="flex items-center gap-2 text-sm font-medium">
          <PackageCheck className="h-4 w-4" style={{ color: "var(--brand)" }} />
          Delivered — order complete.
        </p>
      )}

      {order.status === "CANCELLED" && (
        <p className="flex items-center gap-2 text-sm" style={{ color: "var(--danger)" }}>
          <XCircle className="h-4 w-4" /> Order cancelled.
        </p>
      )}

      {/* Corrections escape hatch — the old dropdown, guarded server-side. */}
      <details>
        <summary className="cursor-pointer text-xs font-medium text-muted">Advanced</summary>
        <form action={setOrderStatus} className="mt-3 flex flex-col gap-3">
          <input type="hidden" name="orderId" value={order.id} />
          <label className="field-label">
            Set status directly
            <select name="status" defaultValue={order.status} className="input-field">
              {Object.values(OrderStatus).map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0) + status.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </label>
          <label className="field-label">
            Note (optional)
            <input name="note" placeholder="Reason for the change" className="input-field" />
          </label>
          <label className="flex items-center gap-2 text-xs text-muted">
            <input type="checkbox" name="force" className="h-3.5 w-3.5" />
            Override guards (ship without tracking / backward correction)
          </label>
          <button type="submit" className="btn-outline w-full">
            <Check className="h-4 w-4" /> Apply
          </button>
          <p className="text-[11px] text-muted">
            The customer gets a push notification for each status change.
          </p>
        </form>
      </details>
    </section>
  );
}
