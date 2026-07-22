import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/currency";
import { Check, ExternalLink, Truck } from "lucide-react";
import PayBalanceButton from "@/components/storefront/PayBalanceButton";
import { confirmOrderReceived } from "@/app/actions/orders";

const TIMELINE_STEPS = ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] as const;

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Payment pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/orders/${id}`);

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } }, address: true },
  });

  if (!order || order.userId !== session.user.id) notFound();

  const currentStepIndex = TIMELINE_STEPS.indexOf(
    order.status as (typeof TIMELINE_STEPS)[number]
  );

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <span className="eyebrow">Order</span>
        <h1 className="section-title">{order.orderNumber}</h1>
        <p className="text-sm text-muted">{STATUS_LABEL[order.status] || order.status}</p>
      </div>

      {order.status !== "CANCELLED" && order.status !== "PENDING" && (
        <div className="card-surface flex flex-col gap-4 p-5">
          {TIMELINE_STEPS.map((step, i) => {
            const done = i <= currentStepIndex;
            const isLast = i === TIMELINE_STEPS.length - 1;
            return (
              <div key={step} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs"
                    style={{
                      background: done ? "var(--brand)" : "var(--border)",
                      color: done ? "var(--brand-foreground)" : "var(--muted)",
                    }}
                  >
                    {done && <Check className="h-3.5 w-3.5" />}
                  </div>
                  {!isLast && (
                    <div
                      className="w-px flex-1"
                      style={{ background: i < currentStepIndex ? "var(--brand)" : "var(--border)" }}
                    />
                  )}
                </div>
                <span
                  className={`pb-4 text-sm ${done ? "font-medium" : "text-muted"}`}
                >
                  {STATUS_LABEL[step]}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {order.items.map((item) => (
          <div key={item.id} className="card flex items-center justify-between p-4">
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {item.product?.name ?? item.titleOverride ?? "Custom item"}
                {item.variantName && (
                  <span className="font-normal text-muted"> · {item.variantName}</span>
                )}
              </span>
              <span className="text-xs text-muted">Qty {item.quantity}</span>
            </div>
            <span className="text-sm">{formatCurrency(Number(item.unitPrice) * item.quantity)}</span>
          </div>
        ))}
      </div>

      <div className="card-surface flex flex-col gap-2 p-4 text-sm">
        <div className="flex justify-between text-muted">
          <span>Subtotal</span>
          <span>{formatCurrency(Number(order.subtotal))}</span>
        </div>
        <div className="flex justify-between text-muted">
          <span>Delivery fee</span>
          <span>{formatCurrency(Number(order.deliveryFee))}</span>
        </div>
        <div className="flex justify-between border-t pt-2 font-semibold" style={{ borderColor: "var(--border)" }}>
          <span>Total</span>
          <span>{formatCurrency(Number(order.total))}</span>
        </div>
        {Number(order.amountPaid) > 0 && Number(order.amountPaid) < Number(order.total) && (
          <>
            <div className="flex justify-between text-muted">
              <span>Paid so far</span>
              <span>{formatCurrency(Number(order.amountPaid))}</span>
            </div>
            <div className="flex justify-between font-medium" style={{ color: "var(--brand)" }}>
              <span>Balance due</span>
              <span>{formatCurrency(Number(order.total) - Number(order.amountPaid))}</span>
            </div>
          </>
        )}
      </div>

      {(order.paymentStatus === "PARTIALLY_PAID" || order.paymentStatus === "PENDING") &&
        Number(order.total) - Number(order.amountPaid) > 0 && (
          <PayBalanceButton
            orderId={order.id}
            balance={Number(order.total) - Number(order.amountPaid)}
          />
        )}

      {order.address && (
        <div className="card-surface flex flex-col gap-1 p-4 text-sm">
          <span className="font-medium">Delivery address</span>
          <span className="text-muted">
            {order.address.fullName}, {order.address.line1}
            {order.address.line2 ? `, ${order.address.line2}` : ""}, {order.address.city},{" "}
            {order.address.state}
          </span>
          <span className="text-muted">{order.address.phone}</span>
        </div>
      )}

      {(order.carrier || order.trackingNumber) && (
        <div className="card-surface flex flex-col gap-1.5 p-4 text-sm">
          <span className="flex items-center gap-2 font-medium">
            <Truck className="h-4 w-4" style={{ color: "var(--brand)" }} /> Shipment
          </span>
          <span className="text-muted">
            {order.carrier}
            {order.carrier && order.trackingNumber ? " · " : ""}
            {order.trackingNumber}
          </span>
          {order.trackingUrl && (
            <a
              href={order.trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-fit items-center gap-1 text-xs font-medium"
              style={{ color: "var(--brand)" }}
            >
              Track this shipment <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      )}

      {order.status === "SHIPPED" && (
        <form action={confirmOrderReceived} className="flex flex-col gap-1.5">
          <input type="hidden" name="orderId" value={order.id} />
          <button type="submit" className="btn-primary">
            <Check className="h-4 w-4" /> Confirm I received this order
          </button>
          <p className="text-center text-xs text-muted">
            Got your delivery? Confirming completes the order.
          </p>
        </form>
      )}

      {(order.serviceDate || order.customerNote) && (
        <div className="card-surface flex flex-col gap-1 p-4 text-sm">
          <span className="font-medium">Booking details</span>
          {order.serviceDate && (
            <span className="text-muted">
              Preferred date:{" "}
              {order.serviceDate.toLocaleString("en-NG", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          )}
          {order.customerNote && <span className="text-muted">{order.customerNote}</span>}
        </div>
      )}
    </div>
  );
}
