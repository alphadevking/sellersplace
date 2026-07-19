import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidPaystackSignature } from "@/lib/paystack";
import { applySuccessfulCharge, balanceDue } from "@/lib/payments";
import { adjustOrderStock } from "@/lib/orders";
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

    // Normal path: charges created through initOrderPayment (Payment rows).
    const order = await applySuccessfulCharge(reference);
    if (order) {
      const balance = balanceDue(order);
      await sendOrderStatusPush(order.userId, {
        title: order.paymentStatus === "PAID" ? "Payment confirmed" : "Deposit received",
        body:
          order.paymentStatus === "PAID"
            ? `Your order ${order.orderNumber} has been confirmed and is being processed.`
            : `Deposit received for ${order.orderNumber} — balance of ₦${balance.toLocaleString()} remains.`,
        url: `/orders/${order.id}`,
      });
      return NextResponse.json({ received: true });
    }

    // Legacy path: orders created before Payment rows existed.
    const legacy = await prisma.order.findUnique({ where: { paystackRef: reference } });
    if (legacy && legacy.paymentStatus !== "PAID") {
      await prisma.order.update({
        where: { id: legacy.id },
        data: {
          paymentStatus: "PAID",
          amountPaid: legacy.total,
          status: "CONFIRMED",
          statusHistory: { create: { status: "CONFIRMED", note: "Payment confirmed" } },
        },
      });
      await adjustOrderStock(legacy.id, "decrement");
      await sendOrderStatusPush(legacy.userId, {
        title: "Payment confirmed",
        body: `Your order ${legacy.orderNumber} has been confirmed and is being processed.`,
        url: `/orders/${legacy.id}`,
      });
    }
  }

  return NextResponse.json({ received: true });
}
