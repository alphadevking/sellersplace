import type { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendOrderStatusPush } from "@/lib/push";

const STATUS_MESSAGES: Partial<Record<OrderStatus, string>> = {
  CONFIRMED: "Your order has been confirmed.",
  PROCESSING: "Your order is being prepared.",
  SHIPPED: "Your order is on its way!",
  DELIVERED: "Your order has been delivered. Enjoy!",
  CANCELLED: "Your order has been cancelled.",
};

/**
 * Inventory ledger: decrement stock when an order is first confirmed, restore
 * it when the order is cancelled. Variant-aware; services and custom invoice
 * lines are exempt. The order's `stockAdjusted` flag makes both directions
 * idempotent (a deposit followed by a balance payment decrements once).
 */
export async function adjustOrderStock(orderId: string, direction: "decrement" | "restore") {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true, variant: true } } },
  });
  if (!order) return;
  if (direction === "decrement" && order.stockAdjusted) return;
  if (direction === "restore" && !order.stockAdjusted) return;

  const sign = direction === "decrement" ? -1 : 1;
  const updates: Prisma.PrismaPromise<unknown>[] = [];
  for (const item of order.items) {
    if (!item.product || item.product.offeringType === "SERVICE") continue;
    if (item.variant) {
      updates.push(
        prisma.productVariant.update({
          where: { id: item.variant.id },
          // Clamp at 0 so a race between stock check and payment can't go negative.
          data: { stock: Math.max(0, item.variant.stock + sign * item.quantity) },
        })
      );
    } else {
      updates.push(
        prisma.product.update({
          where: { id: item.product.id },
          data: { stock: Math.max(0, item.product.stock + sign * item.quantity) },
        })
      );
    }
  }

  updates.push(
    prisma.order.update({
      where: { id: order.id },
      data: { stockAdjusted: direction === "decrement" },
    })
  );
  await prisma.$transaction(updates);
}

/** Statuses that mean the order is genuinely in fulfilment (stock committed). */
const STOCK_COMMITTING: OrderStatus[] = ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];

/**
 * Move an order to a new status: records the status-history event, keeps the
 * inventory ledger in sync, and pushes a notification to the customer. Used by
 * both the admin UI (server action) and the PATCH /api/orders/[id]/status route.
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  note?: string
) {
  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      status,
      statusHistory: { create: { status, note: note || undefined } },
    },
  });

  // Forward movement commits inventory once; cancellation returns it.
  if (STOCK_COMMITTING.includes(status)) {
    await adjustOrderStock(orderId, "decrement");
  } else if (status === "CANCELLED") {
    await adjustOrderStock(orderId, "restore");
  }

  const message = STATUS_MESSAGES[status];
  if (message) {
    await sendOrderStatusPush(order.userId, {
      title: `Order ${order.orderNumber}`,
      body: message,
      url: `/orders/${order.id}`,
    });
  }

  return order;
}
