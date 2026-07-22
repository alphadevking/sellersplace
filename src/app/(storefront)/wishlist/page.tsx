import Link from "next/link";
import { Heart } from "lucide-react";
import { auth } from "@/lib/auth";
import { getWishlistItems } from "@/lib/wishlist";
import ProductCard from "@/components/storefront/ProductCard";

export const metadata = { title: "Wishlist" };

export default async function WishlistPage() {
  const session = await auth();

  if (!session?.user) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface">
          <Heart className="h-7 w-7" style={{ color: "var(--muted)" }} />
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="section-title">Your wishlist lives here</h1>
          <p className="text-sm text-muted">
            Sign in to save products you love and find them again on any device.
          </p>
        </div>
        <Link href="/login?callbackUrl=/wishlist" className="btn-primary btn-lg w-full max-w-xs justify-center">
          Sign in
        </Link>
        <Link href="/signup" className="text-sm text-muted hover:text-foreground">
          New here? Create an account
        </Link>
      </div>
    );
  }

  const items = await getWishlistItems(session.user.id);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <span className="eyebrow">Saved for later</span>
        <h1 className="section-title">Wishlist</h1>
        <p className="text-sm text-muted">
          {items.length === 0
            ? "Nothing saved yet."
            : `${items.length} saved item${items.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface">
            <Heart className="h-7 w-7" style={{ color: "var(--muted)" }} />
          </div>
          <p className="text-sm text-muted">
            Tap the heart on any product to save it for later.
          </p>
          <Link href="/products" className="btn-outline btn-lg w-full max-w-xs justify-center">
            Browse products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map((item) => (
            <ProductCard key={item.id} product={item.product} wishlisted />
          ))}
        </div>
      )}
    </div>
  );
}
