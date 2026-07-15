import { getAllProducts } from "@/lib/products";
import ProductCard from "@/components/storefront/ProductCard";

export const metadata = { title: "All products" };

export default async function ProductsPage() {
  const products = await getAllProducts();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">All products</h1>
      {products.length === 0 ? (
        <p className="rounded-xl bg-surface p-4 text-sm text-muted">
          No products yet. Seed sample data with{" "}
          <code>pnpm dlx prisma db seed</code>, or add products from the admin dashboard.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
