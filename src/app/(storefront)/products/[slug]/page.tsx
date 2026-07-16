import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getProductBySlug } from "@/lib/products";
import { getRelatedProducts } from "@/lib/recommendations";
import { getWishlistProductIds } from "@/lib/wishlist";
import { emojiForCategorySlug } from "@/lib/category-icons";
import ProductCard from "@/components/storefront/ProductCard";
import ProductPurchasePanel from "@/components/storefront/ProductPurchasePanel";
import WishlistButton from "@/components/storefront/WishlistButton";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product || !product.isActive) notFound();

  const session = await auth();
  const [wishlistIds, related] = await Promise.all([
    getWishlistProductIds(session?.user?.id),
    getRelatedProducts(product.id, 4),
  ]);

  const image = product.images?.[0];
  const compareAt =
    product.priceType !== "QUOTE" && product.compareAtPrice
      ? Number(product.compareAtPrice)
      : null;
  const price = Number(product.price);
  const discount =
    compareAt && compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : null;

  const specs =
    product.attributes && typeof product.attributes === "object" && !Array.isArray(product.attributes)
      ? Object.entries(product.attributes as Record<string, unknown>).filter(
          ([, v]) => typeof v === "string" || typeof v === "number"
        )
      : [];

  return (
    <div className="flex flex-col gap-10">
    <div className="flex flex-col gap-4 md:grid md:grid-cols-2 md:items-start md:gap-10">
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-surface text-6xl">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          emojiForCategorySlug(product.category?.slug)
        )}
        {discount && (
          <span
            className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold text-white"
            style={{ background: "var(--brand)" }}
          >
            -{discount}%
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs text-muted">
            {product.category && <span>{product.category.name}</span>}
            {product.category && product.brand && <span aria-hidden>·</span>}
            {product.brand && <span className="font-medium">{product.brand}</span>}
          </div>
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl font-semibold md:text-2xl">{product.name}</h1>
            <WishlistButton
              productId={product.id}
              initialWishlisted={wishlistIds.has(product.id)}
              variant="detail"
            />
          </div>
        </div>

        <ProductPurchasePanel
          product={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            price,
            compareAtPrice: compareAt,
            stock: product.stock,
            sku: product.sku,
            purchaseMode: product.purchaseMode,
            offeringType: product.offeringType,
            priceType: product.priceType,
          }}
          variants={product.variants.map((v) => ({
            id: v.id,
            name: v.name,
            price: v.price ? Number(v.price) : null,
            stock: v.stock,
            sku: v.sku,
          }))}
        />

        {product.description && (
          <p className="text-sm leading-relaxed text-foreground/80">
            {product.description}
          </p>
        )}

        {specs.length > 0 && (
          <div>
            <h2 className="mb-2 text-sm font-semibold">Specifications</h2>
            <dl
              className="overflow-hidden rounded-xl border text-sm"
              style={{ borderColor: "var(--border)" }}
            >
              {specs.map(([key, value], index) => (
                <div
                  key={key}
                  className="flex items-baseline justify-between gap-4 px-3.5 py-2.5"
                  style={{ background: index % 2 === 0 ? "var(--surface)" : "transparent" }}
                >
                  <dt className="text-muted">{key}</dt>
                  <dd className="text-right font-medium">{String(value)}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </div>

    {related.length > 0 && (
      <section>
        <h2 className="mb-3 text-sm font-semibold">You may also like</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {related.map((rec) => (
            <ProductCard
              key={rec.id}
              product={rec}
              wishlisted={wishlistIds.has(rec.id)}
            />
          ))}
        </div>
      </section>
    )}
    </div>
  );
}
