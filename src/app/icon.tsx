import { ImageResponse } from "next/og";
import { storeConfig } from "@/config/store";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/**
 * Favicon: the configured logo when NEXT_PUBLIC_STORE_LOGO is set, otherwise a
 * generated brand-color + initial mark — on-brand iconography from env config
 * alone, no design assets required.
 */
export default function Icon() {
  if (storeConfig.logoUrl) {
    return new ImageResponse(
      (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={storeConfig.logoUrl}
          alt=""
          width={64}
          height={64}
          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 14 }}
        />
      ),
      size
    );
  }
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
          color: "#ffffff",
          borderRadius: 14,
          fontSize: 38,
          fontWeight: 700,
          fontFamily: "sans-serif",
        }}
      >
        {storeConfig.name.charAt(0).toUpperCase()}
      </div>
    ),
    size
  );
}
