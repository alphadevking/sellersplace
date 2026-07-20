import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/currency";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/StatusBadge";

export const metadata = { title: "Orders" };

const FILTERS = ["ALL", ...Object.values(OrderStatus)] as const;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeFilter =
    status && Object.values(OrderStatus).includes(status as OrderStatus)
      ? (status as OrderStatus)
      : "ALL";

  const where: Prisma.OrderWhereInput =
    activeFilter === "ALL" ? {} : { status: activeFilter };

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { user: true, items: true },
    take: 100,
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">Orders</h1>

      <div className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4">
        {FILTERS.map((filter) => {
          const active = filter === activeFilter;
          return (
            <Link
              key={filter}
              href={filter === "ALL" ? "/admin/orders" : `/admin/orders?status=${filter}`}
              className="shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors"
              style={
                active
                  ? {
                      background: "var(--brand)",
                      borderColor: "var(--brand)",
                      color: "var(--brand-foreground)",
                    }
                  : { borderColor: "var(--border)", color: "var(--muted)" }
              }
            >
              {filter === "ALL" ? "All" : filter.toLowerCase()}
            </Link>
          );
        })}
      </div>

      {orders.length === 0 ? (
        <p className="card-surface p-4 text-sm text-muted">
          No {activeFilter !== "ALL" ? `${activeFilter.toLowerCase()} ` : ""}orders found.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/admin/orders/${order.id}`}
              className="card flex items-center justify-between gap-3 p-4 transition-colors hover:bg-surface"
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-medium">{order.orderNumber}</span>
                <span className="truncate text-xs text-muted">
                  {order.user.name || order.user.email} ·{" "}
                  {order.createdAt.toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}{" "}
                  · {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                </span>
                {order.serviceDate && (
                  <span
                    className="mt-0.5 flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                    style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
                  >
                    <CalendarClock className="h-3 w-3" />
                    Booking:{" "}
                    {order.serviceDate.toLocaleString("en-NG", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                )}
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
    </div>
  );
}
