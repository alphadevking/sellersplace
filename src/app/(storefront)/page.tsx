import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { storeConfig, terms } from "@/config/store";
import { auth } from "@/lib/auth";
import { getAllProducts, getCategoriesWithCatalogHref } from "@/lib/products";
import { getWishlistProductIds } from "@/lib/wishlist";
import { emojiForCategorySlug } from "@/lib/category-icons";
import ProductCard from "@/components/storefront/ProductCard";
import SmartImage from "@/components/SmartImage";
import Hero from "@/components/storefront/Hero";
import TrustBar from "@/components/storefront/TrustBar";

export default async function HomePage() {
  const session = await auth();
  const [categories, products, wishlistIds] = await Promise.all([
    getCategoriesWithCatalogHref(),
    getAllProducts(),
    getWishlistProductIds(session?.user?.id),
  ]);

  // Hero media priority: a configured video, then an ad/campaign banner, then
  // the first catalog product image, then a purely typographic hero. Set via
  // NEXT_PUBLIC_STORE_HERO_VIDEO / _HERO_IMAGE so a promo needs no code change.
  const featured = products[0];
  const heroPoster = storeConfig.heroImage || featured?.images?.[0];
  const heroCtaHref =
    storeConfig.heroVideo || storeConfig.heroImage ? storeConfig.heroCtaHref : "/products";

  return (
    <div className="flex flex-col gap-14 md:gap-20">
      <Hero
        videoSrc={storeConfig.heroVideo || undefined}
        poster={heroPoster || undefined}
        posterAlt={featured?.name ?? storeConfig.name}
        ctaHref={heroCtaHref}
      />

      <TrustBar />

      <section className="flex flex-col gap-5">
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="eyebrow">{terms.explore}</span>
            <h2 className="section-title">{terms.exploreHeading}</h2>
          </div>
          <Link
            href="/products"
            className="flex shrink-0 items-center gap-1 text-sm text-muted transition-colors hover:text-foreground"
          >
            View all <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        {categories.length === 0 ? (
          <p className="card-surface p-4 text-sm text-muted">
            No categories yet — run <code>pnpm dlx prisma db seed</code> to add sample data.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`${cat.catalogHref}?category=${cat.slug}`}
                className="card-interactive flex flex-col items-center gap-2 p-4 text-center active:scale-95"
              >
                {cat.imageUrl ? (
                  <SmartImage
                    src={cat.imageUrl}
                    alt={cat.name}
                    width={44}
                    height={44}
                    className="h-11 w-11 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-background text-2xl">
                    {emojiForCategorySlug(cat.slug)}
                  </span>
                )}
                <span className="text-xs font-medium">{cat.name}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-5">
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="eyebrow">Trending</span>
            <h2 className="section-title">{terms.popular}</h2>
          </div>
          <Link
            href="/products"
            className="flex shrink-0 items-center gap-1 text-sm text-muted transition-colors hover:text-foreground"
          >
            View all <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        {products.length === 0 ? (
          <p className="card-surface p-4 text-sm text-muted">
            No products yet — run <code>pnpm dlx prisma db seed</code> to add sample data,
            or add products from the admin dashboard once it&apos;s built.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
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
