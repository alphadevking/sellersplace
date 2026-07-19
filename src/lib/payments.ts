import crypto from "crypto";
import type { Order, PaymentKind, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { initializePaystackTransaction } from "@/lib/paystack";
import { adjustOrderStock } from "@/lib/orders";

/** Naira balance still owed on an order. */
export function balanceDue(order: Pick<Order, "total" | "amountPaid">): number {
  return Math.max(0, Number(order.total) - Number(order.amountPaid));
}

/**
 * Creates a Payment row and initializes a Paystack transaction for it.
 * All money flows (full checkout, deposits, balance payments, invoices) go
 * through here so the webhook can resolve any charge by its unique reference.
 */
export async function initOrderPayment(params: {
  order: Order & { user: Pick<User, "email"> };
  amount: number; // naira
  kind: PaymentKind;
  callbackUrl: string;
}) {
  const { order, amount, kind, callbackUrl } = params;
  if (amount <= 0) throw new Error("Payment amount must be positive");

  // Unique per attempt — retries after abandoned Paystack sessions get a fresh reference.
  const reference = `${order.orderNumber}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

  await prisma.payment.create({
    data: { orderId: order.id, reference, amount, kind },
  });

  const res = await initializePaystackTransaction({
    email: order.user.email,
    amountKobo: Math.round(amount * 100),
    reference,
    callbackUrl,
    metadata: { orderId: order.id, kind },
  });

  return { authorizationUrl: res.data.authorization_url, reference };
}

/**
 * Marks a Paystack charge as successful and rolls it up into the order.
 * Idempotent: replayed webhook events for an already-successful payment no-op.
 * Returns the updated order, or null when the reference is unknown/already applied.
 */
export async function applySuccessfulCharge(reference: string) {
  const payment = await prisma.payment.findUnique({
    where: { reference },
    include: { order: true },
  });
  if (!payment || payment.status === "SUCCESS") return null;

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: "SUCCESS" },
  });

  const amountPaid = Number(payment.order.amountPaid) + Number(payment.amount);
  const fullyPaid = amountPaid >= Number(payment.order.total) - 0.01;

  // Money has landed — commit inventory (idempotent via the stockAdjusted flag).
  await adjustOrderStock(payment.orderId, "decrement");

  return prisma.order.update({
    where: { id: payment.orderId },
    data: {
      amountPaid,
      paymentStatus: fullyPaid ? "PAID" : "PARTIALLY_PAID",
      // First successful charge confirms the order; later ones keep its status.
      ...(payment.order.status === "PENDING"
        ? {
            status: "CONFIRMED" as const,
            statusHistory: {
              create: {
                status: "CONFIRMED" as const,
                note: fullyPaid ? "Payment confirmed" : "Deposit received",
              },
            },
          }
        : {}),
    },
  });
}
