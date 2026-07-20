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
      <div className="card-surface flex flex-col items-center gap-3 p-8 text-center">
        <Heart className="h-8 w-8" style={{ color: "var(--muted)" }} />
        <div>
          <h1 className="text-base font-semibold">Your wishlist lives here</h1>
          <p className="mt-1 text-sm text-muted">
            Sign in to save products you love and find them again on any device.
          </p>
        </div>
        <Link href="/login?callbackUrl=/wishlist" className="btn-primary w-full max-w-xs">
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
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">Wishlist</h1>
        <p className="text-sm text-muted">
          {items.length === 0
            ? "Nothing saved yet."
            : `${items.length} saved item${items.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="card-surface flex flex-col items-center gap-3 p-8 text-center">
          <Heart className="h-8 w-8" style={{ color: "var(--muted)" }} />
          <p className="text-sm text-muted">
            Tap the heart on any product to save it for later.
          </p>
          <Link href="/products" className="btn-outline w-full max-w-xs">
            Browse products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map((item) => (
            <ProductCard key={item.id} product={item.product} wishlisted />
          ))}
        </div>
      )}
    </div>
  );
}
