import { auth } from "@/lib/auth";
import { getAllProducts } from "@/lib/products";
import { getWishlistProductIds } from "@/lib/wishlist";
import ProductCard from "@/components/storefront/ProductCard";

export const metadata = { title: "All products" };

export default async function ProductsPage() {
  const session = await auth();
  const [products, wishlistIds] = await Promise.all([
    getAllProducts(),
    getWishlistProductIds(session?.user?.id),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">All products</h1>
      {products.length === 0 ? (
        <p className="card-surface p-4 text-sm text-muted">
          No products yet. Seed sample data with{" "}
          <code>pnpm dlx prisma db seed</code>, or add products from the admin dashboard.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              wishlisted={wishlistIds.has(product.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
