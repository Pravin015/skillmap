import "server-only";
import { db } from "./db";
import { emailUsers } from "./email";
import { pushUsers } from "./push";
import { textUsers } from "./sms";

/** Types worth a WhatsApp/SMS nudge (opt-in, phone required). */
const TEXT_TYPES = new Set(["application", "workorder", "invoice", "invite"]);

/** Notification types that also go out by email (when the member has email notifications on). */
const EMAIL_TYPES = new Set(["application", "invite", "workorder", "invoice", "billing", "verification", "welcome", "recommendation", "feedback", "moderation", "team"]);

/** Event types mirrored into a company's Slack / Teams channel when it has a webhook configured. */
const WORKSPACE_TYPES = new Set(["application", "workorder", "invoice", "requirement", "team", "verification"]);

/** Post once per company whose members are among the recipients and that has a Slack or Teams incoming webhook. */
async function postToWorkspaces(ids: string[], title: string, body: string, href?: string) {
  const companies = await db.company.findMany({ where: { members: { some: { userId: { in: ids } } }, OR: [{ slackWebhookUrl: { not: null } }, { teamsWebhookUrl: { not: null } }] }, select: { id: true, slackWebhookUrl: true, teamsWebhookUrl: true } });
  const link = href ? `${(process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "")}${href}` : null;
  await Promise.all(companies.flatMap((c) => [
    c.slackWebhookUrl ? fetch(c.slackWebhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: `*${title}*\n${body}${link ? `\n<${link}|Open in CorpGurus>` : ""}` }) }).catch((e) => console.error("[slack]", (e as Error).message)) : null,
    c.teamsWebhookUrl ? fetch(c.teamsWebhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "message", attachments: [{ contentType: "application/vnd.microsoft.card.adaptive", content: { $schema: "http://adaptivecards.io/schemas/adaptive-card.json", type: "AdaptiveCard", version: "1.4", body: [{ type: "TextBlock", text: title, weight: "Bolder", wrap: true }, { type: "TextBlock", text: body, wrap: true }], actions: link ? [{ type: "Action.OpenUrl", title: "Open in CorpGurus", url: link }] : [] } }] }) }).catch((e) => console.error("[teams]", (e as Error).message)) : null,
  ].filter(Boolean)));
}

export async function notify(userId: string | string[], type: string, title: string, body: string, href?: string) {
  const ids = Array.isArray(userId) ? userId : [userId];
  if (!ids.length) return;
  await db.notification.createMany({ data: ids.map((id) => ({ userId: id, type, title, body, href })) });
  if (WORKSPACE_TYPES.has(type)) await postToWorkspaces(ids, title, body, href).catch((e) => console.error("[workspace]", (e as Error).message));
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
