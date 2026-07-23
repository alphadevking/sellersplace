import { ImageResponse } from "next/og";
import { storeConfig } from "@/config/store";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Apple touch icon — the configured logo, or the generated brand mark. */
export default function AppleIcon() {
  if (storeConfig.logoUrl) {
    return new ImageResponse(
      (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={storeConfig.logoUrl}
          alt=""
          width={180}
          height={180}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
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
          fontSize: 104,
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
