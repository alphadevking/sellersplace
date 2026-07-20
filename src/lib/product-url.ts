/** Products live at /products/:slug, services at /services/:slug — same table, split routes. */
export function productHref(product: { slug: string; offeringType?: "PRODUCT" | "SERVICE" }) {
  return product.offeringType === "SERVICE" ? `/services/${product.slug}` : `/products/${product.slug}`;
}
