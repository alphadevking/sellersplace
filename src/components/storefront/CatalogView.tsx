import Link from "next/link";
import { auth } from "@/lib/auth";
import { getCategoriesForOfferingType } from "@/lib/products";
import {
  browseCatalog,
  getCatalogBrands,
  getPriceBounds,
  parseCatalogSort,
  recordSearch,
  searchWithFallback,
  type CatalogSort,
} from "@/lib/recommendations";
import { getWishlistProductIds } from "@/lib/wishlist";
import CatalogFilterBar from "@/components/storefront/CatalogFilterBar";
import ProductCard, { type ProductCardData } from "@/components/storefront/ProductCard";

const SORT_OPTIONS: { value: CatalogSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
];

const LABELS = {
  PRODUCT: {
    basePath: "/products",
    heading: "All products",
    noun: "product",
    empty: "No products yet. Seed sample data with pnpm dlx prisma db seed, or add products from the admin dashboard.",
  },
  SERVICE: {
    basePath: "/services",
    heading: "All services",
    noun: "service",
    empty: "No services yet. Add one from the admin dashboard.",
  },
} as const;

function parsePrice(value?: string) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export type CatalogSearchParams = {
  q?: string;
  category?: string;
  sort?: string;
  brand?: string;
  min?: string;
  max?: string;
};

/**
 * Shared catalog listing for both /products and /services — same search,
 * filter, and sort pipeline, scoped to one side of the offering-type split
 * so a shopper browsing services never sees physical goods mixed in.
 */
export default async function CatalogView({
  offeringType,
  searchParams,
}: {
  offeringType: "PRODUCT" | "SERVICE";
  searchParams: Promise<CatalogSearchParams>;
}) {
  const labels = LABELS[offeringType];
  const { q, category, sort: sortRaw, brand, min, max } = await searchParams;
  const query = q?.trim() || undefined;
  const sort = parseCatalogSort(sortRaw);
  const selectedBrands = (brand ?? "")
    .split(",")
    .map((b) => b.trim())
    .filter(Boolean);
  const filter = {
    categorySlug: category,
    brands: selectedBrands.length ? selectedBrands : undefined,
    minPrice: parsePrice(min),
    maxPrice: parsePrice(max),
    offeringType,
  };

  function catalogHref(params: {
    q?: string;
    category?: string;
    sort?: string;
    brand?: string;
    min?: string;
    max?: string;
  }) {
    const search = new URLSearchParams();
    if (params.q) search.set("q", params.q);
    if (params.category) search.set("category", params.category);
    if (params.sort && params.sort !== "newest") search.set("sort", params.sort);
    if (params.brand) search.set("brand", params.brand);
    if (params.min) search.set("min", params.min);
    if (params.max) search.set("max", params.max);
    const qs = search.toString();
    return qs ? `${labels.basePath}?${qs}` : labels.basePath;
  }

  // A results-page visit is a deliberate search — log it for trending.
  if (query) await recordSearch(query);

  const session = await auth();
  const [categories, brands, bounds, outcome, wishlistIds] = await Promise.all([
    getCategoriesForOfferingType(offeringType),
    getCatalogBrands(category, offeringType),
    getPriceBounds(category, offeringType),
    query
      ? searchWithFallback(query, 60, { ...filter, sort })
      : browseCatalog({ ...filter, sort }),
    getWishlistProductIds(session?.user?.id),
  ]);

  const { products, total, fallback } = outcome;
  const showingSuggestions = Boolean(query && fallback);
  const activeCategory = categories.find((c) => c.slug === category);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="flex flex-wrap items-baseline gap-2 text-lg font-semibold">
          {query
            ? `Results for “${query}”`
            : activeCategory
              ? activeCategory.name
              : labels.heading}
          {!showingSuggestions && (
            <span className="text-sm font-normal text-muted">
              ({total} {labels.noun}
              {total !== 1 ? "s" : ""} found)
            </span>
          )}
        </h1>
        {showingSuggestions && (
          <p className="text-sm text-muted">
            No {labels.noun}s match your search — here&apos;s what other shoppers are loving.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4">
          <Link
            href={catalogHref({ q: query, sort, brand: selectedBrands.join(","), min, max })}
            className="shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
            style={
              !category
                ? {
                    background: "var(--brand)",
                    borderColor: "var(--brand)",
                    color: "var(--brand-foreground)",
                  }
                : { borderColor: "var(--border)", color: "var(--muted)" }
            }
          >
            All
          </Link>
          {categories.map((cat) => {
            const active = cat.slug === category;
            return (
              <Link
                key={cat.slug}
                href={catalogHref({
                  q: query,
                  category: active ? undefined : cat.slug,
                  sort,
                  brand: selectedBrands.join(","),
                  min,
                  max,
                })}
                className="shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
                style={
                  active
                    ? {
                        background: "var(--brand)",
                        borderColor: "var(--brand)",
                        color: "var(--brand-foreground)",
                      }
                    : { borderColor: "var(--border)", color: "var(--muted)" }
                }
              >
                {cat.name}
              </Link>
            );
          })}
        </div>

        <CatalogFilterBar
          basePath={labels.basePath}
          brands={brands}
          selectedBrands={selectedBrands}
          bounds={bounds}
          min={filter.minPrice}
          max={filter.maxPrice}
          sort={sort}
          sortOptions={SORT_OPTIONS}
          query={query}
          category={category}
        />
      </div>

      {showingSuggestions && <h2 className="text-sm font-semibold">You may also like</h2>}

      {products.length === 0 ? (
        <p className="card-surface p-4 text-sm text-muted">
          {selectedBrands.length || filter.minPrice || filter.maxPrice ? (
            <>
              Nothing matches these filters
              {activeCategory ? ` in ${activeCategory.name}` : ""}.{" "}
              <Link
                href={catalogHref({ q: query, category })}
                className="font-medium"
                style={{ color: "var(--brand)" }}
              >
                Clear filters
              </Link>
            </>
          ) : activeCategory ? (
            `Nothing in ${activeCategory.name} yet.`
          ) : (
            labels.empty
          )}
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-3 md:grid-cols-4 lg:grid-cols-5">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product as ProductCardData}
              wishlisted={wishlistIds.has(product.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
