import { NextRequest, NextResponse } from "next/server";
import { getProductsByIds, searchProducts } from "@/lib/products";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (q) {
    const { products, total } = await searchProducts(q);
    return NextResponse.json({ products, total });
  }

  const idsParam = req.nextUrl.searchParams.get("ids") || "";
  const ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean);

  const products = await getProductsByIds(ids);
  return NextResponse.json({ products });
}
