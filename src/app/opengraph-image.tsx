import { ImageResponse } from "next/og";
import { storeConfig } from "@/config/store";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${storeConfig.name} — ${storeConfig.description}`;

/**
 * Default Open Graph card for links to any page without its own OG image —
 * brand-colored, generated at request time from env config.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: 80,
          background: storeConfig.primaryColor,
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 96,
            height: 96,
            borderRadius: 48,
            background: "rgba(255,255,255,0.18)",
            fontSize: 56,
            fontWeight: 700,
            marginBottom: 40,
          }}
        >
          {storeConfig.name.charAt(0).toUpperCase()}
        </div>
        <div style={{ fontSize: 84, fontWeight: 700, letterSpacing: -2 }}>
          {storeConfig.name}
        </div>
        <div style={{ fontSize: 36, opacity: 0.85, marginTop: 16 }}>
          {storeConfig.description}
        </div>
      </div>
    ),
    size
  );
}
