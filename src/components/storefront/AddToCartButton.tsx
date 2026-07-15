"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";

export default function AddToCartButton({ productId }: { productId: string }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const router = useRouter();

  function handleAdd() {
    addItem(productId, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleAdd}
        className="flex-1 rounded-xl py-3 text-sm font-medium text-brand-foreground"
        style={{ background: "var(--brand)" }}
      >
        {added ? "Added to cart" : "Add to Cart"}
      </button>
      <button
        onClick={() => {
          addItem(productId, 1);
          router.push("/cart");
        }}
        className="rounded-xl border px-4 py-3 text-sm font-medium"
        style={{ borderColor: "var(--brand)", color: "var(--brand)" }}
      >
        Buy now
      </button>
    </div>
  );
}
