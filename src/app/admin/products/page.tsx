import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/currency";
import { emojiForCategorySlug } from "@/lib/category-icons";
import { toggleProductActive } from "@/app/actions/admin";

export const metadata = { title: "Products" };

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: true },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Products</h1>
        <Link href="/admin/products/new" className="btn-primary !py-2">
          <Plus className="h-4 w-4" /> New product
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="card-surface p-4 text-sm text-muted">
          No products yet — add your first one.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {products.map((product) => {
            const image = product.images?.[0];
            return (
              <div
                key={product.id}
                className="card flex items-center gap-3 p-3"
              >
                <Link
                  href={`/admin/products/${product.id}`}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface text-xl">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      emojiForCategorySlug(product.category?.slug)
                    )}
                  </div>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className={`truncate text-sm font-medium ${product.isActive ? "" : "text-muted line-through"}`}>
                      {product.name}
                    </span>
                    <span className="text-xs text-muted">
                      {formatCurrency(Number(product.price))} ·{" "}
                      {product.stock === 0 ? (
                        <span className="text-red-600">out of stock</span>
                      ) : (
                        `${product.stock} in stock`
                      )}
                      {product.category ? ` · ${product.category.name}` : ""}
                    </span>
                  </div>
                </Link>
                <form action={toggleProductActive}>
                  <input type="hidden" name="id" value={product.id} />
                  <button
                    type="submit"
                    className="shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
                    style={
                      product.isActive
                        ? { borderColor: "var(--border)", color: "var(--muted)" }
                        : { borderColor: "var(--brand)", color: "var(--brand)" }
                    }
                  >
                    {product.isActive ? "Unpublish" : "Publish"}
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
