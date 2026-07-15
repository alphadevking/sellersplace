import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getProductsByCategorySlug } from "@/lib/products";
import ProductCard from "@/components/storefront/ProductCard";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) notFound();

  const products = await getProductsByCategorySlug(slug);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">{category.name}</h1>
      {products.length === 0 ? (
        <p className="card-surface p-4 text-sm text-muted">
          No products in this category yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={{ ...product, category }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
