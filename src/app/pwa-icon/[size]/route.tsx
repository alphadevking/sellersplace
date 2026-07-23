import { ImageResponse } from "next/og";
import { storeConfig } from "@/config/store";

/**
 * PWA icons generated from env config (the manifest + push notifications
 * reference these): the configured logo when NEXT_PUBLIC_STORE_LOGO is set,
 * otherwise a brand-color letter mark. The maskable variant keeps the mark
 * inside the safe zone on a solid brand field so launcher shapes (circle,
 * squircle) never clip it.
 */

const VARIANTS: Record<string, { px: number; maskable: boolean }> = {
  "192": { px: 192, maskable: false },
  "512": { px: 512, maskable: false },
  maskable: { px: 512, maskable: true },
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size } = await params;
  const variant = VARIANTS[size];
  if (!variant) return new Response("Not found", { status: 404 });

  const { px, maskable } = variant;
  // Maskable icons must keep content inside the central ~80% safe zone.
  const inner = maskable ? Math.round(px * 0.62) : px;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: storeConfig.primaryColor,
        }}
      >
        {storeConfig.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={storeConfig.logoUrl}
            alt=""
            width={inner}
            height={inner}
            style={{
              width: inner,
              height: inner,
              objectFit: "cover",
              borderRadius: maskable ? inner / 2 : 0,
            }}
          />
        ) : (
          <div
            style={{
              display: "flex",
              color: "#ffffff",
              fontSize: Math.round(inner * 0.58),
              fontWeight: 700,
              fontFamily: "sans-serif",
            }}
          >
            {storeConfig.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    ),
    {
      width: px,
      height: px,
      headers: {
        "Content-Type": "image/png",
        // Long cache in production; none in dev so icon iterations show
        // immediately instead of pinning a stale (or failed) first render.
        "Cache-Control":
          process.env.NODE_ENV === "production"
            ? "public, max-age=86400, stale-while-revalidate=604800"
            : "no-store",
      },
    }
  );
}
