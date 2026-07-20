import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for Prisma 7's driver-adapter architecture (@prisma/adapter-pg + pg,
  // @prisma/adapter-neon + ws for Neon databases) to resolve correctly under
  // Turbopack in server components/route handlers.
  serverExternalPackages: ["@prisma/client", "pg", "@neondatabase/serverless", "ws"],

  // Codespaces/other proxied dev environments serve the app through a different
  // host than localhost, which Next.js blocks by default for HMR safety.
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
    "*.app.github.dev", // GitHub Codespaces forwarded domain
  ],

  // Only our two known image sources (Cloudinary uploads, Unsplash seed data)
  // go through next/image's optimizer/resizer. Admins can also paste an
  // arbitrary image URL (ImagesField) — those intentionally stay unoptimized
  // <img> tags (see SmartImage) rather than allow-listing "**", which the
  // Next docs flag as a hostname-spoofing risk for the image optimizer.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
};

export default nextConfig;
