import "server-only";
import { db } from "./db";

export async function notify(userId: string | string[], type: string, title: string, body: string, href?: string) {
  const ids = Array.isArray(userId) ? userId : [userId];
  if (!ids.length) return;
  await db.notification.createMany({ data: ids.map((id) => ({ userId: id, type, title, body, href })) });
}

export async function audit(actorId: string, action: string, target: string, detail?: unknown) {
  await db.auditLog.create({ data: { actorId, action, target, detail: detail === undefined ? undefined : (detail as object) } });
}
