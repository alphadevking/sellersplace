// Cosmetic fallback for categories/products that don't have an image yet.
// Real deployments should upload real product photography — this just keeps
// the UI from showing broken image icons in the meantime.
export const categoryEmoji: Record<string, string> = {
  fashion: "👗",
  electronics: "🎧",
  grocery: "🛒",
  cosmetics: "💄",
  services: "🛠️",
};

export function emojiForCategorySlug(slug?: string | null): string {
  return (slug && categoryEmoji[slug]) || "📦";
}
