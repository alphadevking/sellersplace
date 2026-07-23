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
    const token = req.nextUrl.searchParams.get("t");

    const order = await prisma.order.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Owner session, or the guest-checkout access token from the order URL.
    const session = await auth();
    const isOwner = !!session?.user && order.userId === session.user.id;
    const hasToken = !!token && !!order.accessToken && order.accessToken === token;
    if (!isOwner && !hasToken) {
      return NextResponse.json(
        { error: session?.user ? "Order not found" : "Sign in to pay" },
        { status: session?.user ? 404 : 401 }
      );
    }

    const balance = balanceDue(order);
    if (balance <= 0) {
      return NextResponse.json({ error: "This order is fully paid" }, { status: 400 });
    }

    const { authorizationUrl } = await initOrderPayment({
      order,
      amount: balance,
      kind: order.isInvoice ? "INVOICE" : "BALANCE",
      callbackUrl: `${req.nextUrl.origin}/orders/${order.id}${hasToken ? `?t=${token}` : ""}`,
    });

    return NextResponse.json({ authorizationUrl });
  } catch (err) {
    console.error("Pay-balance error:", err);
    return NextResponse.json({ error: "Could not start payment" }, { status: 500 });
  }
}
