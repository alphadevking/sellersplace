/**
 * SellerSpace store configuration.
 *
 * This is the single file to edit when re-skinning this codebase for a new client.
 * Everything here is driven by env vars so branding can differ per deployment
 * without touching app logic.
 */
export const storeConfig = {
  name: process.env.NEXT_PUBLIC_STORE_NAME || "SellersPlace",
  shortName: process.env.NEXT_PUBLIC_STORE_NAME?.slice(0, 12) || "SellersPlace",
  description: "Shop the latest products, delivered to your door.",
  primaryColor: process.env.NEXT_PUBLIC_STORE_PRIMARY_COLOR || "#DC2626",
  backgroundColor: "#FFFFFF",
  currency: "NGN",
  currencySymbol: "₦",
  deliveryFeeFlat: 1500, // default flat delivery fee in kobo-free NGN units
  /**
   * Contact channels for chat-to-order businesses (PurchaseMode CONTACT_SELLER/BOTH).
   * WhatsApp number in international format without "+", e.g. "2348012345678".
   */
  whatsappNumber: process.env.NEXT_PUBLIC_STORE_WHATSAPP || "",
  phone: process.env.NEXT_PUBLIC_STORE_PHONE || "",
  /**
   * Fulfilment wordmark on product cards (the "JUMIA EXPRESS" pattern):
   * shown on directly-buyable physical products when set, e.g. "SELLERSPLACE EXPRESS".
   */
  expressBadge: process.env.NEXT_PUBLIC_STORE_EXPRESS_BADGE || "",
  /**
   * Home hero banner / ad slot. When set, the cinematic hero uses this image
   * (a promo/campaign banner) and links to `heroCtaHref`. When empty, the hero
   * falls back to the first catalog product image, then to a typographic hero.
   * Any image URL works (Cloudinary/Unsplash are size-optimized; others render
   * as-is via SmartImage's <img> fallback).
   */
  heroImage: process.env.NEXT_PUBLIC_STORE_HERO_IMAGE || "",
  /**
   * Hero background video (mp4/webm URL). Takes priority over heroImage and
   * plays muted, looped, and inline; heroImage (or the first product image) is
   * the poster/first frame while it buffers. Defaults to a royalty-free
   * retail/shopping-mall clip (Pexels license — free for commercial use, no
   * attribution); override per deployment with NEXT_PUBLIC_STORE_HERO_VIDEO.
   */
  heroVideo:
    process.env.NEXT_PUBLIC_STORE_HERO_VIDEO ||
    "https://videos.pexels.com/video-files/4517768/4517768-hd_1920_1080_30fps.mp4",
  heroCtaHref: process.env.NEXT_PUBLIC_STORE_HERO_HREF || "/products",
} as const;

/** wa.me deep link with a prefilled message; empty string when WhatsApp isn't configured. */
export function whatsappLink(message: string): string {
  if (!storeConfig.whatsappNumber) return "";
  return `https://wa.me/${storeConfig.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

/**
 * What kind of brand this deployment serves. Drives storefront vocabulary only —
 * behaviour differences come from each offering's own `offeringType`/`priceType`.
 *   retail   → sells physical products (default)
 *   services → sells services (bookings/quotes)
 *   hybrid   → both
 */
export type StoreKind = "retail" | "services" | "hybrid";

const RAW_KIND = process.env.NEXT_PUBLIC_STORE_KIND;
export const storeKind: StoreKind =
  RAW_KIND === "services" || RAW_KIND === "hybrid" ? RAW_KIND : "retail";

const TERMS = {
  retail: {
    catalog: "Products",
    catalogLower: "products",
    allCatalog: "All products",
    popular: "Popular products",
    browse: "Browse products",
    searchPlaceholder: "Search products…",
    cartLabel: "Cart",
    heroTagline: "Shop the latest at",
    heroCta: "Shop now",
    // Shopper-facing word for category browsing — "Categories" is database
    // language; "Explore" invites.
    explore: "Explore",
    exploreHeading: "Shop by category",
  },
  services: {
    catalog: "Services",
    catalogLower: "services",
    allCatalog: "All services",
    popular: "Popular services",
    browse: "Browse services",
    searchPlaceholder: "Search services…",
    cartLabel: "Bookings",
    heroTagline: "Book trusted services at",
    heroCta: "Explore services",
    explore: "Explore",
    exploreHeading: "Browse by need",
  },
  hybrid: {
    catalog: "Catalog",
    catalogLower: "catalog",
    allCatalog: "Full catalog",
    popular: "Popular right now",
    browse: "Browse the catalog",
    searchPlaceholder: "Search products & services…",
    cartLabel: "Cart",
    heroTagline: "Products & services from",
    heroCta: "Explore",
    explore: "Explore",
    exploreHeading: "Explore the range",
  },
} as const;

/** Deployment-specific storefront vocabulary. */
export const terms = TERMS[storeKind];

export type StoreConfig = typeof storeConfig;
