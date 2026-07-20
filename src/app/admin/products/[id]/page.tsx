import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAllCategories } from "@/lib/products";
import { productHref } from "@/lib/product-url";
import ProductForm from "@/components/admin/ProductForm";

export const metadata = { title: "Edit product" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    getAllCategories(),
  ]);
  if (!product) notFound();

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Edit product</h1>
        <Link
          href={productHref(product)}
          className="text-xs text-muted hover:text-foreground"
        >
          View in store
        </Link>
      </div>
      <div className="card p-5">
        <ProductForm product={product} categories={categories} />
      </div>
    </div>
  );
}
