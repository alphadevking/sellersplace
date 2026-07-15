import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for Prisma 7's driver-adapter architecture (@prisma/adapter-pg + pg)
  // to resolve correctly under Turbopack in server components/route handlers.
  serverExternalPackages: ["@prisma/client", "pg"],
};

export default nextConfig;
