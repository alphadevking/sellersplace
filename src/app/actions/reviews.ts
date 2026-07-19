"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPurchasedProduct } from "@/lib/reviews";

export type ReviewFormState = { ok: boolean; error?: string };

/**
 * Verified-buyer reviews: only customers with a paid/delivered order containing
 * the product can review it (one review each; resubmitting updates it).
 * The product's cached rating aggregates refresh on every save.
 */
export async function submitReview(
  _prev: ReviewFormState,
  formData: FormData
): Promise<ReviewFormState> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Sign in to leave a review." };

  const productId = (formData.get("productId") as string) || "";
  const productSlug = (formData.get("productSlug") as string) || "";
  const rating = Math.trunc(Number(formData.get("rating")));
  const body = (formData.get("body") as string)?.trim() || null;

  if (!productId || rating < 1 || rating > 5) {
    return { ok: false, error: "Pick a star rating between 1 and 5." };
  }
  if (body && body.length > 2000) {
    return { ok: false, error: "Review is too long." };
  }

  const purchased = await hasPurchasedProduct(session.user.id, productId);
  if (!purchased) {
    return { ok: false, error: "Only verified buyers can review this item." };
  }

  await prisma.review.upsert({
    where: { productId_userId: { productId, userId: session.user.id } },
    update: { rating, body },
    create: { productId, userId: session.user.id, rating, body },
  });

  // Refresh the cached aggregates used by product cards and the PDP header.
  const agg = await prisma.review.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: true,
  });
  await prisma.product.update({
    where: { id: productId },
    data: {
      ratingAvg: agg._avg.rating ?? null,
      ratingCount: agg._count,
    },
  });

  if (productSlug) revalidatePath(`/products/${productSlug}`);
  return { ok: true };
}
