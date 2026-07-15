import Link from "next/link";
import { Search, ShoppingCart, User } from "lucide-react";
import { storeConfig } from "@/config/store";
import { auth } from "@/lib/auth";
import BottomNav from "@/components/storefront/BottomNav";
import CartBadge from "@/components/storefront/CartBadge";
import { CartProvider } from "@/lib/cart-context";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md" style={{ borderColor: "var(--border)" }}>
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3.5">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              {storeConfig.name}
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href={session?.user ? "/account" : "/login"}
                aria-label="Account"
                className="hidden items-center gap-1.5 text-sm text-foreground/80 hover:text-foreground sm:flex"
              >
                <User className="h-4 w-4" />
                {session?.user ? session.user.name?.split(" ")[0] || "Account" : "Sign in"}
              </Link>
              <Link href="/cart" aria-label="Cart" className="relative">
                <ShoppingCart className="h-5 w-5" />
                <CartBadge />
              </Link>
            </div>
          </div>
          <div className="mx-auto max-w-3xl px-4 pb-3.5">
            <label className="flex items-center gap-2 rounded-xl bg-surface px-3.5 py-2.5 text-sm text-muted transition-shadow focus-within:ring-2" style={{ ["--tw-ring-color" as string]: "var(--brand-soft)" }}>
              <Search className="h-4 w-4 shrink-0" />
              <input
                type="search"
                placeholder="Search products…"
                className="w-full bg-transparent text-foreground outline-none placeholder:text-muted"
              />
            </label>
          </div>
        </header>

        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-24 pt-5">
          {children}
        </main>

        <BottomNav />
      </div>
    </CartProvider>
  );
}
