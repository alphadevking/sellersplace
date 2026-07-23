import Link from "next/link";
import { CalendarClock, Search } from "lucide-react";
import { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/currency";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/StatusBadge";

export const metadata = { title: "Orders" };

const FILTERS = ["ALL", ...Object.values(OrderStatus)] as const;
const PAGE_SIZE = 50;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const { status, q, page: pageRaw } = await searchParams;
  const activeFilter =
    status && Object.values(OrderStatus).includes(status as OrderStatus)
      ? (status as OrderStatus)
      : "ALL";
  const query = q?.trim() || "";
  const page = Math.max(1, Number.parseInt(pageRaw ?? "1", 10) || 1);

  const where: Prisma.OrderWhereInput = {
    ...(activeFilter === "ALL" ? {} : { status: activeFilter }),
    ...(query
      ? {
          OR: [
            { orderNumber: { contains: query, mode: "insensitive" } },
            { user: { name: { contains: query, mode: "insensitive" } } },
            { user: { email: { contains: query, mode: "insensitive" } } },
            { trackingNumber: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [orders, totalCount] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { user: true, items: true },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.order.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // Preserves the active filter + search across chip/page navigation.
  const buildHref = (params: { status?: string; page?: number }) => {
    const sp = new URLSearchParams();
    const s = params.status ?? (activeFilter === "ALL" ? "" : activeFilter);
    if (s) sp.set("status", s);
    if (query) sp.set("q", query);
    if (params.page && params.page > 1) sp.set("page", String(params.page));
    const qs = sp.toString();
    return qs ? `/admin/orders?${qs}` : "/admin/orders";
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">
          Orders{" "}
          <span className="text-sm font-normal text-muted">({totalCount})</span>
        </h1>
        <form action="/admin/orders" className="relative">
          {activeFilter !== "ALL" && <input type="hidden" name="status" value={activeFilter} />}
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          <input
            name="q"
            defaultValue={query}
            placeholder="Order #, customer, tracking…"
            className="input-field w-64 pl-8 text-sm"
          />
        </form>
      </div>

      <div className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4">
        {FILTERS.map((filter) => {
          const active = filter === activeFilter;
          return (
            <Link
              key={filter}
              href={buildHref({ status: filter === "ALL" ? "" : filter })}
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
          No {activeFilter !== "ALL" ? `${activeFilter.toLowerCase()} ` : ""}orders found
          {query ? ` for “${query}”` : ""}.
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          {page > 1 ? (
            <Link href={buildHref({ page: page - 1 })} className="btn-outline">
              ← Newer
            </Link>
          ) : (
            <span />
          )}
          <span className="text-xs text-muted">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={buildHref({ page: page + 1 })} className="btn-outline">
              Older →
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  );
}
