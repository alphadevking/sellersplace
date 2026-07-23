import { developer, storeConfig } from "@/config/store";

/** The humans.txt convention — developer credit for those who view source. */
export function GET() {
  const body = [
    "/* TEAM */",
    `Developer: ${developer.name}`,
    `Contact: ${developer.email}`,
    `Mission: ${developer.tagline}`,
    "",
    "/* SITE */",
    `Name: ${storeConfig.name}`,
    `URL: ${storeConfig.siteUrl}`,
    "Stack: Next.js, Prisma, Tailwind CSS, Paystack",
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
