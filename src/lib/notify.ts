import "server-only";
import { db } from "./db";
import { emailUsers } from "./email";
import { pushUsers } from "./push";
import { textUsers } from "./sms";

/** Types worth a WhatsApp/SMS nudge (opt-in, phone required). */
const TEXT_TYPES = new Set(["application", "workorder", "invoice", "invite"]);

/** Notification types that also go out by email (when the member has email notifications on). */
const EMAIL_TYPES = new Set(["application", "invite", "workorder", "invoice", "billing", "verification", "welcome", "recommendation", "feedback", "moderation", "team"]);

export async function notify(userId: string | string[], type: string, title: string, body: string, href?: string) {
  const ids = Array.isArray(userId) ? userId : [userId];
  if (!ids.length) return;
  await db.notification.createMany({ data: ids.map((id) => ({ userId: id, type, title, body, href })) });
  await pushUsers(ids, { title, body, url: href }).catch((e) => console.error("[push]", (e as Error).message));
  if (TEXT_TYPES.has(type)) await textUsers(ids, `CorpGurus: ${title}. ${body.slice(0, 140)}${href ? ` ${(process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "")}${href}` : ""}`).catch((e) => console.error("[sms]", (e as Error).message));
  if (EMAIL_TYPES.has(type)) {
    // Never let email delivery break the action that triggered it.
    await emailUsers(ids, { title, body, ctaHref: href, ctaLabel: "Open in CorpGurus" }).catch((e) => console.error("[email]", (e as Error).message));
  }
}

export async function audit(actorId: string, action: string, target: string, detail?: unknown) {
  await db.auditLog.create({ data: { actorId, action, target, detail: detail === undefined ? undefined : (detail as object) } });
}
