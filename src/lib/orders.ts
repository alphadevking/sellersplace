import type { OrderStatus } from "@prisma/client";
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
 * Move an order to a new status: records the status-history event and pushes
 * a notification to the customer. Used by both the admin UI (server action)
 * and the PATCH /api/orders/[id]/status route.
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
