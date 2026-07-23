import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/currency";
import { estimatedDeliveryWindow } from "@/lib/orders";
import { reconcilePendingPayments } from "@/lib/payments";
import { whatsappLink } from "@/config/store";
import { Check, CalendarClock, ExternalLink, Truck, XCircle } from "lucide-react";
import PayBalanceButton from "@/components/storefront/PayBalanceButton";
import { CancelOrderButton, OrderHelpButton } from "@/components/storefront/OrderActions";
import { confirmOrderReceived } from "@/app/actions/orders";

export const metadata = { title: "Order details", robots: { index: false, follow: false } };

const TIMELINE_STEPS = ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] as const;

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Payment pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const eventDate = (d: Date) =>
  d.toLocaleString("en-NG", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

const etaDate = (d: Date) => d.toLocaleDateString("en-NG", { day: "numeric", month: "short" });

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { id } = await params;
  const { t: token } = await searchParams;
  const session = await auth();

  const load = () =>
    prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        address: true,
        statusHistory: { orderBy: { createdAt: "asc" } },
      },
    });

  let order = await load();
  if (!order) notFound();

  // Owner session, or the guest access token minted at checkout — guests have
  // no password, so the tokenized URL from their payment return is their key.
  const isOwner = !!session?.user && order.userId === session.user.id;
  const hasToken = !!token && !!order.accessToken && order.accessToken === token;
  if (!isOwner && !hasToken) {
    if (!session?.user) redirect(`/login?callbackUrl=/orders/${id}`);
    notFound();
  }

  // Verify-on-return: returning from Paystack shouldn't show "Payment pending"
  // until the webhook lands (in local dev it never does). Reconcile any
  // outstanding charges directly, then re-read.
  if (order.paymentStatus !== "PAID" && order.status !== "CANCELLED") {
    if (await reconcilePendingPayments(order.id)) {
      order = (await load())!;
    }
  }

  const currentStepIndex = TIMELINE_STEPS.indexOf(
    order.status as (typeof TIMELINE_STEPS)[number]
  );
  // First history event per step — gives each reached step its timestamp + note.
  const stepEvents = new Map(
    TIMELINE_STEPS.map((step) => [
      step,
      order!.statusHistory.find((e) => e.status === step) ?? null,
    ])
  );

  const confirmedAt = stepEvents.get("CONFIRMED")?.createdAt ?? null;
  const showEta =
    !!order.address && // physical orders only — services have no delivery promise
    confirmedAt &&
    (order.status === "CONFIRMED" || order.status === "PROCESSING" || order.status === "SHIPPED");
  const eta = showEta ? estimatedDeliveryWindow(confirmedAt!) : null;

  const cancelledEvent = [...order.statusHistory].reverse().find((e) => e.status === "CANCELLED");
  const balance = Number(order.total) - Number(order.amountPaid);
  const canCancel = order.status === "PENDING" || order.status === "CONFIRMED";
  const tokenParam = hasToken ? token : undefined;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <span className="eyebrow">Order</span>
        <h1 className="section-title">{order.orderNumber}</h1>
        <p className="text-sm text-muted">{STATUS_LABEL[order.status] || order.status}</p>
      </div>

      {order.status === "CANCELLED" && (
        <div
          className="flex flex-col gap-1.5 rounded-2xl p-4 text-sm"
          style={{ background: "var(--danger-soft)", color: "var(--danger)" }}
        >
          <span className="flex items-center gap-2 font-semibold">
            <XCircle className="h-4 w-4" /> Order cancelled
          </span>
          {cancelledEvent && (
            <span className="opacity-80">
              {eventDate(cancelledEvent.createdAt)}
              {cancelledEvent.note ? ` · ${cancelledEvent.note}` : ""}
            </span>
          )}
          {order.paymentStatus === "REFUNDED" ? (
            <span className="opacity-80">
              Your payment of {formatCurrency(Number(order.amountPaid))} has been refunded.
            </span>
          ) : (
            Number(order.amountPaid) > 0 && (
              <span className="opacity-80">
                Your refund of {formatCurrency(Number(order.amountPaid))} is being processed.
              </span>
            )
          )}
        </div>
      )}

      {eta && (
        <div
          className="flex items-center gap-3 rounded-2xl p-4 text-sm"
          style={{ background: "var(--brand-soft)" }}
        >
          <CalendarClock className="h-5 w-5 shrink-0" style={{ color: "var(--brand)" }} />
          <div className="flex flex-col">
            <span className="font-semibold">
              Estimated delivery: {etaDate(eta.from)} – {etaDate(eta.to)}
            </span>
            <span className="text-xs text-muted">
              Based on typical delivery times after payment confirmation.
            </span>
          </div>
        </div>
      )}

      {order.status !== "CANCELLED" && order.status !== "PENDING" && (
        <div className="card-surface flex flex-col gap-4 p-5">
          {TIMELINE_STEPS.map((step, i) => {
            const done = i <= currentStepIndex;
            const isLast = i === TIMELINE_STEPS.length - 1;
            const event = stepEvents.get(step);
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
                <div className="flex flex-col gap-0.5 pb-4">
                  <span className={`text-sm ${done ? "font-medium" : "text-muted"}`}>
                    {STATUS_LABEL[step]}
                  </span>
                  {done && event && (
                    <span className="text-xs text-muted">
                      {eventDate(event.createdAt)}
                      {event.note ? ` · ${event.note}` : ""}
                    </span>
                  )}
                </div>
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
              <span>{formatCurrency(balance)}</span>
            </div>
          </>
        )}
      </div>

      {order.status !== "CANCELLED" &&
        (order.paymentStatus === "PARTIALLY_PAID" || order.paymentStatus === "PENDING") &&
        balance > 0 && (
          <PayBalanceButton
            orderId={order.id}
            balance={balance}
            payUrl={
              tokenParam
                ? `/api/orders/${order.id}/pay-balance?t=${tokenParam}`
                : undefined
            }
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
          {tokenParam && <input type="hidden" name="token" value={tokenParam} />}
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

      <div className="flex flex-col gap-3">
        <OrderHelpButton
          orderNumber={order.orderNumber}
          signedIn={isOwner}
          whatsappHref={
            whatsappLink(`Hi, I need help with my order ${order.orderNumber}`) || undefined
          }
        />
        {canCancel && <CancelOrderButton orderId={order.id} token={tokenParam} />}
      </div>
    </div>
  );
}
