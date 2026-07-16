import { auth } from "@/lib/auth";
import { getAllProducts } from "@/lib/products";
import { searchWithFallback } from "@/lib/recommendations";
import { getWishlistProductIds } from "@/lib/wishlist";
import ProductCard, { type ProductCardData } from "@/components/storefront/ProductCard";
import { terms } from "@/config/store";

export const metadata = { title: terms.allCatalog };

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() || undefined;

  const session = await auth();
  const [outcome, wishlistIds] = await Promise.all([
    query
      ? searchWithFallback(query, 60)
      : getAllProducts().then((products) => ({
          products,
          total: products.length,
          fallback: false,
        })),
    getWishlistProductIds(session?.user?.id),
  ]);

  const { products, total, fallback } = outcome;
  const showingSuggestions = Boolean(query && fallback);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">
          {query ? `Results for “${query}”` : terms.allCatalog}
        </h1>
        {query &&
          (showingSuggestions ? (
            <p className="text-sm text-muted">
              No products match your search — here&apos;s what other shoppers are loving.
            </p>
          ) : (
            <p className="text-sm text-muted">
              {total} product{total !== 1 ? "s" : ""} found
            </p>
          ))}
      </div>

      {showingSuggestions && (
        <h2 className="text-sm font-semibold">You may also like</h2>
      )}

      {products.length === 0 ? (
        <p className="card-surface p-4 text-sm text-muted">
          No products yet. Seed sample data with <code>pnpm dlx prisma db seed</code>, or
          add products from the admin dashboard.
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
