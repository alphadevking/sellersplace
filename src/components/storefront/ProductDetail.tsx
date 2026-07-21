import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { auth } from "@/lib/auth";
import { storeConfig } from "@/config/store";
import { formatCurrency } from "@/lib/currency";
import { getProductBySlug } from "@/lib/products";
import { getRelatedProducts } from "@/lib/recommendations";
import { getWishlistProductIds } from "@/lib/wishlist";
import { getUserReview, hasPurchasedProduct } from "@/lib/reviews";
import { emojiForCategorySlug } from "@/lib/category-icons";
import ProductCard from "@/components/storefront/ProductCard";
import ProductPurchasePanel from "@/components/storefront/ProductPurchasePanel";
import ReviewForm from "@/components/storefront/ReviewForm";
import ShareButtons from "@/components/storefront/ShareButtons";
import SmartImage from "@/components/SmartImage";
import Stars from "@/components/storefront/Stars";
import WishlistButton from "@/components/storefront/WishlistButton";

/**
 * Shared PDP body for both /products/:slug and /services/:slug. `expectedType`
 * 404s the request if the slug resolves to the other offering type, so the
 * two routes stay a real partition rather than aliases of one page.
 */
export default async function ProductDetail({
  slug,
  expectedType,
}: {
  slug: string;
  expectedType: "PRODUCT" | "SERVICE";
}) {
  const product = await getProductBySlug(slug);
  if (!product || !product.isActive || product.offeringType !== expectedType) notFound();

  const session = await auth();
  const [wishlistIds, related, canReview, ownReview] = await Promise.all([
    getWishlistProductIds(session?.user?.id),
    getRelatedProducts(product.id, 6),
    session?.user ? hasPurchasedProduct(session.user.id, product.id) : false,
    session?.user ? getUserReview(session.user.id, product.id) : null,
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

  const isService = product.offeringType === "SERVICE";
  const isQuote = product.priceType === "QUOTE";
  const isChatOnly = product.purchaseMode === "CONTACT_SELLER" || isQuote;
  const catalogHref = isService ? "/services" : "/products";

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
    {/* Breadcrumbs — the one place category shows up; the line under the title
        carries brand only, so the two rows don't repeat the same word. */}
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs text-muted">
      <Link href="/" className="hover:text-foreground">Home</Link>
      <ChevronRight className="h-3 w-3" />
      {product.category && (
        <>
          <Link
            href={`${catalogHref}?category=${product.category.slug}`}
            className="hover:text-foreground"
          >
            {product.category.name}
          </Link>
          <ChevronRight className="h-3 w-3" />
        </>
      )}
      <span className="truncate text-foreground/70">{product.name}</span>
    </nav>

    {/* Image (narrow) · Purchase (wide) · Delivery rail */}
    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-12 lg:items-start lg:gap-6">
      <div className="lg:col-span-4">
        {/* Capped height on mobile — a full-bleed square hero pushes price and
            the buy button below the fold; the desktop column can afford the
            true 1:1 product shot since it isn't fighting for vertical space. */}
        <div className="relative flex h-[300px] w-full items-center justify-center overflow-hidden rounded-2xl bg-surface text-6xl sm:h-[360px] lg:aspect-square lg:h-auto">
          {image ? (
            <SmartImage
              src={image}
              alt={product.name}
              fill
              sizes="(max-width: 1024px) 100vw, 33vw"
              priority
            />
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
      </div>

      <div className="flex flex-col gap-3 lg:col-span-5 lg:gap-4">
        <div className="flex flex-col gap-1">
          {product.brand && (
            <span className="text-xs font-medium text-muted">{product.brand}</span>
          )}
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl font-semibold md:text-2xl">{product.name}</h1>
            <WishlistButton
              productId={product.id}
              initialWishlisted={wishlistIds.has(product.id)}
              variant="detail"
            />
          </div>
          {product.ratingCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <Stars rating={Number(product.ratingAvg ?? 0)} />
              {Number(product.ratingAvg ?? 0).toFixed(1)} ({product.ratingCount} review
              {product.ratingCount !== 1 ? "s" : ""})
            </div>
          )}
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
            depositPercent: product.depositPercent,
          }}
          variants={product.variants.map((v) => ({
            id: v.id,
            name: v.name,
            price: v.price ? Number(v.price) : null,
            stock: v.stock,
            sku: v.sku,
          }))}
        />

        {/* Share is a secondary action — it belongs after the buy box, not
            competing with it above the fold on mobile. */}
        <div
          className="rounded-2xl border p-3 lg:p-4"
          style={{ borderColor: "var(--border)" }}
        >
          <ShareButtons title={product.name} />
        </div>
      </div>

      {/* Delivery & Returns rail */}
      <aside className="lg:col-span-3">
        <div
          className="flex flex-col divide-y rounded-2xl border"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="p-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
              {isService ? "How it works" : "Delivery & Returns"}
            </h2>
            {isService ? (
              <ul className="flex flex-col gap-3 text-sm">
                <li className="flex gap-2.5">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--brand)" }} />
                  <span>
                    <span className="font-medium">Book or request a quote</span>
                    <span className="block text-xs text-muted">
                      {isChatOnly ? "Chat with the provider to arrange details." : "Pick a time at checkout."}
                    </span>
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <Truck className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--brand)" }} />
                  <span>
                    <span className="font-medium">Service at your location</span>
                    <span className="block text-xs text-muted">Confirmed by the provider before the visit.</span>
                  </span>
                </li>
              </ul>
            ) : (
              <ul className="flex flex-col gap-3 text-sm">
                <li className="flex gap-2.5">
                  <Truck className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--brand)" }} />
                  <span>
                    <span className="font-medium">Door delivery</span>
                    <span className="block text-xs text-muted">
                      Flat {formatCurrency(storeConfig.deliveryFeeFlat)} — pay online or on delivery.
                    </span>
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <RotateCcw className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--brand)" }} />
                  <span>
                    <span className="font-medium">Easy returns</span>
                    <span className="block text-xs text-muted">Report an issue within 7 days of delivery.</span>
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--brand)" }} />
                  <span>
                    <span className="font-medium">Secure checkout</span>
                    <span className="block text-xs text-muted">Card, transfer & USSD via Paystack.</span>
                  </span>
                </li>
              </ul>
            )}
          </div>
          {(storeConfig.whatsappNumber || storeConfig.phone) && (
            <div className="p-4 text-sm">
              <span className="text-xs text-muted">Need help ordering?</span>
              <div className="mt-1 flex flex-col gap-1">
                {storeConfig.phone && (
                  <a href={`tel:${storeConfig.phone}`} className="font-medium" style={{ color: "var(--brand)" }}>
                    Call {storeConfig.phone}
                  </a>
                )}
                {storeConfig.whatsappNumber && (
                  <a
                    href={`https://wa.me/${storeConfig.whatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium"
                    style={{ color: "var(--brand)" }}
                  >
                    Chat on WhatsApp
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>

    {/* Description + specs (full width) */}
    {(product.description || specs.length > 0) && (
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-12 lg:gap-6">
        <div className="flex flex-col gap-4 lg:col-span-9 lg:gap-6">
          {product.description && (
            <div>
              <h2 className="mb-2 text-sm font-semibold">Description</h2>
              <p className="text-sm leading-relaxed text-foreground/80">
                {product.description}
              </p>
            </div>
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
    )}

    <section className="lg:max-w-2xl">
      <h2 className="mb-3 text-sm font-semibold">
        Reviews{product.ratingCount > 0 ? ` (${product.ratingCount})` : ""}
      </h2>
      <div className="flex flex-col gap-3">
        {product.reviews.length === 0 && (
          <p className="card-surface p-4 text-sm text-muted">
            No reviews yet — be the first verified buyer to leave one.
          </p>
        )}
        {product.reviews.map((review) => (
          <div key={review.id} className="card flex flex-col gap-1.5 p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Stars rating={review.rating} />
                <span className="text-sm font-medium">
                  {review.user.name?.split(" ")[0] || "Customer"}
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
                >
                  Verified buyer
                </span>
              </div>
              <span className="text-xs text-muted">
                {review.createdAt.toLocaleDateString("en-NG", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
            {review.body && (
              <p className="text-sm leading-relaxed text-foreground/80">{review.body}</p>
            )}
          </div>
        ))}
        {!session?.user ? (
          <p className="card-surface p-4 text-sm text-muted">
            Bought this? Sign in to leave a verified review.
          </p>
        ) : canReview ? (
          <ReviewForm
            productId={product.id}
            productSlug={product.slug}
            initialRating={ownReview?.rating ?? 0}
            initialBody={ownReview?.body ?? ""}
          />
        ) : (
          <p className="card-surface p-4 text-sm text-muted">
            Reviews come from verified buyers — order this
            {product.offeringType === "SERVICE" ? " service" : " item"} and you&apos;ll be
            able to share your experience here.
          </p>
        )}
      </div>
    </section>

    {related.length > 0 && (
      <section>
        <h2 className="mb-3 text-sm font-semibold">You may also like</h2>
        <div className="grid grid-cols-3 gap-3 md:grid-cols-4 lg:grid-cols-5">
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
