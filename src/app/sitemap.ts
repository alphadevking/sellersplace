import type { MetadataRoute } from "next";
import { storeConfig } from "@/config/store";
import { getAllProducts, getAllCategories } from "@/lib/products";
import { productHref } from "@/lib/product-url";

/**
 * Dynamic sitemap: static storefront routes + every active offering (with its
 * images, so Google Images indexes the catalog) + category-filtered listings.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = storeConfig.siteUrl;
  const [products, categories] = await Promise.all([getAllProducts(), getAllCategories()]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/products`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/services`, changeFrequency: "daily", priority: 0.8 },
  ];

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${base}${productHref(p)}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
    images: (p.images ?? []).slice(0, 5),
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${base}/products?category=${c.slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...productRoutes, ...categoryRoutes];
}
