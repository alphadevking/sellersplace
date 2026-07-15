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
} as const;

export type StoreConfig = typeof storeConfig;
