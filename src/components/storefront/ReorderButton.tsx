"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { useCart } from "@/lib/cart-context";

export type ReorderLine = { productId: string; variantId: string | null; quantity: number };

/** One-tap repurchase: re-adds a past order's items to the cart and jumps there. */
export default function ReorderButton({ lines }: { lines: ReorderLine[] }) {
  const { addItem } = useCart();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  function handleReorder() {
    setPending(true);
    for (const line of lines) {
      addItem(line.productId, line.quantity, line.variantId ?? undefined);
    }
    router.push("/cart");
  }

  return (
    <button
      type="button"
      onClick={handleReorder}
      disabled={pending || lines.length === 0}
      className="btn-outline w-full py-2 text-xs"
    >
      <RotateCcw className="h-3.5 w-3.5" /> Buy again
    </button>
  );
}
