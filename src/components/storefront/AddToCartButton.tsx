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
      <button onClick={handleAdd} className="btn-primary flex-1">
        {added ? "Added to cart" : "Add to Cart"}
      </button>
      <button
        onClick={() => {
          addItem(productId, 1);
          router.push("/cart");
        }}
        className="btn-outline"
      >
        Buy now
      </button>
    </div>
  );
}
