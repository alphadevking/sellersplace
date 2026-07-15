import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/currency";
import SignOutButton from "@/components/storefront/SignOutButton";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Payment pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/account");

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="card-surface flex flex-col gap-1 p-5">
        <span className="text-xs text-muted">Signed in as</span>
        <h1 className="text-lg font-semibold">{session.user.name || session.user.email}</h1>
        <span className="text-sm text-muted">{session.user.email}</span>
      </div>

      {(session.user.role === "ADMIN" || session.user.role === "STAFF") && (
        <Link href="/admin" className="btn-outline">
          Open admin dashboard
        </Link>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold">Order history</h2>
        {orders.length === 0 ? (
          <p className="card-surface p-4 text-sm text-muted">
            No orders yet.{" "}
            <Link href="/products" style={{ color: "var(--brand)" }}>
              Start shopping
            </Link>
            .
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="card flex items-center justify-between p-4"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{order.orderNumber}</span>
                  <span className="text-xs text-muted">
                    {STATUS_LABEL[order.status] || order.status} ·{" "}
                    {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <span className="text-sm font-semibold" style={{ color: "var(--brand)" }}>
                  {formatCurrency(Number(order.total))}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <SignOutButton />
    </div>
  );
}
