import type { MetadataRoute } from "next";
import { storeConfig } from "@/config/store";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private, transactional, or personalized surfaces — crawling them
        // wastes budget and risks indexing user-specific content.
        disallow: [
          "/admin",
          "/api/",
          "/account",
          "/cart",
          "/checkout",
          "/orders/",
          "/wishlist",
          "/support",
          "/invoice/",
          "/login",
          "/signup",
        ],
      },
    ],
    sitemap: `${storeConfig.siteUrl}/sitemap.xml`,
  };
}
