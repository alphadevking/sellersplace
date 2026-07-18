import { NextRequest, NextResponse } from "next/server";
import { getProductsByIds } from "@/lib/products";
import { getTrendingSearches, searchWithFallback } from "@/lib/recommendations";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (q) {
    const { products, total, fallback } = await searchWithFallback(q);
    return NextResponse.json({ products, total, fallback });
  }

  if (req.nextUrl.searchParams.has("trending")) {
    const trending = await getTrendingSearches();
    return NextResponse.json({ trending });
  }

  const idsParam = req.nextUrl.searchParams.get("ids") || "";
  const ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean);

  const products = await getProductsByIds(ids);
  return NextResponse.json({ products });
}
