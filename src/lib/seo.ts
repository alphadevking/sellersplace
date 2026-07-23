import type { Metadata } from "next";
import { storeConfig } from "@/config/store";
import { getProductBySlug } from "@/lib/products";
import { productHref } from "@/lib/product-url";

/**
 * Shared generateMetadata body for /products/[slug] and /services/[slug]:
 * canonical URL, search-friendly title/description, and OG/Twitter cards
 * using the offering's own images.
 */
export async function offeringMetadata(
  slug: string,
  expectedType: "PRODUCT" | "SERVICE"
): Promise<Metadata> {
  const product = await getProductBySlug(slug);
  if (!product || !product.isActive || product.offeringType !== expectedType) {
    return { title: "Not found", robots: { index: false } };
  }

  const path = productHref(product);
  const description =
    product.description?.slice(0, 160) ||
    `${product.name}${product.brand ? ` by ${product.brand}` : ""} — available at ${storeConfig.name}.`;
  const images = (product.images ?? []).slice(0, 4);

  return {
    title: product.name,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      title: product.name,
      description,
      url: path,
      siteName: storeConfig.name,
      ...(images.length ? { images } : {}),
    },
    twitter: {
      card: images.length ? "summary_large_image" : "summary",
      title: product.name,
      description,
      ...(images.length ? { images: [images[0]] } : {}),
    },
  };
}
