import Link from "next/link";
import { storeConfig } from "@/config/store";
import { placeholderCategories, placeholderProducts } from "@/lib/placeholder-data";
import { formatCurrency } from "@/lib/currency";

export default function HomePage() {
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
        <div className="grid grid-cols-4 gap-3">
          {placeholderCategories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/categories/${cat.slug}`}
              className="flex flex-col items-center gap-1.5 rounded-xl bg-surface p-3 text-center"
            >
              <span className="text-2xl">{cat.emoji}</span>
              <span className="text-xs">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Popular products</h2>
          <Link href="/products" className="text-xs text-muted">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {placeholderProducts.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              className="flex flex-col gap-1 rounded-xl bg-surface p-3"
            >
              <div className="flex aspect-square items-center justify-center rounded-lg bg-background text-3xl">
                {product.imageEmoji}
              </div>
              <span className="mt-1 text-sm">{product.name}</span>
              <span className="text-sm font-semibold" style={{ color: "var(--brand)" }}>
                {formatCurrency(product.price)}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
