import type { SqlDriverAdapterFactory } from "@prisma/client/runtime/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

/**
 * Pick the right Prisma driver adapter for DATABASE_URL.
 *
 * Neon databases get the Neon serverless driver, which tunnels Postgres over
 * a WebSocket on port 443 instead of raw TCP on 5432. Plenty of home/office
 * networks (and some Windows firewall setups) silently block outbound 5432,
 * which surfaces as Prisma P1001 "Can't reach database server" — 443 is
 * practically always open. It also plays nicer with Neon's scale-to-zero
 * cold starts. Any other Postgres (localhost, RDS, ...) keeps using
 * node-postgres directly.
 */
export function createDbAdapter(connectionString: string): SqlDriverAdapterFactory {
  let hostname = "";
  try {
    hostname = new URL(connectionString).hostname;
  } catch {
    // Fall through to the default adapter; it will produce a clearer error.
  }

  if (hostname.endsWith(".neon.tech")) {
    // Node < 22 has no global WebSocket; supplying ws works on every version.
    neonConfig.webSocketConstructor = ws;
    return new PrismaNeon({ connectionString });
  }

  return new PrismaPg({ connectionString });
}
