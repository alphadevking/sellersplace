import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { balanceDue, initOrderPayment } from "@/lib/payments";

/**
 * Starts a Paystack payment for a tokenized invoice. Auth is the unguessable
 * token itself — invoice customers usually have no account.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const order = await prisma.order.findUnique({
      where: { accessToken: token },
      include: { user: true },
    });
    if (!order) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const balance = balanceDue(order);
    if (balance <= 0) {
      return NextResponse.json({ error: "This invoice is fully paid" }, { status: 400 });
    }

    const { authorizationUrl } = await initOrderPayment({
      order,
      amount: balance,
      kind: "INVOICE",
      callbackUrl: `${req.nextUrl.origin}/invoice/${token}`,
    });

    return NextResponse.json({ authorizationUrl });
  } catch (err) {
    console.error("Invoice pay error:", err);
    return NextResponse.json({ error: "Could not start payment" }, { status: 500 });
  }
}
