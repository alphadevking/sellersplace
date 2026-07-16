import { prisma } from "@/lib/prisma";

// Query-driven search lives in lib/recommendations.ts (staged pipeline with
// popularity fallback); this module covers plain catalog reads.
export async function getAllProducts() {
  return prisma.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    include: { category: true },
  });
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      variants: { where: { isActive: true }, orderBy: { createdAt: "asc" } },
    },
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
  return prisma.product.findMany({
    where: { id: { in: ids } },
    include: { variants: { where: { isActive: true } } },
  });
}

export async function getAllCategories() {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}
