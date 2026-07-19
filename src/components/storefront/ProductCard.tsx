import Link from "next/link";
import { Zap } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { emojiForCategorySlug } from "@/lib/category-icons";
import { storeConfig } from "@/config/store";
import Stars from "@/components/storefront/Stars";
import WishlistButton from "@/components/storefront/WishlistButton";

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  // Prisma returns Decimal for price; anything Number() can coerce works here.
  price: number | string | { toString(): string };
  compareAtPrice?: number | string | { toString(): string } | null;
  images: string[];
  brand?: string | null;
  purchaseMode?: "PAY_ONLINE" | "CONTACT_SELLER" | "BOTH";
  offeringType?: "PRODUCT" | "SERVICE";
  priceType?: "FIXED" | "FROM" | "QUOTE";
  ratingAvg?: number | string | { toString(): string } | null;
  ratingCount?: number;
  stock?: number;
  category?: { slug: string } | null;
};

export default function ProductCard({
  product,
  wishlisted,
}: {
  product: ProductCardData;
  wishlisted?: boolean;
}) {
  const image = product.images?.[0];
  const price = Number(product.price);
  const quoted = product.priceType === "QUOTE";
  const compareAt =
    !quoted && product.compareAtPrice ? Number(product.compareAtPrice) : null;
  const discount =
    compareAt && compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : null;
  const chatOnly = product.purchaseMode === "CONTACT_SELLER" || quoted;
  // Express = "we can dispatch this now": physical, buyable online, in stock
  // (mirrors Jumia's fulfilled-from-warehouse criteria at single-store scale).
  const showExpress =
    Boolean(storeConfig.expressBadge) &&
    product.offeringType !== "SERVICE" &&
    !chatOnly &&
    (product.stock === undefined || product.stock > 0);

  return (
    <Link
      href={`/products/${product.slug}`}
      className="card-surface group flex flex-col gap-1 p-3 transition-transform hover:-translate-y-0.5"
    >
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-background text-3xl">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          emojiForCategorySlug(product.category?.slug)
        )}
        <WishlistButton productId={product.id} initialWishlisted={wishlisted ?? false} />
      </div>

      {product.brand && (
        <span className="mt-1 text-[10px] font-medium uppercase tracking-wide text-muted">
          {product.brand}
        </span>
      )}
      <span className={`line-clamp-2 text-sm leading-snug ${product.brand ? "" : "mt-1"}`}>
        {product.name}
      </span>

      <span className="text-[15px] font-bold" style={{ color: "var(--brand)" }}>
        {quoted
          ? "Request a quote"
          : `${product.priceType === "FROM" ? "From " : ""}${formatCurrency(price)}`}
      </span>
      {discount && (
        <span className="flex items-center gap-1.5">
          <span className="text-xs text-muted line-through">{formatCurrency(compareAt!)}</span>
          <span
            className="rounded px-1.5 py-0.5 text-[10px] font-bold"
            style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
          >
            -{discount}%
          </span>
        </span>
      )}

      {(product.ratingCount ?? 0) > 0 && (
        <span className="flex items-center gap-1 text-[11px] text-muted">
          <Stars rating={Number(product.ratingAvg ?? 0)} size={12} />(
          {product.ratingCount})
        </span>
      )}

      {chatOnly ? (
        <span
          className="mt-0.5 w-fit rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
        >
          Chat to order
        </span>
      ) : showExpress ? (
        <span
          className="mt-0.5 flex items-center gap-0.5 text-[10px] font-black italic tracking-tight"
          style={{ color: "var(--brand)" }}
        >
          <Zap className="h-3 w-3 fill-current" />
          {storeConfig.expressBadge.toUpperCase()}
        </span>
      ) : null}
    </Link>
  );
}
