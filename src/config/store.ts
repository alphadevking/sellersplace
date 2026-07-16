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
  },
} as const;

/** Deployment-specific storefront vocabulary. */
export const terms = TERMS[storeKind];

export type StoreConfig = typeof storeConfig;
