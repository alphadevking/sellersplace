import { prisma } from "@/lib/prisma";

/** Product ids the user has wishlisted — used to pre-fill heart states on product grids. */
export async function getWishlistProductIds(userId: string | undefined) {
  if (!userId) return new Set<string>();
  const items = await prisma.wishlistItem.findMany({
    where: { userId },
    select: { productId: true },
  });
  return new Set(items.map((i) => i.productId));
}

export async function getWishlistItems(userId: string) {
  return prisma.wishlistItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { product: { include: { category: true } } },
  });
}
