import { ImageResponse } from "next/og";
import { storeConfig } from "@/config/store";

/**
 * Default Open Graph card for pages without their own image (home, listings,
 * legal). Served as a normal Route Handler — NOT the `opengraph-image` file
 * convention — because that convention force-overrides every page's own
 * `openGraph.images`, which would suppress the per-product share images.
 *
 * Deliberately logo-forward and dependency-light: at most one remote fetch
 * (the store logo, its own CDN asset), so it renders fast enough to survive a
 * social crawler's short timeout on the first, uncached scrape. Long CDN
 * caching keeps every scrape after that instant.
 */
export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#14140f",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        {/* Brand accent edge */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 16,
            background: storeConfig.primaryColor,
            display: "flex",
          }}
        />

        {storeConfig.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={storeConfig.logoUrl}
            alt=""
            width={132}
            height={132}
            style={{ width: 132, height: 132, borderRadius: 66, objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 132,
              height: 132,
              borderRadius: 66,
              background: storeConfig.primaryColor,
              fontSize: 68,
              fontWeight: 700,
            }}
          >
            {storeConfig.name.charAt(0).toUpperCase()}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 88, fontWeight: 700, letterSpacing: -3, lineHeight: 1 }}>
            {storeConfig.name}
          </div>
          <div style={{ fontSize: 34, opacity: 0.72, lineHeight: 1.3, maxWidth: 760 }}>
            {storeConfig.description}
          </div>
          <div style={{ display: "flex", marginTop: 8 }}>
            <div
              style={{
                display: "flex",
                background: storeConfig.primaryColor,
                borderRadius: 999,
                padding: "12px 28px",
                fontSize: 24,
                fontWeight: 600,
              }}
            >
              {storeConfig.siteUrl.replace(/^https?:\/\//, "")}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        // First scrape renders once; the CDN serves every scrape after from cache.
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    }
  );
}
