import Link from "next/link";
import { formatCurrency } from "@/lib/currency";
import { emojiForCategorySlug } from "@/lib/category-icons";
import WishlistButton from "@/components/storefront/WishlistButton";

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  // Prisma returns Decimal for price; anything Number() can coerce works here.
  price: number | string | { toString(): string };
  images: string[];
  category?: { slug: string } | null;
};

export default function ProductCard({
  product,
  wishlisted,
}: {
  product: ProductCardData;
  wishlisted?: boolean;
}) {
  const image = product.images?.[0];

  return (
    <Link
      href={`/products/${product.slug}`}
      className="card-surface group flex flex-col gap-1 p-3 transition-transform hover:-translate-y-0.5"
    >
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-background text-3xl">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          emojiForCategorySlug(product.category?.slug)
        )}
        <WishlistButton productId={product.id} initialWishlisted={wishlisted ?? false} />
      </div>
      <span className="mt-1 text-sm">{product.name}</span>
      <span className="text-sm font-semibold" style={{ color: "var(--brand)" }}>
        {formatCurrency(Number(product.price))}
      </span>
    </Link>
  );
}
