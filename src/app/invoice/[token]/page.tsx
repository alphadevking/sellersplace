import { cache } from "react";
import { notFound } from "next/navigation";
import { CheckCircle2, Phone } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/currency";
import { balanceDue } from "@/lib/payments";
import { developer, developerHref, storeConfig, whatsappLink } from "@/config/store";
import BrandMark from "@/components/BrandMark";
import PrintButton from "@/components/PrintButton";
import PayBalanceButton from "@/components/storefront/PayBalanceButton";

// cache() dedupes the lookup between generateMetadata and the page render.
const getInvoiceOrder = cache((token: string) =>
  prisma.order.findUnique({
    where: { accessToken: token },
    include: {
      items: { include: { product: true } },
      user: true,
      payments: { where: { status: "SUCCESS" }, orderBy: { createdAt: "asc" } },
    },
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

const PAYMENT_KIND_LABEL: Record<string, string> = {
  FULL: "Payment",
  DEPOSIT: "Deposit",
  BALANCE: "Balance payment",
  INVOICE: "Invoice payment",
};

const longDate = (d: Date) =>
  d.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });

/**
 * Tokenized public invoice page — reachable only via the unguessable link the
 * seller shares, so customers can view and pay without an account. Doubles as
 * the printable/PDF record (print styles strip the interactive chrome).
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
  const paid = balance <= 0;
  const partiallyPaid = !paid && Number(order.amountPaid) > 0;
  const helpWa = whatsappLink(`Hi, I have a question about invoice ${order.orderNumber}`);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-5 px-4 py-8 sm:py-12">
      {/* Letterhead */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <BrandMark size={44} className="h-11 w-11" iconClassName="h-8 w-8" />
          <div className="flex flex-col">
            <span className="font-display text-xl font-semibold tracking-[-0.01em]">
              {storeConfig.name}
            </span>
            <span className="text-xs text-muted">
              {storeConfig.siteUrl.replace(/^https?:\/\//, "")}
              {storeConfig.phone ? ` · ${storeConfig.phone}` : ""}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
            style={
              paid
                ? { background: "var(--brand-soft)", color: "var(--brand)" }
                : { background: "var(--surface-2)", color: "var(--muted)" }
            }
          >
            {paid ? "Paid" : partiallyPaid ? "Partially paid" : "Awaiting payment"}
          </span>
          <span className="font-display text-lg font-semibold">{order.orderNumber}</span>
          <span className="text-xs text-muted">Issued {longDate(order.createdAt)}</span>
        </div>
      </header>

      {/* Billed to */}
      <div className="card-surface flex flex-col gap-0.5 p-4 text-sm">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
          Billed to
        </span>
        <span className="font-medium">{order.user.name || order.user.email}</span>
        <span className="text-muted">{order.user.email}</span>
        {order.user.phone && <span className="text-muted">{order.user.phone}</span>}
      </div>

      {/* Line items */}
      <div className="card flex flex-col p-4 text-sm">
        <div
          className="grid grid-cols-[1fr_auto_auto] gap-x-4 border-b pb-2 text-xs font-semibold uppercase tracking-wide text-muted"
          style={{ borderColor: "var(--border)" }}
        >
          <span>Item</span>
          <span className="text-right">Qty</span>
          <span className="w-24 text-right">Amount</span>
        </div>
        {order.items.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-[1fr_auto_auto] items-baseline gap-x-4 border-b py-2.5"
            style={{ borderColor: "var(--border)" }}
          >
            <span className="flex flex-col">
              <span className="font-medium">
                {item.product?.name ?? item.titleOverride ?? "Item"}
                {item.variantName && (
                  <span className="font-normal text-muted"> · {item.variantName}</span>
                )}
              </span>
              <span className="text-xs text-muted">
                {formatCurrency(Number(item.unitPrice))} each
              </span>
            </span>
            <span className="text-right text-muted">{item.quantity}</span>
            <span className="w-24 text-right">
              {formatCurrency(Number(item.unitPrice) * item.quantity)}
            </span>
          </div>
        ))}

        <div className="flex flex-col gap-1.5 pt-3">
          <div className="flex justify-between text-muted">
            <span>Subtotal</span>
            <span>{formatCurrency(Number(order.subtotal))}</span>
          </div>
          {Number(order.deliveryFee) > 0 && (
            <div className="flex justify-between text-muted">
              <span>Delivery fee</span>
              <span>{formatCurrency(Number(order.deliveryFee))}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatCurrency(Number(order.total))}</span>
          </div>
          {Number(order.amountPaid) > 0 && (
            <div className="flex justify-between text-muted">
              <span>Paid</span>
              <span>−{formatCurrency(Number(order.amountPaid))}</span>
            </div>
          )}
          <div
            className="flex justify-between border-t pt-2 text-base font-semibold"
            style={{
              borderColor: "var(--border)",
              color: balance > 0 ? "var(--brand)" : undefined,
            }}
          >
            <span>Balance due</span>
            <span>{formatCurrency(balance)}</span>
          </div>
        </div>
      </div>

      {order.customerNote && (
        <p className="card-surface p-3.5 text-sm text-foreground/80">{order.customerNote}</p>
      )}

      {/* Payment */}
      {balance > 0 ? (
        <div className="flex flex-col gap-2 print:hidden">
          <PayBalanceButton
            orderId={order.id}
            balance={balance}
            payUrl={`/api/invoice/${token}/pay`}
          />
          <p className="text-center text-xs text-muted">
            Secure card, transfer & USSD payment via Paystack.
          </p>
        </div>
      ) : (
        <div
          className="flex items-center justify-center gap-2 rounded-2xl p-4 text-sm font-medium"
          style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
        >
          <CheckCircle2 className="h-4 w-4" /> This invoice is fully paid — thank you!
        </div>
      )}

      {/* Payment history */}
      {order.payments.length > 0 && (
        <div className="card-surface flex flex-col gap-2 p-4 text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Payment history
          </span>
          {order.payments.map((payment) => (
            <div key={payment.id} className="flex items-center justify-between gap-3">
              <span className="flex flex-col">
                <span>{PAYMENT_KIND_LABEL[payment.kind] ?? "Payment"}</span>
                <span className="text-xs text-muted">{longDate(payment.createdAt)}</span>
              </span>
              <span className="font-medium">{formatCurrency(Number(payment.amount))}</span>
            </div>
          ))}
        </div>
      )}

      {/* Footer actions */}
      <footer className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-3 print:hidden">
          {helpWa && (
            <a
              href={helpWa}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-medium"
              style={{ color: "var(--brand)" }}
            >
              Questions? Chat on WhatsApp
            </a>
          )}
          {storeConfig.phone && (
            <a
              href={`tel:${storeConfig.phone}`}
              className="flex items-center gap-1 text-xs font-medium text-muted hover:text-foreground"
            >
              <Phone className="h-3 w-3" /> {storeConfig.phone}
            </a>
          )}
        </div>
        <PrintButton />
        <p className="hidden w-full text-xs text-muted print:block">
          Issued by {storeConfig.name} · {storeConfig.siteUrl}
        </p>
        <p className="w-full text-center text-[11px] text-muted">
          Powered by{" "}
          <a href={developerHref} className="font-medium hover:text-foreground">
            {developer.name}
          </a>
        </p>
      </footer>
    </div>
  );
}
