import Link from "next/link";
import { Zap } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { emojiForCategorySlug } from "@/lib/category-icons";
import { productHref } from "@/lib/product-url";
import SmartImage from "@/components/SmartImage";
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
      href={productHref(product)}
      className="card-interactive group flex flex-col p-2.5"
    >
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-background text-3xl">
        {image ? (
          <SmartImage
            src={image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 18vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          emojiForCategorySlug(product.category?.slug)
        )}
        <WishlistButton productId={product.id} initialWishlisted={wishlisted ?? false} />
        {discount && (
          <span
            className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
            style={{ background: "var(--brand)" }}
          >
            -{discount}%
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 px-1 pb-1 pt-2.5">
        {product.brand && (
          <span className="eyebrow text-[10px]">{product.brand}</span>
        )}
        <span className="line-clamp-2 text-sm leading-snug text-foreground/90">
          {product.name}
        </span>

        {(product.ratingCount ?? 0) > 0 && (
          <span className="flex items-center gap-1 text-[11px] text-muted">
            <Stars rating={Number(product.ratingAvg ?? 0)} size={12} />
            <span>({product.ratingCount})</span>
          </span>
        )}

        <div className="mt-auto flex flex-col gap-1 pt-1.5">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-[15px] font-semibold" style={{ color: "var(--brand)" }}>
              {quoted
                ? "Request a quote"
                : `${product.priceType === "FROM" ? "From " : ""}${formatCurrency(price)}`}
            </span>
            {discount && (
              <span className="text-xs text-muted line-through">
                {formatCurrency(compareAt!)}
              </span>
            )}
          </div>

          {chatOnly ? (
            <span className="w-fit text-[11px] font-medium text-muted">Chat to order</span>
          ) : showExpress ? (
            <span
              className="flex items-center gap-0.5 text-[10px] font-black italic tracking-tight opacity-70"
              style={{ color: "var(--brand)" }}
            >
              <Zap className="h-3 w-3 fill-current" />
              {storeConfig.expressBadge.toUpperCase()}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
