import webpush from "web-push";
import { prisma } from "@/lib/prisma";

let configured = false;

function ensureConfigured() {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@sellersplace.app";

  if (!publicKey || !privateKey) {
    console.warn("VAPID keys not set — push notifications disabled.");
    return;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export type PushPayload = { title: string; body: string; url?: string };

/** Sends a push notification to every device a given user has subscribed on. */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  ensureConfigured();
  if (!configured) return;

  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });

  await Promise.allSettled(
    subscriptions.map((sub: (typeof subscriptions)[number]) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify(payload)
      )
    )
  );
}

/** Notifies every ADMIN/STAFF device — e.g. a new support message or ticket. */
export async function sendPushToAdmins(payload: PushPayload) {
  ensureConfigured();
  if (!configured) return;

  const admins = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "STAFF"] } },
    select: { id: true },
  });
  await Promise.allSettled(
    admins.map((a: (typeof admins)[number]) => sendPushToUser(a.id, payload))
  );
}

/** Back-compat wrapper — the orders flow keeps its original entry point. */
export async function sendOrderStatusPush(userId: string, payload: PushPayload) {
  return sendPushToUser(userId, payload);
}
