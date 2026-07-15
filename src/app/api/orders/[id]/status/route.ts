import { NextRequest, NextResponse } from "next/server";
import { OrderStatus } from "@prisma/client";
import { getAdminSession } from "@/lib/admin";
import { updateOrderStatus } from "@/lib/orders";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { status, note } = await req.json();

  if (!status || !Object.values(OrderStatus).includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const order = await updateOrderStatus(id, status, note);
  return NextResponse.json({ order });
}
