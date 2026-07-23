import type { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Reason a self-serve deletion is currently withheld (obligation outstanding). */
export type DeletionBlocker = { code: string; message: string };

/** Orders that are still in flight — an active contract on both sides. */
const ACTIVE_STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED"];

/**
 * Whether the customer has obligations that must clear before self-deletion —
 * so erasure can't be used to dodge a pending order, unpaid balance, or audit.
 * NDPR/GDPR both allow deferring erasure for contract performance and legal
 * claims; this is that carve-out. Empty array = clear to delete.
 */
export async function getDeletionBlockers(userId: string): Promise<DeletionBlocker[]> {
  const orders = await prisma.order.findMany({
    where: { userId },
    select: { status: true, total: true, amountPaid: true },
  });
  const blockers: DeletionBlocker[] = [];

  const active = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  if (active.length > 0) {
    blockers.push({
      code: "active_orders",
      message: `You have ${active.length} order${active.length > 1 ? "s" : ""} still in progress. You can delete your account once they're delivered or cancelled.`,
    });
  }

  const owed = orders
    .filter((o) => o.status !== "CANCELLED")
    .reduce((sum, o) => sum + Math.max(0, Number(o.total) - Number(o.amountPaid)), 0);
  if (owed > 0.01) {
    blockers.push({
      code: "balance_due",
      message: "You have an outstanding balance. Please settle it before deleting your account.",
    });
  }

  return blockers;
}

/**
 * NDPR-aligned account erasure. Personal data is always removed; order history
 * is financial/accounting data that must be retained, so a customer WITH orders
 * is anonymized (PII scrubbed, orders kept and detached) rather than deleted,
 * while a customer with NO orders is hard-deleted outright.
 *
 * Unless `force` is set (admin controller override), deletion is refused while
 * obligations are outstanding (see getDeletionBlockers) — this is enforced here
 * as well as in the UI so it can't be bypassed by posting the form directly.
 *
 * Returns which path ran so callers can message accordingly.
 */
export async function deleteUserAccount(
  userId: string,
  { force = false }: { force?: boolean } = {}
): Promise<"deleted" | "anonymized"> {
  if (!force) {
    const blockers = await getDeletionBlockers(userId);
    if (blockers.length > 0) {
      throw new Error(`Account cannot be deleted yet: ${blockers.map((b) => b.code).join(", ")}`);
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { _count: { select: { orders: true } } },
  });
  if (!user) throw new Error("User not found");

  const hasOrders = user._count.orders > 0;

  await prisma.$transaction(async (tx) => {
    // Remove non-financial personal data. (Conversation cascade-deletes its
    // ChatMessages, which carry the only chat-side identifiers.)
    await tx.address.deleteMany({ where: { userId } });
    await tx.wishlistItem.deleteMany({ where: { userId } });
    await tx.review.deleteMany({ where: { userId } });
    await tx.pushSubscription.deleteMany({ where: { userId } });
    await tx.conversation.deleteMany({ where: { userId } });
    // Leads are kept for analytics but stripped of the person's identity.
    await tx.inquiry.updateMany({
      where: { userId },
      data: { userId: null, name: null, contact: null },
    });

    if (hasOrders) {
      // Anonymize in place — the order rows still reference this id.
      await tx.user.update({
        where: { id: userId },
        data: {
          name: "Deleted user",
          email: `deleted-${userId}@removed.invalid`,
          phone: null,
          passwordHash: null,
          isGuest: true,
        },
      });
    } else {
      await tx.user.delete({ where: { id: userId } });
    }
  });

  return hasOrders ? "anonymized" : "deleted";
}
