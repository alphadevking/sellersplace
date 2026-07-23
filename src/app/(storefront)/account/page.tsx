import { redirect } from "next/navigation";
import Link from "next/link";
import { Compass, Heart, PackageSearch, ShieldCheck } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/currency";
import { emojiForCategorySlug } from "@/lib/category-icons";
import { terms } from "@/config/store";
import SmartImage from "@/components/SmartImage";
import { OrderStatusBadge } from "@/components/StatusBadge";
import SignOutButton from "@/components/storefront/SignOutButton";
import ReorderButton from "@/components/storefront/ReorderButton";

export const metadata = { title: "My account", robots: { index: false, follow: false } };

const ACTIVE_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED"] as const;

function initials(name: string | null, email: string) {
  const source = name?.trim() || email;
  const parts = source.split(/\s+/).filter(Boolean);
  const letters =
    parts.length > 1 ? parts[0][0] + parts[1][0] : source.slice(0, 2);
  return letters.toUpperCase();
}

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/account");

  const [user, orders, wishlistCount] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: session.user.id } }),
    prisma.order.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: { items: { include: { product: true } } },
    }),
    prisma.wishlistItem.count({ where: { userId: session.user.id } }),
  ]);

  const totalSpent = orders.reduce((sum, o) => sum + Number(o.amountPaid), 0);
  const activeOrder = orders.find((o) =>
    ACTIVE_STATUSES.includes(o.status as (typeof ACTIVE_STATUSES)[number])
  );
  const memberSince = user.createdAt.toLocaleDateString("en-NG", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      {/* Profile hero */}
      <div className="card-surface flex items-center gap-4 p-5">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold"
          style={{ background: "var(--brand)", color: "var(--brand-foreground)" }}
        >
          {initials(user.name, user.email)}
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <h1 className="truncate font-display text-xl font-semibold tracking-[-0.01em]">
            {user.name || user.email}
          </h1>
          <span className="truncate text-sm text-muted">{user.email}</span>
          <span className="text-xs text-muted">Member since {memberSince}</span>
        </div>
        {(session.user.role === "ADMIN" || session.user.role === "STAFF") && (
          <span
            className="ml-auto flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium"
            style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            {session.user.role === "ADMIN" ? "Admin" : "Staff"}
          </span>
        )}
      </div>

      {/* Stats — a quick, rewarding snapshot of the relationship so far */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card-surface flex flex-col items-center gap-0.5 p-4 text-center">
          <span className="font-display text-xl font-semibold">{orders.length}</span>
          <span className="text-[11px] text-muted">Orders</span>
        </div>
        <div className="card-surface flex flex-col items-center gap-0.5 p-4 text-center">
          <span className="font-display text-xl font-semibold">{formatCurrency(totalSpent)}</span>
          <span className="text-[11px] text-muted">Total spent</span>
        </div>
        <Link
          href="/wishlist"
          className="card-interactive flex flex-col items-center gap-0.5 p-4 text-center"
        >
          <span className="font-display text-xl font-semibold">{wishlistCount}</span>
          <span className="text-[11px] text-muted">Wishlist</span>
        </Link>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        {activeOrder ? (
          <Link href={`/orders/${activeOrder.id}`} className="card flex items-center gap-3 p-4">
            <PackageSearch className="h-5 w-5 shrink-0" style={{ color: "var(--brand)" }} />
            <div className="flex min-w-0 flex-col">
              <span className="text-sm font-medium">Track order</span>
              <span className="truncate text-xs text-muted">{activeOrder.orderNumber}</span>
            </div>
          </Link>
        ) : (
          <Link href="/products" className="card flex items-center gap-3 p-4">
            <Compass className="h-5 w-5 shrink-0" style={{ color: "var(--brand)" }} />
            <span className="text-sm font-medium">{terms.browse}</span>
          </Link>
        )}
        <Link href="/wishlist" className="card flex items-center gap-3 p-4">
          <Heart className="h-5 w-5 shrink-0" style={{ color: "var(--brand)" }} />
          <span className="text-sm font-medium">Wishlist</span>
        </Link>
      </div>

      {(session.user.role === "ADMIN" || session.user.role === "STAFF") && (
        <Link href="/admin" className="btn-outline">
          Open admin dashboard
        </Link>
      )}

      {/* Order history */}
      <div>
        <h2 className="mb-3 font-display text-lg font-semibold">Order history</h2>
        {orders.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface">
              <PackageSearch className="h-7 w-7" style={{ color: "var(--muted)" }} />
            </div>
            <div>
              <p className="font-medium">No orders yet</p>
              <p className="mt-1 text-sm text-muted">
                Your future orders will show up here, with tracking and reorder in one tap.
              </p>
            </div>
            <Link href="/products" className="btn-primary btn-lg w-full max-w-xs justify-center">
              {terms.browse}
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((order) => {
              const thumbnail = order.items.find((i) => i.product?.images?.[0])?.product
                ?.images[0];
              const canReorder = order.items.some(
                (i) => i.productId && i.product?.offeringType === "PRODUCT"
              );

              return (
                <div key={order.id} className="card flex flex-col gap-3 p-4">
                  <Link href={`/orders/${order.id}`} className="flex items-center gap-3">
                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface text-xl">
                      {thumbnail ? (
                        <SmartImage src={thumbnail} alt="" fill sizes="48px" />
                      ) : (
                        emojiForCategorySlug()
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-sm font-medium">{order.orderNumber}</span>
                      <span className="text-xs text-muted">
                        {order.items.length} item{order.items.length !== 1 ? "s" : ""} ·{" "}
                        {order.createdAt.toLocaleDateString("en-NG", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-sm font-semibold">
                        {formatCurrency(Number(order.total))}
                      </span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                  </Link>
                  {(order.status === "DELIVERED" || order.status === "CANCELLED") &&
                    canReorder && (
                      <ReorderButton
                        lines={order.items
                          .filter((i) => i.productId && i.product?.offeringType === "PRODUCT")
                          .map((i) => ({
                            productId: i.productId!,
                            variantId: i.variantId,
                            quantity: i.quantity,
                          }))}
                      />
                    )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <SignOutButton />
    </div>
  );
}
