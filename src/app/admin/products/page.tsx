import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/currency";
import { emojiForCategorySlug } from "@/lib/category-icons";
import { toggleProductActive } from "@/app/actions/admin";

export const metadata = { title: "Products" };

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;
  const query = q?.trim() || undefined;

  const where: Prisma.ProductWhereInput = {
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { sku: { contains: query, mode: "insensitive" } },
            { brand: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(category ? { category: { is: { slug: category } } } : {}),
  };

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { category: true },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Products</h1>
        <Link href="/admin/products/new" className="btn-primary !py-2">
          <Plus className="h-4 w-4" /> New product
        </Link>
      </div>

      <form method="GET" action="/admin/products" className="flex flex-wrap items-center gap-2">
        <label
          className="flex min-w-48 flex-1 items-center gap-2 rounded-xl bg-surface px-3.5 py-2 text-sm text-muted sm:max-w-xs"
        >
          <Search className="h-4 w-4 shrink-0" />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Name, SKU, or brand…"
            className="w-full bg-transparent text-foreground outline-none placeholder:text-muted"
          />
        </label>
        <select name="category" defaultValue={category ?? ""} className="input-field w-auto py-2 text-sm">
          <option value="">All categories</option>
          {categories.map((cat) => (
            <option key={cat.slug} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-ghost px-3 py-2 text-sm">
          Filter
        </button>
      </form>

      {products.length === 0 ? (
        <p className="card-surface p-4 text-sm text-muted">
          {query || category
            ? "No products match this filter."
            : "No products yet — add your first one."}
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
