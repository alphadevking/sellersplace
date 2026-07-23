import CatalogView, { type CatalogSearchParams } from "@/components/storefront/CatalogView";
import { storeConfig, terms } from "@/config/store";

const description = `${terms.browse} at ${storeConfig.name} — pay online or on delivery, fast delivery across Nigeria.`;

export const metadata = {
  title: terms.allCatalog,
  description,
  alternates: { canonical: "/products" },
  openGraph: {
    title: `${terms.allCatalog} | ${storeConfig.name}`,
    description,
    url: "/products",
  },
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  return <CatalogView offeringType="PRODUCT" searchParams={searchParams} />;
}
