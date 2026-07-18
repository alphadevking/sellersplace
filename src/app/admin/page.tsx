import Link from "next/link";
import { Banknote, MessageSquare, Package, ShoppingBag, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/currency";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/StatusBadge";

export const metadata = { title: "Dashboard" };

// Server component runs per-request, so "now" is stable for the render.
function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export default async function AdminDashboardPage() {
  const thirtyDaysAgo = daysAgo(30);

  const [
    revenue,
    revenue30d,
    orderCount,
    openOrderCount,
    customerCount,
    productCount,
    newInquiryCount,
    inquiryByStatus,
    topSellerRows,
    lowStock,
    recentOrders,
  ] = await Promise.all([
      // Money actually received (deposits included) — sum of amountPaid.
      prisma.order.aggregate({
        _sum: { amountPaid: true },
        where: { paymentStatus: { in: ["PAID", "PARTIALLY_PAID"] } },
      }),
      prisma.order.aggregate({
        _sum: { amountPaid: true },
        where: {
          paymentStatus: { in: ["PAID", "PARTIALLY_PAID"] },
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.order.count(),
      prisma.order.count({
        where: { status: { in: ["CONFIRMED", "PROCESSING", "SHIPPED"] } },
      }),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.inquiry.count({ where: { status: "NEW" } }),
      prisma.inquiry.groupBy({ by: ["status"], _count: true }),
      prisma.orderItem.groupBy({
        by: ["productId"],
        where: {
          productId: { not: null },
          order: { paymentStatus: { in: ["PAID", "PARTIALLY_PAID"] } },
        },
        _sum: { quantity: true, unitPrice: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
      prisma.product.findMany({
        where: { isActive: true, stock: { lte: 5 } },
        orderBy: { stock: "asc" },
        take: 5,
      }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { user: true, items: true },
      }),
    ]);

  const topSellerIds = topSellerRows
    .map((r) => r.productId)
    .filter((id): id is string => id !== null);
  const topSellerProducts = topSellerIds.length
    ? await prisma.product.findMany({ where: { id: { in: topSellerIds } } })
    : [];

  const stats: Array<{
    label: string;
    value: string;
    hint?: string;
    icon: typeof Banknote;
    href?: string;
  }> = [
    {
      label: "Revenue (received)",
      value: formatCurrency(Number(revenue._sum.amountPaid ?? 0)),
      hint: `${formatCurrency(Number(revenue30d._sum.amountPaid ?? 0))} last 30 days`,
      icon: Banknote,
    },
    {
      label: "Orders",
      value: `${orderCount}`,
      hint: openOrderCount > 0 ? `${openOrderCount} open` : undefined,
      icon: ShoppingBag,
    },
    { label: "Customers", value: `${customerCount}`, icon: Users },
    { label: "Active products", value: `${productCount}`, icon: Package },
    {
      label: "Inquiries",
      value: `${newInquiryCount}`,
      hint: newInquiryCount > 0 ? "new leads waiting" : undefined,
      icon: MessageSquare,
      href: "/admin/inquiries",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {stats.map(({ label, value, hint, icon: Icon, href }) => {
          const body = (
            <>
              <div className="flex items-center gap-2 text-xs text-muted">
                <Icon className="h-3.5 w-3.5" />
                {label}
              </div>
              <span className="text-xl font-semibold tracking-tight">{value}</span>
              {hint && (
                <span className="text-xs" style={{ color: "var(--brand)" }}>
                  {hint}
                </span>
              )}
            </>
          );
          return href ? (
            <Link
              key={label}
              href={href}
              className="card flex flex-col gap-2 p-4 transition-colors hover:bg-surface"
            >
              {body}
            </Link>
          ) : (
            <div key={label} className="card flex flex-col gap-2 p-4">
              {body}
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-sm font-semibold">Top sellers (paid orders)</h2>
          {topSellerRows.length === 0 ? (
            <p className="card-surface p-4 text-sm text-muted">
              No paid sales yet — top products will rank here.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {topSellerRows.map((row, index) => {
                const product = topSellerProducts.find((p) => p.id === row.productId);
                if (!product) return null;
                return (
                  <Link
                    key={product.id}
                    href={`/admin/products/${product.id}`}
                    className="card flex items-center justify-between gap-3 p-3.5 transition-colors hover:bg-surface"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                        style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
                      >
                        {index + 1}
                      </span>
                      <span className="truncate text-sm font-medium">{product.name}</span>
                    </div>
                    <span className="shrink-0 text-xs text-muted">
                      {row._sum.quantity ?? 0} sold
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold">Leads pipeline</h2>
          <div className="card flex flex-col gap-2 p-4">
            {(["NEW", "RESPONDED", "CLOSED"] as const).map((status) => {
              const count = inquiryByStatus.find((r) => r.status === status)?._count ?? 0;
              return (
                <Link
                  key={status}
                  href={`/admin/inquiries?status=${status}`}
                  className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-surface"
                >
                  <span className="capitalize text-foreground/80">{status.toLowerCase()}</span>
                  <span className="font-semibold">{count}</span>
                </Link>
              );
            })}
            <Link
              href="/admin/inquiries"
              className="mt-1 border-t pt-2 text-xs text-muted hover:text-foreground"
              style={{ borderColor: "var(--border)" }}
            >
              View all inquiries →
            </Link>
          </div>
        </section>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Recent orders</h2>
          <Link href="/admin/orders" className="text-xs text-muted hover:text-foreground">
            View all
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="card-surface p-4 text-sm text-muted">
            No orders yet — they&apos;ll show up here as soon as customers check out.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="card flex items-center justify-between gap-3 p-4 transition-colors hover:bg-surface"
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-sm font-medium">{order.orderNumber}</span>
                  <span className="truncate text-xs text-muted">
                    {order.user.name || order.user.email} · {order.items.length} item
                    {order.items.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <OrderStatusBadge status={order.status} />
                  <PaymentStatusBadge status={order.paymentStatus} />
                  <span className="text-sm font-semibold">
                    {formatCurrency(Number(order.total))}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {lowStock.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold">Low stock</h2>
          <div className="flex flex-col gap-2">
            {lowStock.map((product) => (
              <Link
                key={product.id}
                href={`/admin/products/${product.id}`}
                className="card flex items-center justify-between p-4 transition-colors hover:bg-surface"
              >
                <span className="text-sm font-medium">{product.name}</span>
                <span
                  className={`text-xs font-medium ${product.stock === 0 ? "text-red-600" : "text-amber-600"}`}
                >
                  {product.stock === 0 ? "Out of stock" : `${product.stock} left`}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
