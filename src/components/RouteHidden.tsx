"use client";

import { usePathname } from "next/navigation";

/**
 * Hides its children on routes matching the given prefix. The children stay
 * server-rendered (they're passed through as a slot) — only the show/hide
 * decision runs on the client, so e.g. the Footer can stay a server component
 * while being suppressed on the full-height /support chat page.
 */
export default function RouteHidden({
  prefix,
  children,
}: {
  prefix: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  if (pathname.startsWith(prefix)) return null;
  return <>{children}</>;
}
