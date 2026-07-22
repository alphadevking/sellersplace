"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { formatCurrency } from "@/lib/currency";
import { emojiForCategorySlug } from "@/lib/category-icons";
import { productHref } from "@/lib/product-url";
import SmartImage from "@/components/SmartImage";
import { storeConfig } from "@/config/store";

type Variant = {
  id: string;
  name: string;
  price: string | null;
  stock: number;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  price: string;
  images: string[];
  stock: number;
  offeringType?: "PRODUCT" | "SERVICE";
  variants?: Variant[];
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
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface text-3xl">
          🛒
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="section-title">Your cart is empty</h1>
          <p className="text-sm text-muted">Add something you love and it&apos;ll show up here.</p>
        </div>
        <Link href="/products" className="btn-primary btn-lg">
          Browse products
        </Link>
      </div>
    );
  }

  const linePrice = (line: { productId: string; variantId?: string }) => {
    const product = products.find((p) => p.id === line.productId);
    if (!product) return null;
    const variant = line.variantId
      ? product.variants?.find((v) => v.id === line.variantId)
      : undefined;
    return { product, variant, price: Number(variant?.price ?? product.price) };
  };

  const subtotal = lines.reduce((sum, line) => {
    const resolved = linePrice(line);
    return resolved ? sum + resolved.price * line.quantity : sum;
  }, 0);
  // Services aren't shipped — the delivery fee only applies to physical items.
  const hasPhysical = lines.some(
    (line) => linePrice(line)?.product.offeringType !== "SERVICE"
  );
  const deliveryFee = hasPhysical ? storeConfig.deliveryFeeFlat : 0;
  const total = subtotal + deliveryFee;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <span className="eyebrow">Review your order</span>
        <h1 className="section-title">Your cart</h1>
      </div>

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[1fr_360px] lg:items-start lg:gap-6">
      <div className="flex flex-col gap-3">
        {lines.map((line) => {
          const resolved = linePrice(line);
          if (!resolved) return null;
          const { product, variant, price } = resolved;
          const maxStock =
            product.offeringType === "SERVICE"
              ? Infinity
              : variant
                ? variant.stock
                : product.stock;

          return (
            <div
              key={`${line.productId}:${line.variantId ?? ""}`}
              className="card-surface flex gap-3 p-3"
            >
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-background text-2xl">
                {product.images?.[0] ? (
                  <SmartImage src={product.images[0]} alt={product.name} fill sizes="64px" />
                ) : (
                  emojiForCategorySlug()
                )}
              </div>

              <div className="flex flex-1 flex-col justify-between">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col">
                    <Link href={productHref(product)} className="text-sm font-medium">
                      {product.name}
                    </Link>
                    {variant && <span className="text-xs text-muted">{variant.name}</span>}
                  </div>
                  <button
                    onClick={() => removeItem(product.id, line.variantId)}
                    aria-label="Remove item"
                    className="text-muted"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold" style={{ color: "var(--brand)" }}>
                    {formatCurrency(price)}
                  </span>
                  <div className="flex items-center gap-2 rounded-lg bg-background px-2 py-1">
                    <button
                      onClick={() => setQuantity(product.id, line.quantity - 1, line.variantId)}
                      aria-label="Decrease quantity"
                      className="rounded p-0.5 hover:bg-surface"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-4 text-center text-sm">{line.quantity}</span>
                    <button
                      onClick={() => setQuantity(product.id, line.quantity + 1, line.variantId)}
                      aria-label="Increase quantity"
                      disabled={line.quantity >= maxStock}
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

      <div className="flex flex-col gap-4 lg:sticky lg:top-24">
        <div className="card-surface flex flex-col gap-2 p-4 text-sm">
          <div className="flex justify-between text-muted">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {hasPhysical && (
            <div className="flex justify-between text-muted">
              <span>Delivery fee</span>
              <span>{formatCurrency(deliveryFee)}</span>
            </div>
          )}
          <div className="flex justify-between border-t pt-2 font-semibold" style={{ borderColor: "var(--border)" }}>
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        <Link
          href="/checkout"
          className="btn-primary btn-lg justify-center"
        >
          Proceed to checkout
        </Link>
      </div>
      </div>
    </div>
  );
}
