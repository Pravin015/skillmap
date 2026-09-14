import "server-only";
import { db } from "./db";

const cfg = () => ({ sid: process.env.TWILIO_ACCOUNT_SID ?? "", token: process.env.TWILIO_AUTH_TOKEN ?? "", wa: process.env.TWILIO_WHATSAPP_FROM ?? "", sms: process.env.TWILIO_SMS_FROM ?? "" });
export const smsConfigured = () => { const c = cfg(); return !!c.sid && !!c.token && (!!c.wa || !!c.sms); };

/** WhatsApp first (Twilio sandbox or approved sender), SMS as fallback. Without keys the message is logged so the flow is testable. */
export async function sendText({ to, body, userId }: { to: string; body: string; userId?: string | null }) {
  const c = cfg();
  const e164 = to.replace(/[^\d+]/g, "");
  const channel = c.wa ? "whatsapp" : "sms";
  if (!smsConfigured()) {
    await db.smsLog.create({ data: { userId: userId ?? null, to: e164, channel, body, status: "logged" } });
    if (process.env.NODE_ENV !== "production") console.log(`[${channel} → ${e164}] ${body}`);
    return { ok: true, logged: true };
  }
  try {
    const params = new URLSearchParams({ To: channel === "whatsapp" ? `whatsapp:${e164}` : e164, From: channel === "whatsapp" ? c.wa : c.sms, Body: body });
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${c.sid}/Messages.json`, { method: "POST", headers: { Authorization: `Basic ${Buffer.from(`${c.sid}:${c.token}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" }, body: params });
    const json = (await res.json().catch(() => ({}))) as { message?: string };
    if (!res.ok) throw new Error(json.message || `Twilio ${res.status}`);
    await db.smsLog.create({ data: { userId: userId ?? null, to: e164, channel, body, status: "sent" } });
    return { ok: true };
  } catch (e) {
    await db.smsLog.create({ data: { userId: userId ?? null, to: e164, channel, body, status: "failed", error: (e as Error).message } });
    return { ok: false, error: (e as Error).message };
  }
}

/** Sends to members who added a phone number and opted in. */
export async function textUsers(userIds: string[], body: string) {
  if (!userIds.length) return;
  const users = await db.user.findMany({ where: { id: { in: userIds }, status: "ACTIVE", whatsappAlerts: true, phone: { not: null } }, select: { id: true, phone: true } });
  await Promise.all(users.map((u) => sendText({ to: u.phone!, body, userId: u.id })));
}
