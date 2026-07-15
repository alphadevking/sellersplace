import Link from "next/link";
import { storeConfig } from "@/config/store";
import { getAllCategories, getAllProducts } from "@/lib/products";
import { emojiForCategorySlug } from "@/lib/category-icons";
import ProductCard from "@/components/storefront/ProductCard";

export default async function HomePage() {
  const [categories, products] = await Promise.all([
    getAllCategories(),
    getAllProducts(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <section
        className="flex flex-col gap-3 rounded-2xl p-5 text-brand-foreground"
        style={{ background: "var(--brand)" }}
      >
        <span className="w-fit rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium">
          New collection
        </span>
        <h1 className="text-2xl font-semibold leading-tight">
          Shop the latest at {storeConfig.name}
        </h1>
        <Link
          href="/categories"
          className="w-fit rounded-lg bg-white px-4 py-2 text-sm font-medium"
          style={{ color: "var(--brand)" }}
        >
          Shop now
        </Link>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Categories</h2>
          <Link href="/categories" className="text-xs text-muted">
            View all
          </Link>
        </div>
        {categories.length === 0 ? (
          <p className="rounded-xl bg-surface p-4 text-sm text-muted">
            No categories yet — run <code>pnpm dlx prisma db seed</code> to add sample data.
          </p>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/categories/${cat.slug}`}
                className="flex flex-col items-center gap-1.5 rounded-xl bg-surface p-3 text-center"
              >
                <span className="text-2xl">{emojiForCategorySlug(cat.slug)}</span>
                <span className="text-xs">{cat.name}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Popular products</h2>
          <Link href="/products" className="text-xs text-muted">
            View all
          </Link>
        </div>
        {products.length === 0 ? (
          <p className="rounded-xl bg-surface p-4 text-sm text-muted">
            No products yet — run <code>pnpm dlx prisma db seed</code> to add sample data,
            or add products from the admin dashboard once it&apos;s built.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
