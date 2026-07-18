import Link from "next/link";
import { auth } from "@/lib/auth";
import { getAllCategories } from "@/lib/products";
import {
  browseCatalog,
  parseCatalogSort,
  searchWithFallback,
  type CatalogSort,
} from "@/lib/recommendations";
import { getWishlistProductIds } from "@/lib/wishlist";
import ProductCard, { type ProductCardData } from "@/components/storefront/ProductCard";
import { terms } from "@/config/store";

export const metadata = { title: terms.allCatalog };

const SORT_OPTIONS: { value: CatalogSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
];

function catalogHref(params: { q?: string; category?: string; sort?: string }) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.category) search.set("category", params.category);
  if (params.sort && params.sort !== "newest") search.set("sort", params.sort);
  const qs = search.toString();
  return qs ? `/products?${qs}` : "/products";
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>;
}) {
  const { q, category, sort: sortRaw } = await searchParams;
  const query = q?.trim() || undefined;
  const sort = parseCatalogSort(sortRaw);

  const session = await auth();
  const [categories, outcome, wishlistIds] = await Promise.all([
    getAllCategories(),
    query
      ? searchWithFallback(query, 60, { categorySlug: category, sort })
      : browseCatalog({ categorySlug: category, sort }),
    getWishlistProductIds(session?.user?.id),
  ]);

  const { products, total, fallback } = outcome;
  const showingSuggestions = Boolean(query && fallback);
  const activeCategory = categories.find((c) => c.slug === category);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">
          {query
            ? `Results for “${query}”`
            : activeCategory
              ? activeCategory.name
              : terms.allCatalog}
        </h1>
        {query &&
          (showingSuggestions ? (
            <p className="text-sm text-muted">
              No products match your search — here&apos;s what other shoppers are loving.
            </p>
          ) : (
            <p className="text-sm text-muted">
              {total} result{total !== 1 ? "s" : ""}
              {activeCategory ? ` in ${activeCategory.name}` : ""}
            </p>
          ))}
      </div>

      <div className="flex flex-col gap-3">
        <div className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4">
          <Link
            href={catalogHref({ q: query, sort })}
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
                href={catalogHref({ q: query, category: active ? undefined : cat.slug, sort })}
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

        <form method="GET" action="/products" className="flex items-center gap-2 self-start text-xs">
          {query && <input type="hidden" name="q" value={query} />}
          {category && <input type="hidden" name="category" value={category} />}
          <label className="flex items-center gap-2 text-muted">
            Sort by
            <select
              name="sort"
              defaultValue={sort}
              className="input-field w-auto py-1.5 text-xs"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="btn-ghost px-3 py-1.5 text-xs">
            Apply
          </button>
        </form>
      </div>

      {showingSuggestions && <h2 className="text-sm font-semibold">You may also like</h2>}

      {products.length === 0 ? (
        <p className="card-surface p-4 text-sm text-muted">
          {activeCategory
            ? `Nothing in ${activeCategory.name} yet.`
            : (
              <>
                No products yet. Seed sample data with <code>pnpm dlx prisma db seed</code>,
                or add products from the admin dashboard.
              </>
            )}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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
