"use server";

import { revalidatePath } from "next/cache";
import type { Order } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateOrderStatus } from "@/lib/orders";
import { sendPushToAdmins } from "@/lib/push";

/**
 * Resolves an order the caller is allowed to act on: either the signed-in
 * owner, or the bearer of the order's access token (guest checkouts have no
 * password, so the token from their payment-return URL is their key).
 */
async function getActionableOrder(orderId: string, token?: string): Promise<Order> {
  if (!orderId) throw new Error("Missing order id");
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found");

  const session = await auth();
  const isOwner = !!session?.user && order.userId === session.user.id;
  const hasToken = !!token && !!order.accessToken && order.accessToken === token;
  if (!isOwner && !hasToken) throw new Error("Order not found");

  return order;
}

/**
 * Customer-side delivery confirmation: the receiver, not the seller, closes
 * the loop. Only from SHIPPED — admin keeps its override through the normal
 * status controls.
 */
export async function confirmOrderReceived(formData: FormData) {
  const order = await getActionableOrder(
    formData.get("orderId") as string,
    (formData.get("token") as string) || undefined
  );
  if (order.status !== "SHIPPED") {
    throw new Error("This order isn't marked as shipped yet");
  }

  await updateOrderStatus(order.id, "DELIVERED", "Confirmed received by customer");
  revalidatePath(`/orders/${order.id}`);
}

/**
 * Customer-side cancellation, allowed only before dispatch (PENDING/CONFIRMED).
 * Stock restore and the customer push ride on updateOrderStatus; when money
 * has already landed, admins get pinged that a refund is owed.
 */
export async function cancelOrder(formData: FormData) {
  const order = await getActionableOrder(
    formData.get("orderId") as string,
    (formData.get("token") as string) || undefined
  );
  if (order.status !== "PENDING" && order.status !== "CONFIRMED") {
    throw new Error("This order can no longer be cancelled — contact support instead");
  }

  await updateOrderStatus(order.id, "CANCELLED", "Cancelled by customer");

  if (Number(order.amountPaid) > 0) {
    await sendPushToAdmins({
      title: `Refund needed — ${order.orderNumber}`,
      body: `Customer cancelled after paying ₦${Number(order.amountPaid).toLocaleString()}.`,
      url: `/admin/orders/${order.id}`,
    });
  }

  revalidatePath(`/orders/${order.id}`);
  revalidatePath("/account");
}
