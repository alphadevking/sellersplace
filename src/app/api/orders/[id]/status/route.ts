import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOrderStatusPush } from "@/lib/push";

const STATUS_MESSAGES: Record<string, string> = {
  CONFIRMED: "Your order has been confirmed.",
  PROCESSING: "Your order is being prepared.",
  SHIPPED: "Your order is on its way!",
  DELIVERED: "Your order has been delivered. Enjoy!",
  CANCELLED: "Your order has been cancelled.",
};

// TODO: wrap this route with admin-only auth middleware before going to production.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { status, note } = await req.json();

  if (!status) {
    return NextResponse.json({ error: "Missing status" }, { status: 400 });
  }

  const order = await prisma.order.update({
    where: { id },
    data: {
      status,
      statusHistory: { create: { status, note } },
    },
  });

  const message = STATUS_MESSAGES[status];
  if (message) {
    await sendOrderStatusPush(order.userId, {
      title: `Order ${order.orderNumber}`,
      body: message,
      url: `/orders/${order.id}`,
    });
  }

  return NextResponse.json({ order });
}
