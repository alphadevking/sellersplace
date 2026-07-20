import ProductDetail from "@/components/storefront/ProductDetail";

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ProductDetail slug={slug} expectedType="SERVICE" />;
}
