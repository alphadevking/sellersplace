import { prisma } from "@/lib/prisma";

/**
 * Staged retrieval pipeline — the standard e-commerce "retrieve → rank →
 * fallback" pattern (what Jumia/Amazon-class search does, scaled down to
 * Postgres):
 *
 *   Stage 1  PHRASE   — the whole query matches name/brand/description/category.
 *   Stage 2  TOKENS   — any individual word of the query matches (recall boost,
 *                       catches "red leather bag" when only "leather bag" exists).
 *   Stage 3  FALLBACK — nothing matched: recommend best sellers (real order
 *                       volume), topped up with newest arrivals. Search never
 *                       returns an empty shelf.
 *
 * Each stage only runs when the previous one found nothing, so the common case
 * stays a single query. To upgrade later, insert stages between 2 and 3:
 *   - pg_trgm `similarity()` for typo tolerance (CREATE EXTENSION pg_trgm),
 *   - Postgres full-text search (tsvector) for stemming/ranking,
 *   - pgvector embeddings for semantic "meaning" matches,
 * and swap Stage 3's popularity rank for per-user signals (view/cart/purchase
 * history) when personalization data exists.
 */

const CARD_SELECT = {
  id: true,
  slug: true,
  name: true,
  brand: true,
  price: true,
  compareAtPrice: true,
  images: true,
  purchaseMode: true,
  offeringType: true,
  priceType: true,
  category: { select: { slug: true, name: true } },
} as const;

type Insensitive = { contains: string; mode: "insensitive" };

function fieldMatches(term: string) {
  const match: Insensitive = { contains: term, mode: "insensitive" };
  return [
    { name: match },
    { brand: match },
    { description: match },
    { category: { is: { name: match } } },
  ];
}

function phraseWhere(query: string) {
  return { isActive: true, OR: fieldMatches(query) };
}

function tokenWhere(query: string) {
  const tokens = query.split(/\s+/).filter((t) => t.length >= 2);
  if (tokens.length <= 1) return null; // identical to the phrase stage
  return { isActive: true, OR: tokens.flatMap(fieldMatches) };
}

async function findStage(where: NonNullable<ReturnType<typeof phraseWhere>>, limit: number) {
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      select: CARD_SELECT,
    }),
    prisma.product.count({ where }),
  ]);
  return { products, total };
}

/** Best sellers by actual order volume, topped up with newest actives. */
export async function getPopularProducts(limit = 8, excludeIds: string[] = []) {
  const sales = await prisma.orderItem.groupBy({
    by: ["productId"],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit * 2, // headroom: some best sellers may be inactive/excluded
  });
  const rankedIds = sales.map((s) => s.productId).filter((id) => !excludeIds.includes(id));

  const bestSellers = rankedIds.length
    ? await prisma.product.findMany({
        where: { id: { in: rankedIds }, isActive: true },
        select: CARD_SELECT,
      })
    : [];
  // groupBy order isn't preserved by findMany — restore the sales ranking.
  const byRank = new Map(rankedIds.map((id, i) => [id, i]));
  bestSellers.sort((a, b) => (byRank.get(a.id) ?? 0) - (byRank.get(b.id) ?? 0));

  const picked = bestSellers.slice(0, limit);
  if (picked.length < limit) {
    const fill = await prisma.product.findMany({
      where: {
        isActive: true,
        id: { notIn: [...picked.map((p) => p.id), ...excludeIds] },
      },
      orderBy: { createdAt: "desc" },
      take: limit - picked.length,
      select: CARD_SELECT,
    });
    picked.push(...fill);
  }
  return picked;
}

/** Products from the same category (popular first), for "more like this" shelves. */
export async function getRelatedProducts(productId: string, limit = 8) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { categoryId: true },
  });
  if (!product?.categoryId) return getPopularProducts(limit, [productId]);

  const siblings = await prisma.product.findMany({
    where: { isActive: true, categoryId: product.categoryId, id: { not: productId } },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: CARD_SELECT,
  });
  if (siblings.length >= limit) return siblings;

  const fill = await getPopularProducts(limit - siblings.length, [
    productId,
    ...siblings.map((s) => s.id),
  ]);
  return [...siblings, ...fill];
}

export type SearchOutcome = {
  products: Awaited<ReturnType<typeof getPopularProducts>>;
  total: number;
  /** True when nothing matched and `products` are recommendations instead. */
  fallback: boolean;
};

export async function searchWithFallback(query: string, limit = 8): Promise<SearchOutcome> {
  const phrase = await findStage(phraseWhere(query), limit);
  if (phrase.total > 0) return { ...phrase, fallback: false };

  const tokens = tokenWhere(query);
  if (tokens) {
    const tokenStage = await findStage(tokens, limit);
    if (tokenStage.total > 0) return { ...tokenStage, fallback: false };
  }

  const suggestions = await getPopularProducts(limit);
  return { products: suggestions, total: 0, fallback: true };
}
