import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidPaystackSignature } from "@/lib/paystack";
import { sendOrderStatusPush } from "@/lib/push";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  if (!isValidPaystackSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

  if (event.event === "charge.success") {
    const reference: string = event.data.reference;

    const order = await prisma.order.findUnique({ where: { paystackRef: reference } });
    if (!order) return NextResponse.json({ received: true });

    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "PAID",
        status: "CONFIRMED",
        statusHistory: { create: { status: "CONFIRMED", note: "Payment confirmed" } },
      },
    });

    await sendOrderStatusPush(order.userId, {
      title: "Payment confirmed",
      body: `Your order ${order.orderNumber} has been confirmed and is being processed.`,
      url: `/orders/${order.id}`,
    });
  }

  return NextResponse.json({ received: true });
}
