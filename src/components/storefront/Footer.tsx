import Link from "next/link";
import { developer, developerHref, storeConfig, terms } from "@/config/store";
import BrandMark from "@/components/BrandMark";
import { ShieldCheck, Truck, RotateCcw } from "lucide-react";

const SHOP_LINKS = [
  { href: "/products", label: terms.allCatalog },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/cart", label: "Cart" },
  { href: "/support", label: "Support" },
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
      <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-10 sm:grid-cols-2 md:grid-cols-4">
        <div className="flex flex-col gap-3">
          <span className="flex items-center gap-2.5 font-display text-2xl font-semibold tracking-[-0.02em]">
            <BrandMark size={32} className="h-8 w-8" iconClassName="h-6 w-6" />
            {storeConfig.name}
          </span>
          <p className="max-w-[30ch] text-sm leading-relaxed text-muted">
            {storeConfig.description}
          </p>
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
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-x-6 gap-y-1.5 px-4 py-4 text-xs text-muted">
          <span>
            © {new Date().getFullYear()} {storeConfig.name}. All rights reserved.
          </span>
          <span className="flex items-center gap-4">
            <span>Prices in {storeConfig.currency}</span>
            <a
              href={developerHref}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-foreground"
            >
              Built by <span className="font-medium">{developer.name}</span>
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
