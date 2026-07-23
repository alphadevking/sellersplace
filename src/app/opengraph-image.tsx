import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { ogSized as sized } from "@/lib/og-image";
import { storeConfig } from "@/config/store";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${storeConfig.name} — ${storeConfig.description}`;

/**
 * Default Open Graph card for links without their own image (home, listings):
 * an editorial split — brand identity on the left, a live collage of the
 * store's most-reviewed products on the right, so shared links look like the
 * actual shop, not a colored rectangle. Degrades to a typographic card when
 * the catalog is empty or unreachable.
 */
export default async function OpengraphImage() {
  let photos: string[] = [];
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true, images: { isEmpty: false } },
      orderBy: [{ ratingCount: "desc" }, { createdAt: "desc" }],
      take: 3,
      select: { images: true },
    });
    photos = products.map((p) => p.images[0]).filter(Boolean);
  } catch {
    // Card must render even if the DB is unreachable — typographic fallback.
  }

  const hasPhotos = photos.length > 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#14140f",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        {/* Brand accent edge */}
        <div style={{ width: 14, height: "100%", background: storeConfig.primaryColor, display: "flex" }} />

        {/* Identity column */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "56px 48px 56px 56px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {storeConfig.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={storeConfig.logoUrl}
                alt=""
                width={88}
                height={88}
                style={{ width: 88, height: 88, borderRadius: 44, objectFit: "cover" }}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 88,
                  height: 88,
                  borderRadius: 44,
                  background: storeConfig.primaryColor,
                  fontSize: 48,
                  fontWeight: 700,
                }}
              >
                {storeConfig.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div
              style={{
                fontSize: hasPhotos ? 72 : 88,
                fontWeight: 700,
                letterSpacing: -2.5,
                lineHeight: 1.02,
              }}
            >
              {storeConfig.name}
            </div>
            <div style={{ fontSize: 30, opacity: 0.72, lineHeight: 1.35, maxWidth: 520 }}>
              {storeConfig.description}
            </div>
          </div>

          <div style={{ display: "flex" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
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

        {/* Live catalog collage */}
        {hasPhotos && (
          <div
            style={{
              display: "flex",
              gap: 14,
              padding: "24px 24px 24px 0",
              width: 470,
            }}
          >
            {/* eslint-disable @next/next/no-img-element */}
            <img
              src={sized(photos[0], 500, 640)}
              alt=""
              style={{
                width: photos.length > 1 ? 250 : 446,
                height: 582,
                borderRadius: 28,
                objectFit: "cover",
              }}
            />
            {photos.length > 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14, width: 182 }}>
                <img
                  src={sized(photos[1], 300, 320)}
                  alt=""
                  style={{ width: 182, height: 284, borderRadius: 28, objectFit: "cover" }}
                />
                {photos[2] ? (
                  <img
                    src={sized(photos[2], 300, 320)}
                    alt=""
                    style={{ width: 182, height: 284, borderRadius: 28, objectFit: "cover" }}
                  />
                ) : (
                  <div
                    style={{
                      display: "flex",
                      width: 182,
                      height: 284,
                      borderRadius: 28,
                      background: storeConfig.primaryColor,
                    }}
                  />
                )}
              </div>
            )}
            {/* eslint-enable @next/next/no-img-element */}
          </div>
        )}
      </div>
    ),
    size
  );
}
