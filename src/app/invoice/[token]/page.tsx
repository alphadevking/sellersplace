import { cache } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/currency";
import { balanceDue } from "@/lib/payments";
import { storeConfig } from "@/config/store";
import PayBalanceButton from "@/components/storefront/PayBalanceButton";

// cache() dedupes the lookup between generateMetadata and the page render.
const getInvoiceOrder = cache((token: string) =>
  prisma.order.findUnique({
    where: { accessToken: token },
    include: { items: { include: { product: true } }, user: true },
  })
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const order = await getInvoiceOrder(token);
  return {
    title: order ? `Invoice ${order.orderNumber}` : "Invoice",
    robots: { index: false, follow: false },
  };
}

/**
 * Tokenized public invoice page — reachable only via the unguessable link the
 * seller shares, so customers can view and pay without an account.
 */
export default async function InvoicePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const order = await getInvoiceOrder(token);
  if (!order) notFound();

  const balance = balanceDue(order);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-5 px-4 py-10">
      <div className="flex flex-col gap-1">
        <span className="text-lg font-semibold tracking-tight">{storeConfig.name}</span>
        <h1 className="text-sm text-muted">
          Invoice {order.orderNumber} · for {order.user.name || order.user.email}
        </h1>
      </div>

      <div className="card flex flex-col gap-3 p-4 text-sm">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3">
            <span>
              {item.product?.name ?? item.titleOverride ?? "Item"}
              {item.variantName && <span className="text-muted"> · {item.variantName}</span>}
              <span className="text-muted"> × {item.quantity}</span>
            </span>
            <span>{formatCurrency(Number(item.unitPrice) * item.quantity)}</span>
          </div>
        ))}
        <div
          className="flex flex-col gap-1.5 border-t pt-3"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatCurrency(Number(order.total))}</span>
          </div>
          {Number(order.amountPaid) > 0 && (
            <div className="flex justify-between text-muted">
              <span>Paid so far</span>
              <span>{formatCurrency(Number(order.amountPaid))}</span>
            </div>
          )}
          {balance > 0 && (
            <div className="flex justify-between font-medium" style={{ color: "var(--brand)" }}>
              <span>Balance due</span>
              <span>{formatCurrency(balance)}</span>
            </div>
          )}
        </div>
      </div>

      {order.customerNote && (
        <p className="card-surface p-3 text-sm text-foreground/80">{order.customerNote}</p>
      )}

      {balance > 0 ? (
        <PayBalanceButton
          orderId={order.id}
          balance={balance}
          payUrl={`/api/invoice/${token}/pay`}
        />
      ) : (
        <p
          className="rounded-xl p-3 text-center text-sm font-medium"
          style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
        >
          This invoice is fully paid — thank you!
        </p>
      )}
    </div>
  );
}
