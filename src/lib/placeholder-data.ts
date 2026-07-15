// Placeholder data — replace with prisma.product.findMany() once DATABASE_URL is configured.
// Kept here so the storefront renders meaningfully before a DB is wired up.

export type PlaceholderProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  imageEmoji: string;
  categorySlug: string;
};

export const placeholderCategories = [
  { slug: "fashion", name: "Fashion", emoji: "👗" },
  { slug: "electronics", name: "Electronics", emoji: "🎧" },
  { slug: "grocery", name: "Grocery", emoji: "🛒" },
  { slug: "cosmetics", name: "Cosmetics", emoji: "💄" },
];

export const placeholderProducts: PlaceholderProduct[] = [
  { id: "1", slug: "smart-watch", name: "Smart Watch", price: 89999, imageEmoji: "⌚️", categorySlug: "electronics" },
  { id: "2", slug: "wireless-headphones", name: "Wireless Headphones", price: 45999, imageEmoji: "🎧", categorySlug: "electronics" },
  { id: "3", slug: "leather-handbag", name: "Leather Handbag", price: 62500, imageEmoji: "👜", categorySlug: "fashion" },
];
