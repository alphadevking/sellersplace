import { Sparkle } from "lucide-react";
import { storeConfig } from "@/config/store";
import SmartImage from "@/components/SmartImage";

/**
 * The store's visual mark, used beside the wordmark everywhere (nav, footer,
 * auth, admin): the configured logo when NEXT_PUBLIC_STORE_LOGO is set,
 * otherwise the brand-colored Sparkle glyph.
 */
export default function BrandMark({
  size = 36,
  className = "h-9 w-9",
  iconClassName = "h-6 w-6",
}: {
  /** Intrinsic width/height for the logo image. */
  size?: number;
  /** Display classes for the logo image (h-*, w-*). */
  className?: string;
  /** Display classes for the Sparkle fallback. */
  iconClassName?: string;
}) {
  if (storeConfig.logoUrl) {
    return (
      <SmartImage
        src={storeConfig.logoUrl}
        alt={`${storeConfig.name} logo`}
        width={size}
        height={size}
        className={`rounded-full object-cover ${className}`}
      />
    );
  }
  return (
    <Sparkle
      className={`${iconClassName} fill-current`}
      style={{ color: "var(--brand)" }}
    />
  );
}
