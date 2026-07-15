import { NextRequest, NextResponse } from "next/server";
import { getProductsByIds } from "@/lib/products";

export async function GET(req: NextRequest) {
  const idsParam = req.nextUrl.searchParams.get("ids") || "";
  const ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean);

  const products = await getProductsByIds(ids);
  return NextResponse.json({ products });
}
