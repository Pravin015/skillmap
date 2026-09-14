import "server-only";
import webpush from "web-push";
import { db } from "./db";

export const pushConfigured = () => !!process.env.VAPID_PUBLIC_KEY && !!process.env.VAPID_PRIVATE_KEY;
export const vapidPublicKey = () => process.env.VAPID_PUBLIC_KEY ?? "";

let configured = false;
function ensure() {
  if (configured || !pushConfigured()) return;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? "mailto:support@corpgurus.com", process.env.VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);
  configured = true;
}

/** Browser push to every device a member subscribed. Dead subscriptions (410/404) are removed. */
export async function pushUsers(userIds: string[], payload: { title: string; body: string; url?: string }) {
  if (!userIds.length || !pushConfigured()) return;
  ensure();
  const subs = await db.pushSubscription.findMany({ where: { userId: { in: userIds } } });
  await Promise.all(subs.map(async (s) => {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload), { TTL: 3600 });
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) await db.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
    }
  }));
}
