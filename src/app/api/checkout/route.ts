import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { initializePaystackTransaction } from "@/lib/paystack";
import { storeConfig } from "@/config/store";

type CheckoutItem = { productId: string; quantity: number };

type ShippingAddress = {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, items, shippingAddress } = body as {
      email: string;
      items: CheckoutItem[];
      shippingAddress: ShippingAddress;
    };

    if (!email || !items?.length || !shippingAddress) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const products = await prisma.product.findMany({
      where: { id: { in: items.map((i) => i.productId) } },
    });

    if (products.length !== items.length) {
      return NextResponse.json({ error: "One or more products not found" }, { status: 400 });
    }

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId)!;
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `${product.name} only has ${product.stock} in stock` },
          { status: 400 }
        );
      }
    }

    // Guest checkout: find or create a user by email. No password is set —
    // this account can be "claimed" later once real auth/signup exists.
    const user = await prisma.user.upsert({
      where: { email },
      update: { name: shippingAddress.fullName, phone: shippingAddress.phone },
      create: {
        email,
        name: shippingAddress.fullName,
        phone: shippingAddress.phone,
        isGuest: true,
      },
    });

    const address = await prisma.address.create({
      data: {
        userId: user.id,
        fullName: shippingAddress.fullName,
        phone: shippingAddress.phone,
        line1: shippingAddress.line1,
        line2: shippingAddress.line2,
        city: shippingAddress.city,
        state: shippingAddress.state,
      },
    });

    const subtotal = items.reduce((sum, item) => {
      const product = products.find(
        (p: (typeof products)[number]) => p.id === item.productId
      )!;
      return sum + Number(product.price) * item.quantity;
    }, 0);

    const deliveryFee = storeConfig.deliveryFeeFlat;
    const total = subtotal + deliveryFee;
    const orderNumber = `SS-${Date.now().toString(36).toUpperCase()}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: user.id,
        addressId: address.id,
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
