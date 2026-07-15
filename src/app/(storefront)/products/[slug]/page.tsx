import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getProductBySlug } from "@/lib/products";
import { getWishlistProductIds } from "@/lib/wishlist";
import { formatCurrency } from "@/lib/currency";
import { emojiForCategorySlug } from "@/lib/category-icons";
import AddToCartButton from "@/components/storefront/AddToCartButton";
import WishlistButton from "@/components/storefront/WishlistButton";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product || !product.isActive) notFound();

  const session = await auth();
  const wishlistIds = await getWishlistProductIds(session?.user?.id);

  const image = product.images?.[0];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-surface text-6xl">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          emojiForCategorySlug(product.category?.slug)
        )}
      </div>

      <div className="flex flex-col gap-1">
        {product.category && (
          <span className="text-xs text-muted">{product.category.name}</span>
        )}
        <h1 className="text-xl font-semibold">{product.name}</h1>
        <span className="text-lg font-semibold" style={{ color: "var(--brand)" }}>
          {formatCurrency(Number(product.price))}
        </span>
        {product.stock <= 0 ? (
          <span className="text-xs text-red-600">Out of stock</span>
        ) : product.stock <= 5 ? (
          <span className="text-xs text-muted">Only {product.stock} left</span>
        ) : null}
      </div>

      {product.description && (
        <p className="text-sm leading-relaxed text-foreground/80">
          {product.description}
        </p>
      )}

      <div className="flex items-stretch gap-2">
        {product.stock > 0 && (
          <div className="flex-1">
            <AddToCartButton productId={product.id} />
          </div>
        )}
        <WishlistButton
          productId={product.id}
          initialWishlisted={wishlistIds.has(product.id)}
          variant="detail"
        />
      </div>
    </div>
  );
}
