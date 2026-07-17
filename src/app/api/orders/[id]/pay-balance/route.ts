import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { balanceDue, initOrderPayment } from "@/lib/payments";

/** Initializes a Paystack transaction for whatever is still owed on an order. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Sign in to pay" }, { status: 401 });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!order || order.userId !== session.user.id) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const balance = balanceDue(order);
    if (balance <= 0) {
      return NextResponse.json({ error: "This order is fully paid" }, { status: 400 });
    }

    const { authorizationUrl } = await initOrderPayment({
      order,
      amount: balance,
      kind: order.isInvoice ? "INVOICE" : "BALANCE",
      callbackUrl: `${req.nextUrl.origin}/orders/${order.id}`,
    });

    return NextResponse.json({ authorizationUrl });
  } catch (err) {
    console.error("Pay-balance error:", err);
    return NextResponse.json({ error: "Could not start payment" }, { status: 500 });
  }
}
