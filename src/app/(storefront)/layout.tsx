import Link from "next/link";
import { ShoppingBag, Heart, Sparkle, User } from "lucide-react";
import { storeConfig, storeKind, terms } from "@/config/store";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import BottomNav from "@/components/storefront/BottomNav";
import ChatWidget from "@/components/storefront/ChatWidget";
import CartCount from "@/components/storefront/CartCount";
import CountBadge from "@/components/storefront/CountBadge";
import Footer from "@/components/storefront/Footer";
import RouteHidden from "@/components/RouteHidden";
import SearchBar from "@/components/storefront/SearchBar";
import NavLink from "@/components/storefront/NavLink";
import ThemeToggle from "@/components/ThemeToggle";
import { CartProvider } from "@/lib/cart-context";

const DESKTOP_NAV = [
  { href: "/", label: "Home" },
  { href: "/products", label: storeKind === "hybrid" ? "Products" : terms.catalog },
  ...(storeKind !== "retail" ? [{ href: "/services", label: "Services" }] : []),
];

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const wishlistCount = session?.user
    ? await prisma.wishlistItem.count({ where: { userId: session.user.id } })
    : 0;

  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col overflow-x-clip bg-background">
        {/* Floating pill navigation — a fixed overlay that sits above
            everything (including the full-bleed hero, which bleeds up behind
            it). pointer-events-none on the bar lets clicks fall through the
            transparent gaps; each pill re-enables them. */}
        <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-3 [padding-top:calc(env(safe-area-inset-top)+1.5rem)] sm:px-4">
          <div className="mx-auto flex max-w-[1440px] items-center gap-3">
            {/* Left pill: brand + primary nav */}
            <div
              className="pointer-events-auto flex flex-1 items-center gap-4 rounded-full border bg-background/70 py-2 pl-4 pr-2 backdrop-blur-sm md:gap-6 md:pl-5"
              style={{ borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}
            >
              <Link
                href="/"
                className="flex items-center gap-2 font-display text-lg font-medium tracking-[-0.01em]"
              >
                <Sparkle className="h-4 w-4 fill-current" style={{ color: "var(--brand)" }} />
                {storeConfig.name}
              </Link>

              <nav className="hidden items-center gap-6 md:flex" aria-label="Main">
                {DESKTOP_NAV.map(({ href, label }) => (
                  <NavLink key={href} href={href} label={label} />
                ))}
              </nav>

              <SearchBar className="ml-auto hidden max-w-xl flex-1 lg:block" />
            </div>

            {/* Right pill: actions with bracketed counters */}
            <div
              className="pointer-events-auto flex items-center gap-1 rounded-full border bg-background/70 px-2 py-2 backdrop-blur-sm"
              style={{ borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}
            >
              <ThemeToggle />
              <Link
                href={session?.user ? "/account" : "/login"}
                aria-label={session?.user ? "Account" : "Sign in"}
                className="hidden rounded-full p-1.5 text-foreground/80 transition-colors hover:bg-surface hover:text-foreground sm:block"
              >
                <User className="h-4 w-4" />
              </Link>
              <Link
                href="/wishlist"
                className="hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-sm text-foreground transition-colors hover:bg-surface sm:flex"
              >
                <Heart className="h-4 w-4" />
                <span className="hidden md:inline">Favorite</span>
                <CountBadge count={wishlistCount} />
              </Link>
              <Link
                href="/cart"
                className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm text-foreground transition-colors hover:bg-surface"
              >
                <ShoppingBag className="h-4 w-4" />
                <span className="hidden md:inline">Cart</span>
                <CartCount />
              </Link>
            </div>
          </div>
          <div className="pointer-events-auto mx-auto mt-3 max-w-[1440px] px-1 lg:hidden">
            <SearchBar />
          </div>
        </header>

        {/* Top padding clears the fixed header (taller below lg where the mobile
            search row shows). The home hero cancels it with a matching -mt to
            bleed up behind the nav. */}
        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 pb-24 pt-32 md:pb-16 lg:pt-24">
          {children}
        </main>

        <RouteHidden prefix="/support">
          <Footer />
        </RouteHidden>
        <BottomNav />
        <ChatWidget signedIn={!!session?.user} />
      </div>
    </CartProvider>
  );
}
