"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateOrderStatus } from "@/lib/orders";

/**
 * Customer-side delivery confirmation: the receiver, not the seller, closes
 * the loop. Only the order's owner can confirm, and only from SHIPPED —
 * admin keeps its override through the normal status controls.
 */
export async function confirmOrderReceived(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Sign in to confirm delivery");

  const orderId = formData.get("orderId") as string;
  if (!orderId) throw new Error("Missing order id");

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.userId !== session.user.id) throw new Error("Order not found");
  if (order.status !== "SHIPPED") {
    throw new Error("This order isn't marked as shipped yet");
  }

  await updateOrderStatus(orderId, "DELIVERED", "Confirmed received by customer");
  revalidatePath(`/orders/${orderId}`);
}
