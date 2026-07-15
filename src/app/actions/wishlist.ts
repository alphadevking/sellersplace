"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Toggle a product in the signed-in user's wishlist.
 * `currentPath` is where the user clicked the heart — used both as the
 * login callback for guests and for cache revalidation.
 */
export async function toggleWishlist(productId: string, currentPath: string) {
  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(currentPath)}`);
  }
  const userId = session.user.id;

  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId, productId } },
  });

  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
  } else {
    await prisma.wishlistItem.create({ data: { userId, productId } });
  }

  revalidatePath("/wishlist");
  revalidatePath(currentPath);

  return { wishlisted: !existing };
}
