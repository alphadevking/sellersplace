import type { Metadata } from "next";
import ProductDetail from "@/components/storefront/ProductDetail";
import { offeringMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return offeringMetadata(slug, "SERVICE");
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ProductDetail slug={slug} expectedType="SERVICE" />;
}
