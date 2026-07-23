import { cache } from "react";
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

// cache(): generateMetadata and the page component both call this during one
// request — dedupe so the product is fetched once per render.
export const getProductBySlug = cache(async (slug: string) => {
  return prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      variants: { where: { isActive: true }, orderBy: { createdAt: "asc" } },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { user: { select: { name: true } } },
      },
    },
  });
});

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

/** Categories that actually have an active offering of this type — keeps the
 * chip bar from listing a category that would render an empty catalog. */
export async function getCategoriesForOfferingType(offeringType: "PRODUCT" | "SERVICE") {
  return prisma.category.findMany({
    where: { products: { some: { isActive: true, offeringType } } },
    orderBy: { name: "asc" },
  });
}

/**
 * All categories, each tagged with the catalog it should link into —
 * /services if it holds any active service, /products otherwise. Powers the
 * homepage "Explore" grid, where one chip has to pick a single destination
 * regardless of which side of the products/services split it belongs to.
 */
export async function getCategoriesWithCatalogHref() {
  const [categories, serviceCategories] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.category.findMany({
      where: { products: { some: { isActive: true, offeringType: "SERVICE" } } },
      select: { id: true },
    }),
  ]);
  const serviceIds = new Set(serviceCategories.map((c) => c.id));
  return categories.map((category) => ({
    ...category,
    catalogHref: serviceIds.has(category.id) ? "/services" : "/products",
  }));
}

/** Same routing rule as getCategoriesWithCatalogHref, for a single deep link. */
export async function getCatalogHrefForCategorySlug(categorySlug: string) {
  const hasService = await prisma.product.findFirst({
    where: { isActive: true, offeringType: "SERVICE", category: { slug: categorySlug } },
    select: { id: true },
  });
  return hasService ? "/services" : "/products";
}
