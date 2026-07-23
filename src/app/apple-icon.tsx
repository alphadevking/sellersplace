import { ImageResponse } from "next/og";
import { storeConfig } from "@/config/store";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Apple touch icon — same generated brand mark at home-screen size. */
export default function AppleIcon() {
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
