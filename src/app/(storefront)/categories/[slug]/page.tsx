import { redirect } from "next/navigation";
import { getCatalogHrefForCategorySlug } from "@/lib/products";

// Category browsing lives on the filtered catalog now; preserve deep links.
export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const catalogHref = await getCatalogHrefForCategorySlug(slug);
  redirect(`${catalogHref}?category=${encodeURIComponent(slug)}`);
}
