import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/currency";
import { Check } from "lucide-react";

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
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold">Order {order.orderNumber}</h1>
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
              <span className="text-sm font-medium">{item.product.name}</span>
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
      </div>

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
    </div>
  );
}
