import { redirect } from "next/navigation";

// Category browsing lives on the filtered catalog now; preserve deep links.
export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/products?category=${encodeURIComponent(slug)}`);
}
