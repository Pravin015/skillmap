"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { audit } from "@/lib/notify";
import { generateApiKey } from "@/lib/api-auth";
import { dispatchWebhook, WEBHOOK_EVENTS } from "@/lib/webhooks";
import type { ActionState } from "@/lib/types";
import { companyCan } from "@/lib/permissions";

async function companyOf() {
  const user = await requireUser();
  if (!user.membership || !companyCan(user.membership.role, "api_keys")) return null;
  return { user, companyId: user.membership.company.id };
}
const refresh = () => revalidatePath("/settings/developers");

/** Creates a key and returns the plaintext once in the success message. */
export async function createApiKey(_p: ActionState, fd: FormData): Promise<ActionState> {
  const ctx = await companyOf();
  if (!ctx) return { error: "Only company members can manage API keys." };
  const name = String(fd.get("name") ?? "").trim().slice(0, 60) || "Default";
  const live = await db.apiKey.count({ where: { companyId: ctx.companyId, revokedAt: null } });
  if (live >= 10) return { error: "Up to 10 active keys per company. Revoke one first." };
  const { key, prefix, keyHash } = generateApiKey();
  await db.apiKey.create({ data: { companyId: ctx.companyId, name, prefix, keyHash } });
  await audit(ctx.user.id, "apikey.create", ctx.companyId, { name });
  refresh();
  return { ok: `KEY:${key}` };
}

export async function revokeApiKey(fd: FormData) {
  const ctx = await companyOf();
  if (!ctx) return;
  const id = String(fd.get("id"));
  await db.apiKey.updateMany({ where: { id, companyId: ctx.companyId, revokedAt: null }, data: { revokedAt: new Date() } });
  await audit(ctx.user.id, "apikey.revoke", id);
  refresh();
}

export async function addWebhook(_p: ActionState, fd: FormData): Promise<ActionState> {
  const ctx = await companyOf();
  if (!ctx) return { error: "Only company members can manage webhooks." };
  const url = String(fd.get("url") ?? "").trim();
  if (!/^https?:\/\/[^\s]+$/i.test(url)) return { error: "Enter a valid http(s) URL." };
  if (!url.startsWith("https://") && !/localhost|127\.0\.0\.1/.test(url)) return { error: "Webhook endpoints must use HTTPS." };
  const events = fd.getAll("events").map(String).filter((e) => e === "*" || (WEBHOOK_EVENTS as readonly string[]).includes(e));
  if (!events.length) return { error: "Pick at least one event." };
  const count = await db.webhookEndpoint.count({ where: { companyId: ctx.companyId } });
  if (count >= 10) return { error: "Up to 10 endpoints per company." };
  const secret = `whsec_${randomBytes(24).toString("base64url")}`;
  await db.webhookEndpoint.create({ data: { companyId: ctx.companyId, url, secret, events: events.includes("*") ? ["*"] : events } });
  await audit(ctx.user.id, "webhook.create", ctx.companyId, { url });
  refresh();
  return { ok: `Endpoint added. Signing secret: ${secret}` };
}

export async function toggleWebhook(fd: FormData) {
  const ctx = await companyOf();
  if (!ctx) return;
  const ep = await db.webhookEndpoint.findFirst({ where: { id: String(fd.get("id")), companyId: ctx.companyId } });
  if (!ep) return;
  await db.webhookEndpoint.update({ where: { id: ep.id }, data: { active: !ep.active } });
  refresh();
}

export async function deleteWebhook(fd: FormData) {
  const ctx = await companyOf();
  if (!ctx) return;
  await db.webhookEndpoint.deleteMany({ where: { id: String(fd.get("id")), companyId: ctx.companyId } });
  await audit(ctx.user.id, "webhook.delete", String(fd.get("id")));
  refresh();
}

export async function sendTestWebhook(fd: FormData) {
  const ctx = await companyOf();
  if (!ctx) return;
  const ep = await db.webhookEndpoint.findFirst({ where: { id: String(fd.get("id")), companyId: ctx.companyId } });
  if (!ep) return;
  // Temporarily deliver a "test" event regardless of the subscription list by targeting only this endpoint.
  const saved = ep.events;
  await db.webhookEndpoint.update({ where: { id: ep.id }, data: { events: [...saved, "test"], active: true } });
  await dispatchWebhook(ctx.companyId, "test", { message: "Hello from CorpGurus", sentBy: ctx.user.name });
  await db.webhookEndpoint.update({ where: { id: ep.id }, data: { events: saved, active: ep.active } });
  refresh();
}
