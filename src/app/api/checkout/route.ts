import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { initOrderPayment } from "@/lib/payments";
import { storeConfig } from "@/config/store";

type CheckoutItem = { productId: string; variantId?: string; quantity: number };

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
    const { email, items, shippingAddress, fullName, phone, serviceDate, note } = body as {
      email: string;
      items: CheckoutItem[];
      shippingAddress?: ShippingAddress;
      fullName?: string;
      phone?: string;
      serviceDate?: string;
      note?: string;
    };

    if (!email || !items?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const products = await prisma.product.findMany({
      where: { id: { in: items.map((i) => i.productId) } },
      include: { variants: true },
    });

    // Resolve each line to its product (and variant when given), with the
    // effective unit price and available stock for that exact line.
    const resolved: {
      item: CheckoutItem;
      product: (typeof products)[number];
      variant: (typeof products)[number]["variants"][number] | null;
      unitPrice: number;
    }[] = [];

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        return NextResponse.json({ error: "One or more products not found" }, { status: 400 });
      }
      if (product.purchaseMode === "CONTACT_SELLER" || product.priceType === "QUOTE") {
        return NextResponse.json(
          { error: `${product.name} is arranged via direct contact with the seller` },
          { status: 400 }
        );
      }
      const variant = item.variantId
        ? product.variants.find((v) => v.id === item.variantId) || null
        : null;
      if (item.variantId && !variant) {
        return NextResponse.json(
          { error: `Selected option for ${product.name} is no longer available` },
          { status: 400 }
        );
      }
      // Services aren't stock-limited; only physical products check inventory.
      if (product.offeringType !== "SERVICE") {
        const available = variant ? variant.stock : product.stock;
        if (available < item.quantity) {
          return NextResponse.json(
            {
              error: `${product.name}${variant ? ` (${variant.name})` : ""} only has ${available} in stock`,
            },
            { status: 400 }
          );
        }
      }
      resolved.push({
        item,
        product,
        variant,
        unitPrice: Number(variant?.price ?? product.price),
      });
    }

    // Physical items must ship somewhere; service-only orders don't need an address.
    const hasPhysical = resolved.some((l) => l.product.offeringType !== "SERVICE");
    if (hasPhysical && !shippingAddress) {
      return NextResponse.json({ error: "Shipping address is required" }, { status: 400 });
    }

    const customerName = shippingAddress?.fullName || fullName;
    const customerPhone = shippingAddress?.phone || phone;
    if (!customerName || !customerPhone) {
      return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
    }

    // Logged-in customers use their real account; anyone else gets a guest
    // account found-or-created by email (which can later be "claimed" via signup).
    const session = await auth();
    const user = session?.user
      ? await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } })
      : await prisma.user.upsert({
          where: { email },
          update: { name: customerName, phone: customerPhone },
          create: {
            email,
            name: customerName,
            phone: customerPhone,
            isGuest: true,
          },
        });

    const address = shippingAddress
      ? await prisma.address.create({
          data: {
            userId: user.id,
            fullName: shippingAddress.fullName,
            phone: shippingAddress.phone,
            line1: shippingAddress.line1,
            line2: shippingAddress.line2,
            city: shippingAddress.city,
            state: shippingAddress.state,
          },
        })
      : null;

    const subtotal = resolved.reduce(
      (sum, line) => sum + line.unitPrice * line.item.quantity,
      0
    );

    const deliveryFee = hasPhysical ? storeConfig.deliveryFeeFlat : 0;
    const total = subtotal + deliveryFee;
    const orderNumber = `SS-${Date.now().toString(36).toUpperCase()}`;

    const parsedServiceDate = serviceDate ? new Date(serviceDate) : null;

    // Guests have no password, so a session can never get them back to this
    // order — an unguessable token (same pattern as invoices) is their key.
    const accessToken = session?.user ? null : crypto.randomBytes(24).toString("hex");

    const order = await prisma.order.create({
      data: {
        orderNumber,
        accessToken,
        userId: user.id,
        addressId: address?.id,
        serviceDate:
          parsedServiceDate && !isNaN(parsedServiceDate.getTime()) ? parsedServiceDate : null,
        customerNote: note?.trim() || null,
        subtotal,
        deliveryFee,
        total,
        items: {
          create: resolved.map(({ item, variant, unitPrice }) => ({
            productId: item.productId,
            variantId: variant?.id,
            variantName: variant?.name,
            quantity: item.quantity,
            unitPrice,
          })),
        },
        statusHistory: { create: { status: "PENDING", note: "Order placed" } },
      },
    });

    // Deposit-aware charge: lines whose product declares depositPercent are
    // charged that fraction now (balance collected later); the delivery fee
    // is always charged in full.
    const chargeNow =
      resolved.reduce((sum, line) => {
        const dp = line.product.depositPercent;
        const fraction = dp && dp >= 1 && dp <= 99 ? dp / 100 : 1;
        return sum + line.unitPrice * line.item.quantity * fraction;
      }, 0) + deliveryFee;
    const roundedCharge = Math.round(chargeNow * 100) / 100;
    const isDeposit = roundedCharge < total - 0.01;

    const { authorizationUrl } = await initOrderPayment({
      order: { ...order, user: { email } },
      amount: roundedCharge,
      kind: isDeposit ? "DEPOSIT" : "FULL",
      callbackUrl: `${req.nextUrl.origin}/orders/${order.id}${accessToken ? `?t=${accessToken}` : ""}`,
    });

    return NextResponse.json({
      orderId: order.id,
      authorizationUrl,
      orderUrl: `/orders/${order.id}${accessToken ? `?t=${accessToken}` : ""}`,
    });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
