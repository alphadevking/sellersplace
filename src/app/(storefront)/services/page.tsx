import CatalogView, { type CatalogSearchParams } from "@/components/storefront/CatalogView";
import { storeConfig } from "@/config/store";

const description = `Book trusted services at ${storeConfig.name} — request quotes, pay deposits online, and chat with the team directly.`;

export const metadata = {
  title: "All services",
  description,
  alternates: { canonical: "/services" },
  openGraph: {
    title: `All services | ${storeConfig.name}`,
    description,
    url: "/services",
  },
};

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  return <CatalogView offeringType="SERVICE" searchParams={searchParams} />;
}
