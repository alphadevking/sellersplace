import type { MetadataRoute } from "next";
import { storeConfig } from "@/config/store";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: storeConfig.name,
    short_name: storeConfig.shortName,
    description: storeConfig.description,
    start_url: "/",
    display: "standalone",
    background_color: storeConfig.backgroundColor,
    theme_color: storeConfig.primaryColor,
    orientation: "any",
    // Generated from env config (logo or letter mark) — see app/pwa-icon.
    icons: [
      {
        src: "/pwa-icon/192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-icon/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-icon/maskable",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
