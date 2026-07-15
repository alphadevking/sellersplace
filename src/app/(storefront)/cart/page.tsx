"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { formatCurrency } from "@/lib/currency";
import { emojiForCategorySlug } from "@/lib/category-icons";
import { storeConfig } from "@/config/store";

type Product = {
  id: string;
  name: string;
  slug: string;
  price: string;
  images: string[];
  stock: number;
};

export default function CartPage() {
  const { lines, setQuantity, removeItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(() => lines.length > 0);

  useEffect(() => {
    if (lines.length === 0) return; // empty-cart UI never reads `products`/`loading`
    // Standard "isLoading" flag for a fetch triggered by a dependency change;
    // no cascading-render risk since this is the only sync update per run.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const ids = lines.map((l) => l.productId).join(",");
    fetch(`/api/products?ids=${encodeURIComponent(ids)}`)
      .then((res) => res.json())
      .then((data) => setProducts(data.products || []))
      .finally(() => setLoading(false));
  }, [lines]);

  if (loading) {
    return <p className="text-sm text-muted">Loading cart…</p>;
  }

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-sm text-muted">Your cart is empty.</p>
        <Link
          href="/products"
          className="btn-primary"
        >
          Browse products
        </Link>
      </div>
    );
  }

  const subtotal = lines.reduce((sum, line) => {
    const product = products.find((p) => p.id === line.productId);
    return product ? sum + Number(product.price) * line.quantity : sum;
  }, 0);
  const deliveryFee = storeConfig.deliveryFeeFlat;
  const total = subtotal + deliveryFee;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">Your cart</h1>

      <div className="flex flex-col gap-3">
        {lines.map((line) => {
          const product = products.find((p) => p.id === line.productId);
          if (!product) return null;

          return (
            <div key={line.productId} className="card-surface flex gap-3 p-3">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-background text-2xl">
                {product.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  emojiForCategorySlug()
                )}
              </div>

              <div className="flex flex-1 flex-col justify-between">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/products/${product.slug}`} className="text-sm font-medium">
                    {product.name}
                  </Link>
                  <button
                    onClick={() => removeItem(product.id)}
                    aria-label="Remove item"
                    className="text-muted"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold" style={{ color: "var(--brand)" }}>
                    {formatCurrency(Number(product.price))}
                  </span>
                  <div className="flex items-center gap-2 rounded-lg bg-background px-2 py-1">
                    <button
                      onClick={() => setQuantity(product.id, line.quantity - 1)}
                      aria-label="Decrease quantity"
                      className="rounded p-0.5 hover:bg-surface"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-4 text-center text-sm">{line.quantity}</span>
                    <button
                      onClick={() => setQuantity(product.id, line.quantity + 1)}
                      aria-label="Increase quantity"
                      disabled={line.quantity >= product.stock}
                      className="rounded p-0.5 hover:bg-surface disabled:opacity-40"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card-surface flex flex-col gap-2 p-4 text-sm">
        <div className="flex justify-between text-muted">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-muted">
          <span>Delivery fee</span>
          <span>{formatCurrency(deliveryFee)}</span>
        </div>
        <div className="flex justify-between border-t pt-2 font-semibold" style={{ borderColor: "var(--border)" }}>
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      <Link
        href="/checkout"
        className="btn-primary justify-center"
      >
        Proceed to checkout
      </Link>
    </div>
  );
}
