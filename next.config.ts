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
};

export default nextConfig;
