"use client";

import { useCart } from "@/lib/cart-context";
import CountBadge from "@/components/storefront/CountBadge";

/**
 * Live cart counter rendered as a numbered badge. Distinct from CartBadge (the
 * floating dot on the mobile bottom-nav cart icon).
 */
export default function CartCount() {
  const { totalItems } = useCart();
  return <CountBadge count={totalItems} />;
}
