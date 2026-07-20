import CatalogView, { type CatalogSearchParams } from "@/components/storefront/CatalogView";

export const metadata = { title: "All services" };

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  return <CatalogView offeringType="SERVICE" searchParams={searchParams} />;
}
