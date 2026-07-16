import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getProductsByCategorySlug } from "@/lib/products";
import { getWishlistProductIds } from "@/lib/wishlist";
import ProductCard from "@/components/storefront/ProductCard";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) notFound();

  const session = await auth();
  const [products, wishlistIds] = await Promise.all([
    getProductsByCategorySlug(slug),
    getWishlistProductIds(session?.user?.id),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">{category.name}</h1>
      {products.length === 0 ? (
        <p className="card-surface p-4 text-sm text-muted">
          No products in this category yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={{ ...product, category }}
              wishlisted={wishlistIds.has(product.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
