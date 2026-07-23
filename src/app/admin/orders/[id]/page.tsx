import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/currency";
import { markOrderRefunded } from "@/app/actions/admin";
import { storeConfig } from "@/config/store";
import CopyLinkField from "@/components/admin/CopyLinkField";
import OrderFulfilment from "@/components/admin/OrderFulfilment";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/StatusBadge";

export const metadata = { title: "Order" };

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ statusError?: string }>;
}) {
  const { id } = await params;
  const { statusError } = await searchParams;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: true,
      address: true,
      items: { include: { product: true } },
      statusHistory: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!order) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">Order {order.orderNumber}</h1>
          <p className="text-sm text-muted">
            Placed{" "}
            {order.createdAt.toLocaleString("en-NG", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.paymentStatus} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-4">
          <section className="card flex flex-col gap-3 p-4">
            <h2 className="text-sm font-semibold">Items</h2>
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <div className="flex flex-col">
                  <span className="font-medium">
                    {item.product?.name ?? item.titleOverride ?? "Custom item"}
                    {item.variantName && (
                      <span className="font-normal text-muted"> · {item.variantName}</span>
                    )}
                  </span>
                  <span className="text-xs text-muted">
                    {item.quantity} × {formatCurrency(Number(item.unitPrice))}
                  </span>
                </div>
                <span>{formatCurrency(Number(item.unitPrice) * item.quantity)}</span>
              </div>
            ))}
            <div
              className="flex flex-col gap-1.5 border-t pt-3 text-sm"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="flex justify-between text-muted">
                <span>Subtotal</span>
                <span>{formatCurrency(Number(order.subtotal))}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Delivery fee</span>
                <span>{formatCurrency(Number(order.deliveryFee))}</span>
              </div>
              <div className="flex justify-between font-semibold">
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
          </section>

          {order.accessToken && (
            <section className="card flex flex-col gap-2 p-4 text-sm">
              <h2 className="text-sm font-semibold">
                {order.isInvoice ? "Invoice pay link" : "Customer order link"}
              </h2>
              <p className="text-xs text-muted">
                {order.isInvoice
                  ? "Share this private link with the customer — they can view and pay without an account."
                  : "This guest checkout has no account — this private link is how the customer views and tracks the order."}
              </p>
              <CopyLinkField
                url={
                  order.isInvoice
                    ? `${storeConfig.siteUrl}/invoice/${order.accessToken}`
                    : `${storeConfig.siteUrl}/orders/${order.id}?t=${order.accessToken}`
                }
              />
            </section>
          )}

          <section className="card flex flex-col gap-1 p-4 text-sm">
            <h2 className="mb-1 text-sm font-semibold">Customer</h2>
            <span>{order.user.name || "—"}</span>
            <span className="text-muted">{order.user.email}</span>
            {order.user.phone && <span className="text-muted">{order.user.phone}</span>}
            {order.user.isGuest && (
              <span className="mt-1 w-fit rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">
                Guest checkout
              </span>
            )}
          </section>

          {(order.serviceDate || order.customerNote) && (
            <section className="card flex flex-col gap-1 p-4 text-sm">
              <h2 className="mb-1 text-sm font-semibold">Booking details</h2>
              {order.serviceDate && (
                <span>
                  Preferred date:{" "}
                  {order.serviceDate.toLocaleString("en-NG", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              )}
              {order.customerNote && (
                <span className="text-muted">{order.customerNote}</span>
              )}
            </section>
          )}

          {order.address && (
            <section className="card flex flex-col gap-1 p-4 text-sm">
              <h2 className="mb-1 text-sm font-semibold">Delivery address</h2>
              <span>{order.address.fullName}</span>
              <span className="text-muted">
                {order.address.line1}
                {order.address.line2 ? `, ${order.address.line2}` : ""}, {order.address.city},{" "}
                {order.address.state}
              </span>
              <span className="text-muted">{order.address.phone}</span>
            </section>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <OrderFulfilment
            order={order}
            hasPhysical={order.items.some(
              (i) => i.product && i.product.offeringType !== "SERVICE"
            )}
            statusError={statusError}
          />

          {order.status === "CANCELLED" &&
            Number(order.amountPaid) > 0 &&
            order.paymentStatus !== "REFUNDED" && (
              <section className="card flex flex-col gap-2.5 p-4">
                <h2 className="text-sm font-semibold">Refund owed</h2>
                <p className="text-xs text-muted">
                  This cancelled order has {formatCurrency(Number(order.amountPaid))} paid.
                  Refund via Paystack/bank, then record it here — the customer sees the
                  refund state on their order page.
                </p>
                <form action={markOrderRefunded}>
                  <input type="hidden" name="orderId" value={order.id} />
                  <button type="submit" className="btn-outline w-full">
                    Mark as refunded
                  </button>
                </form>
              </section>
            )}

          <section className="card flex flex-col gap-3 p-4">
            <h2 className="text-sm font-semibold">Status history</h2>
            {order.statusHistory.length === 0 ? (
              <p className="text-sm text-muted">No status events yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {order.statusHistory.map((event) => (
                  <div key={event.id} className="flex flex-col gap-0.5 text-sm">
                    <div className="flex items-center gap-2">
                      <OrderStatusBadge status={event.status} />
                      <span className="text-xs text-muted">
                        {event.createdAt.toLocaleString("en-NG", {
                          day: "numeric",
                          month: "short",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {event.note && <span className="text-xs text-muted">{event.note}</span>}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
