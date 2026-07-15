"use client";

import { useCart } from "@/lib/cart-context";

export default function CartBadge() {
  const { totalItems } = useCart();
  if (totalItems === 0) return null;

  return (
    <span
      className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium text-brand-foreground"
      style={{ background: "var(--brand)" }}
    >
      {totalItems > 9 ? "9+" : totalItems}
    </span>
  );
}
