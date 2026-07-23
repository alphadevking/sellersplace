import { ImageResponse } from "next/og";
import { storeConfig } from "@/config/store";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/**
 * Generated favicon — brand color + store initial, so every deployment gets
 * on-brand iconography from env config alone (no design assets required).
 */
export default function Icon() {
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
