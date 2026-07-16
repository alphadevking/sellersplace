import Link from "next/link";
import { storeConfig } from "@/config/store";
import { ShieldCheck, Truck, RotateCcw } from "lucide-react";

const SHOP_LINKS = [
  { href: "/products", label: "All products" },
  { href: "/categories", label: "Categories" },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/cart", label: "Cart" },
];

const ACCOUNT_LINKS = [
  { href: "/account", label: "My account" },
  { href: "/account", label: "Order history" },
  { href: "/login", label: "Sign in" },
  { href: "/signup", label: "Create account" },
];

export default function Footer() {
  return (
    <footer
      className="mb-16 border-t bg-surface md:mb-0"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 md:grid-cols-4">
        <div className="flex flex-col gap-2">
          <span className="text-base font-semibold tracking-tight">{storeConfig.name}</span>
          <p className="max-w-[28ch] text-sm text-muted">{storeConfig.description}</p>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">Shop</span>
          {SHOP_LINKS.map(({ href, label }) => (
            <Link key={label} href={href} className="text-sm text-foreground/70 hover:text-foreground">
              {label}
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">Account</span>
          {ACCOUNT_LINKS.map(({ href, label }) => (
            <Link key={label} href={href} className="text-sm text-foreground/70 hover:text-foreground">
              {label}
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">Why shop with us</span>
          <div className="flex items-center gap-2 text-sm text-foreground/70">
            <ShieldCheck className="h-4 w-4" style={{ color: "var(--brand)" }} /> Secure checkout
          </div>
          <div className="flex items-center gap-2 text-sm text-foreground/70">
            <Truck className="h-4 w-4" style={{ color: "var(--brand)" }} /> Fast delivery
          </div>
          <div className="flex items-center gap-2 text-sm text-foreground/70">
            <RotateCcw className="h-4 w-4" style={{ color: "var(--brand)" }} /> Easy returns
          </div>
        </div>
      </div>

      <div className="border-t" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 text-xs text-muted">
          <span>
            © {new Date().getFullYear()} {storeConfig.name}. All rights reserved.
          </span>
          <span>Prices in {storeConfig.currency}</span>
        </div>
      </div>
    </footer>
  );
}
