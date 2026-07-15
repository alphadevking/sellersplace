import Link from "next/link";
import { Heart, Search, ShoppingCart } from "lucide-react";
import { storeConfig } from "@/config/store";
import BottomNav from "@/components/storefront/BottomNav";
import CartBadge from "@/components/storefront/CartBadge";
import { CartProvider } from "@/lib/cart-context";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <header className="sticky top-0 z-30 border-b border-black/5 bg-background/95 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              {storeConfig.name}
            </Link>
            <div className="flex items-center gap-4 text-foreground">
              <Link href="/wishlist" aria-label="Wishlist">
                <Heart className="h-5 w-5" />
              </Link>
              <Link href="/cart" aria-label="Cart" className="relative">
                <ShoppingCart className="h-5 w-5" />
                <CartBadge />
              </Link>
            </div>
          </div>
          <div className="mx-auto max-w-3xl px-4 pb-3">
            <label className="flex items-center gap-2 rounded-xl bg-surface px-3 py-2 text-sm text-muted">
              <Search className="h-4 w-4 shrink-0" />
              <input
                type="search"
                placeholder="Search products…"
                className="w-full bg-transparent outline-none placeholder:text-muted"
              />
            </label>
          </div>
        </header>

        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-24 pt-4">
          {children}
        </main>

        <BottomNav />
      </div>
    </CartProvider>
  );
}
