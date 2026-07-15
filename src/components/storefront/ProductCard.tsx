import Link from "next/link";
import { formatCurrency } from "@/lib/currency";
import { emojiForCategorySlug } from "@/lib/category-icons";

export type ProductCardData = {
  slug: string;
  name: string;
  price: number | string;
  images: string[];
  category?: { slug: string } | null;
};

export default function ProductCard({ product }: { product: ProductCardData }) {
  const image = product.images?.[0];

  return (
    <Link
      href={`/products/${product.slug}`}
      className="flex flex-col gap-1 rounded-xl bg-surface p-3"
    >
      <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-background text-3xl">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          emojiForCategorySlug(product.category?.slug)
        )}
      </div>
      <span className="mt-1 text-sm">{product.name}</span>
      <span className="text-sm font-semibold" style={{ color: "var(--brand)" }}>
        {formatCurrency(Number(product.price))}
      </span>
    </Link>
  );
}
