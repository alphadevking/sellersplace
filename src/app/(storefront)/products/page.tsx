import CatalogView, { type CatalogSearchParams } from "@/components/storefront/CatalogView";
import { terms } from "@/config/store";

export const metadata = { title: terms.allCatalog };

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  return <CatalogView offeringType="PRODUCT" searchParams={searchParams} />;
}
