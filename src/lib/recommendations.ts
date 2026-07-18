import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Staged retrieval pipeline — the standard e-commerce "retrieve → rank →
 * fallback" pattern (what Jumia/Amazon-class search does, scaled down to
 * Postgres):
 *
 *   Stage 1  PHRASE   — the whole query matches name/brand/description/category.
 *   Stage 2  TOKENS   — any individual word of the query matches (recall boost,
 *                       catches "red leather bag" when only "leather bag" exists).
 *   Stage 3  FUZZY    — pg_trgm word similarity catches typos ("perfuem" →
 *                       "Perfume"), ranked by similarity, GIN-indexed.
 *   Stage 4  FALLBACK — nothing matched: recommend best sellers (real order
 *                       volume), topped up with newest arrivals. Search never
 *                       returns an empty shelf.
 *
 * Each stage only runs when the previous one found nothing, so the common case
 * stays a single query. Future upgrades slot between 3 and 4: Postgres
 * full-text (tsvector) for stemming, pgvector embeddings for semantic matches;
 * and Stage 4's popularity rank can become per-user when behaviour data exists.
 *
 * Deliberate searches are logged to SearchQuery (see recordSearch) — that
 * powers trending suggestions and, later, search-driven ranking.
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
  ratingAvg: true,
  ratingCount: true,
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

/** Extra catalog constraints applied to every stage (category browsing etc.). */
export type CatalogFilter = {
  categorySlug?: string;
  /** Multi-select, Jumia-style: a product matches when its brand is any of these. */
  brands?: string[];
  minPrice?: number;
  maxPrice?: number;
};

function baseWhere(filter: CatalogFilter) {
  const price = {
    ...(filter.minPrice != null && filter.minPrice > 0 ? { gte: filter.minPrice } : {}),
    ...(filter.maxPrice != null && filter.maxPrice > 0 ? { lte: filter.maxPrice } : {}),
  };
  return {
    isActive: true,
    ...(filter.categorySlug ? { category: { is: { slug: filter.categorySlug } } } : {}),
    ...(filter.brands?.length ? { brand: { in: filter.brands } } : {}),
    ...(Object.keys(price).length ? { price } : {}),
  };
}

/** Real catalog price range (category-scoped) — bounds the price slider. */
export async function getPriceBounds(categorySlug?: string) {
  const agg = await prisma.product.aggregate({
    where: baseWhere({ categorySlug }),
    _min: { price: true },
    _max: { price: true },
  });
  return {
    min: agg._min.price ? Math.floor(Number(agg._min.price)) : 0,
    max: agg._max.price ? Math.ceil(Number(agg._max.price)) : 0,
  };
}

/** Distinct brand names for the filter dropdown, narrowed by category when given. */
export async function getCatalogBrands(categorySlug?: string) {
  const rows = await prisma.product.findMany({
    where: {
      isActive: true,
      brand: { not: null },
      ...(categorySlug ? { category: { is: { slug: categorySlug } } } : {}),
    },
    select: { brand: true },
    distinct: ["brand"],
    orderBy: { brand: "asc" },
  });
  return rows.map((r) => r.brand).filter((b): b is string => !!b);
}

function phraseWhere(query: string, filter: CatalogFilter = {}) {
  return { ...baseWhere(filter), OR: fieldMatches(query) };
}

function tokenWhere(query: string, filter: CatalogFilter = {}) {
  const tokens = query.split(/\s+/).filter((t) => t.length >= 2);
  if (tokens.length <= 1) return null; // identical to the phrase stage
  return { ...baseWhere(filter), OR: tokens.flatMap(fieldMatches) };
}

export type CatalogSort = "newest" | "price-asc" | "price-desc" | "rating";

const SORT_ORDER = {
  newest: { createdAt: "desc" },
  "price-asc": { price: "asc" },
  "price-desc": { price: "desc" },
  rating: { ratingAvg: { sort: "desc", nulls: "last" } },
} as const satisfies Record<CatalogSort, object>;

export function parseCatalogSort(value?: string): CatalogSort {
  return value && value in SORT_ORDER ? (value as CatalogSort) : "newest";
}

async function findStage(
  where: ReturnType<typeof phraseWhere>,
  limit: number,
  sort: CatalogSort = "newest"
) {
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: SORT_ORDER[sort],
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
    where: { productId: { not: null } }, // custom invoice lines have no product
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit * 2, // headroom: some best sellers may be inactive/excluded
  });
  const rankedIds = sales
    .map((s) => s.productId)
    .filter((id): id is string => id !== null && !excludeIds.includes(id));

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

/**
 * Stage 3: pg_trgm typo tolerance. Finds products whose name/brand contains a
 * word similar to the query ("perfuem" ≈ "Perfume"), then applies the normal
 * catalog filters and preserves the similarity ranking.
 */
async function fuzzyStage(query: string, filter: CatalogFilter, limit: number) {
  let ranked: { id: string }[];
  try {
    ranked = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
      SELECT id
      FROM "Product"
      WHERE "isActive"
        AND GREATEST(
          word_similarity(${query}, name),
          word_similarity(${query}, coalesce(brand, ''))
        ) > 0.4
      ORDER BY GREATEST(
        word_similarity(${query}, name),
        word_similarity(${query}, coalesce(brand, ''))
      ) DESC
      LIMIT 40
    `);
  } catch (err) {
    // pg_trgm missing (e.g. fresh local DB without the migration) — degrade
    // gracefully to the fallback stage rather than erroring the search.
    console.error("Fuzzy search unavailable:", err);
    return null;
  }
  if (ranked.length === 0) return null;

  const ids = ranked.map((r) => r.id);
  const products = await prisma.product.findMany({
    where: { ...baseWhere(filter), id: { in: ids } },
    select: CARD_SELECT,
  });
  if (products.length === 0) return null;

  const byRank = new Map(ids.map((id, i) => [id, i]));
  products.sort((a, b) => (byRank.get(a.id) ?? 0) - (byRank.get(b.id) ?? 0));
  return { products: products.slice(0, limit), total: products.length };
}

export async function searchWithFallback(
  query: string,
  limit = 8,
  opts: CatalogFilter & { sort?: CatalogSort } = {}
): Promise<SearchOutcome> {
  const sort = opts.sort ?? "newest";

  const phrase = await findStage(phraseWhere(query, opts), limit, sort);
  if (phrase.total > 0) return { ...phrase, fallback: false };

  const tokens = tokenWhere(query, opts);
  if (tokens) {
    const tokenStage = await findStage(tokens, limit, sort);
    if (tokenStage.total > 0) return { ...tokenStage, fallback: false };
  }

  const fuzzy = await fuzzyStage(query, opts, limit);
  if (fuzzy) return { ...fuzzy, fallback: false };

  const suggestions = await getPopularProducts(limit);
  return { products: suggestions, total: 0, fallback: true };
}

/** Log a deliberate search (results-page visit) — one row per normalized term. */
export async function recordSearch(rawTerm: string) {
  const term = rawTerm.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 80);
  if (term.length < 2) return;
  try {
    await prisma.searchQuery.upsert({
      where: { term },
      update: { count: { increment: 1 }, lastSearchedAt: new Date() },
      create: { term },
    });
  } catch (err) {
    console.error("Failed to record search:", err); // tracking never breaks search
  }
}

/** Most-searched terms of the last 30 days, for the search bar's trending list. */
export async function getTrendingSearches(limit = 6) {
  const rows = await prisma.searchQuery.findMany({
    where: { lastSearchedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    orderBy: [{ count: "desc" }, { lastSearchedAt: "desc" }],
    take: limit,
    select: { term: true },
  });
  return rows.map((r) => r.term);
}

/**
 * Filtered/sorted catalog listing (no search query) — the browse counterpart
 * to searchWithFallback, sharing the same card shape.
 */
export async function browseCatalog(opts: CatalogFilter & { sort?: CatalogSort; limit?: number }) {
  const where = baseWhere(opts);
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: SORT_ORDER[opts.sort ?? "newest"],
      take: opts.limit ?? 60,
      select: CARD_SELECT,
    }),
    prisma.product.count({ where }),
  ]);
  return { products, total, fallback: false as const };
}
