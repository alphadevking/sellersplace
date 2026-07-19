import { prisma } from "@/lib/prisma";

/**
 * Verified-buyer check: the user has an order containing this product that is
 * paid, deposit-paid, or delivered. Single source of truth — used by the PDP
 * (to decide whether to show the review form) and by the submitReview action
 * (to enforce it server-side regardless of what the UI showed).
 */
export async function hasPurchasedProduct(userId: string, productId: string) {
  const item = await prisma.orderItem.findFirst({
    where: {
      productId,
      order: {
        userId,
        OR: [
          { paymentStatus: { in: ["PAID", "PARTIALLY_PAID"] } },
          { status: "DELIVERED" },
        ],
      },
    },
    select: { id: true },
  });
  return Boolean(item);
}

/** The user's existing review of this product, if any (one per buyer). */
export async function getUserReview(userId: string, productId: string) {
  return prisma.review.findUnique({
    where: { productId_userId: { productId, userId } },
    select: { rating: true, body: true },
  });
}
