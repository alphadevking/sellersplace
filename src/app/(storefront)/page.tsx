import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { storeConfig, terms } from "@/config/store";
import { auth } from "@/lib/auth";
import { getAllCategories, getAllProducts } from "@/lib/products";
import { getWishlistProductIds } from "@/lib/wishlist";
import { emojiForCategorySlug } from "@/lib/category-icons";
import ProductCard from "@/components/storefront/ProductCard";
import SmartImage from "@/components/SmartImage";
import TrustBar from "@/components/storefront/TrustBar";

export default async function HomePage() {
  const session = await auth();
  const [categories, products, wishlistIds] = await Promise.all([
    getAllCategories(),
    getAllProducts(),
    getWishlistProductIds(session?.user?.id),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <section
        className="relative overflow-hidden rounded-2xl p-6 sm:p-10 lg:p-14"
        style={{ background: "var(--brand)" }}
      >
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full sm:h-64 sm:w-64"
          style={{ background: "rgba(255,255,255,0.08)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-16 -left-10 h-44 w-44 rounded-full sm:h-72 sm:w-72"
          style={{ background: "rgba(255,255,255,0.06)" }}
        />
        <div className="relative flex flex-col gap-3 text-brand-foreground sm:gap-4">
          <span className="w-fit rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium">
            New collection
          </span>
          <h1 className="max-w-[16ch] text-3xl font-semibold leading-[1.1] tracking-tight sm:text-4xl lg:max-w-[22ch] lg:text-5xl">
            {terms.heroTagline} {storeConfig.name}
          </h1>
          <p className="max-w-[32ch] text-sm text-brand-foreground/80 sm:max-w-[48ch] sm:text-base">
            {storeConfig.description}
          </p>
          <Link
            href="/products"
            className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-sm font-medium transition-transform active:scale-[0.98] sm:px-5 sm:py-3"
            style={{ color: "var(--brand)" }}
          >
            {terms.heroCta} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <TrustBar />

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">{terms.exploreHeading}</h2>
          <Link href="/products" className="text-xs text-muted hover:text-foreground">
            View all
          </Link>
        </div>
        {categories.length === 0 ? (
          <p className="card-surface p-4 text-sm text-muted">
            No categories yet — run <code>pnpm dlx prisma db seed</code> to add sample data.
          </p>
        ) : (
          <div className="grid grid-cols-4 gap-3 md:grid-cols-6 lg:grid-cols-8">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/products?category=${cat.slug}`}
                className="card-surface flex flex-col items-center gap-1.5 p-3 text-center transition-transform hover:-translate-y-0.5 active:scale-95"
              >
                {cat.imageUrl ? (
                  <SmartImage
                    src={cat.imageUrl}
                    alt={cat.name}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-2xl">{emojiForCategorySlug(cat.slug)}</span>
                )}
                <span className="text-xs">{cat.name}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">{terms.popular}</h2>
          <Link href="/products" className="text-xs text-muted hover:text-foreground">
            View all
          </Link>
        </div>
        {products.length === 0 ? (
          <p className="card-surface p-4 text-sm text-muted">
            No products yet — run <code>pnpm dlx prisma db seed</code> to add sample data,
            or add products from the admin dashboard once it&apos;s built.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-3 md:grid-cols-4 lg:grid-cols-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                wishlisted={wishlistIds.has(product.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
