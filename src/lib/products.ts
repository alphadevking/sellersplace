import { prisma } from "@/lib/prisma";

function searchWhere(query?: string) {
  return {
    isActive: true,
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { description: { contains: query, mode: "insensitive" as const } },
            { category: { is: { name: { contains: query, mode: "insensitive" as const } } } },
          ],
        }
      : {}),
  };
}

export async function getAllProducts(query?: string) {
  return prisma.product.findMany({
    where: searchWhere(query),
    orderBy: { createdAt: "desc" },
    include: { category: true },
  });
}

/** Lightweight typeahead search: top matches plus the total count. */
export async function searchProducts(query: string, limit = 8) {
  const where = searchWhere(query);
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        slug: true,
        name: true,
        price: true,
        compareAtPrice: true,
        images: true,
        category: { select: { slug: true, name: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);
  return { products, total };
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: { category: true },
  });
}

export async function getProductsByCategorySlug(categorySlug: string) {
  return prisma.product.findMany({
    where: { isActive: true, category: { slug: categorySlug } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProductsByIds(ids: string[]) {
  if (ids.length === 0) return [];
  return prisma.product.findMany({ where: { id: { in: ids } } });
}

export async function getAllCategories() {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}
