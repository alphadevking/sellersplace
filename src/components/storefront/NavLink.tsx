"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Desktop primary-nav link with an editorial active state — a small brand
 * underline that appears on the current section. Home matches exactly; other
 * sections match by path prefix so e.g. /products/slug still marks "Products".
 */
export default function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className="relative py-1 text-sm transition-colors"
      style={{ color: active ? "var(--foreground)" : "var(--muted)" }}
    >
      {label}
      <span
        className="absolute -bottom-0.5 left-0 h-0.5 rounded-full transition-all duration-200"
        style={{
          width: active ? "100%" : "0%",
          background: "var(--brand)",
        }}
      />
    </Link>
  );
}
