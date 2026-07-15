import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { initializePaystackTransaction } from "@/lib/paystack";
import { storeConfig } from "@/config/store";

type CheckoutItem = { productId: string; quantity: number };

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, addressId, items, email } = body as {
      userId: string;
      addressId: string;
      items: CheckoutItem[];
      email: string;
    };

    if (!userId || !items?.length || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const products = await prisma.product.findMany({
      where: { id: { in: items.map((i) => i.productId) } },
    });

    const subtotal = items.reduce((sum: number, item) => {
      const product = products.find((p: (typeof products)[number]) => p.id === item.productId);
      if (!product) throw new Error(`Product ${item.productId} not found`);
      return sum + Number(product.price) * item.quantity;
    }, 0);

    const deliveryFee = storeConfig.deliveryFeeFlat;
    const total = subtotal + deliveryFee;
    const orderNumber = `SS-${Date.now().toString(36).toUpperCase()}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        addressId,
        subtotal,
        deliveryFee,
        total,
        items: {
          create: items.map((item) => {
            const product = products.find(
              (p: (typeof products)[number]) => p.id === item.productId
            )!;
            return {
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: product.price,
            };
          }),
        },
        statusHistory: { create: { status: "PENDING", note: "Order placed" } },
      },
    });

    // Paystack expects amount in kobo (smallest unit) for NGN
    const paystackRes = await initializePaystackTransaction({
      email,
      amountKobo: Math.round(total * 100),
      reference: orderNumber,
      callbackUrl: `${req.nextUrl.origin}/orders/${order.id}`,
      metadata: { orderId: order.id },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { paystackRef: orderNumber },
    });

    return NextResponse.json({
      orderId: order.id,
      authorizationUrl: paystackRes.data.authorization_url,
    });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
