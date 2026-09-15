import "server-only";
import { createHash, randomBytes } from "node:crypto";
import type { TokenKind } from "@prisma/client";
import { db } from "@/lib/db";

/** Single-use links. Only the SHA-256 of the token is stored; the raw value lives in the email alone. */
const hash = (raw: string) => createHash("sha256").update(raw).digest("hex");
const TTL_HOURS: Record<TokenKind, number> = { PASSWORD_RESET: 1, EMAIL_VERIFY: 72, EMAIL_CHANGE: 24 };

export async function issueToken(userId: string, kind: TokenKind, newEmail?: string) {
  // One live token per purpose: older ones are invalidated so a forgotten link cannot be replayed later.
  await db.verificationToken.updateMany({ where: { userId, kind, usedAt: null }, data: { usedAt: new Date() } });
  const raw = randomBytes(32).toString("base64url");
  await db.verificationToken.create({ data: { userId, kind, tokenHash: hash(raw), newEmail: newEmail ?? null, expiresAt: new Date(Date.now() + TTL_HOURS[kind] * 3600000) } });
  return raw;
}

/** Marks the token used and returns it, or null when unknown, expired or already used. */
export async function consumeToken(raw: string, kind: TokenKind) {
  const t = await db.verificationToken.findUnique({ where: { tokenHash: hash(raw) }, include: { user: { select: { id: true, email: true, name: true, status: true } } } });
  if (!t || t.kind !== kind || t.usedAt || t.expiresAt < new Date()) return null;
  await db.verificationToken.update({ where: { id: t.id }, data: { usedAt: new Date() } });
  return t;
}

/** Kind of a live token, or null. Lets one /verify route serve both verification and email-change links. */
export async function liveTokenKind(raw: string) {
  const t = await db.verificationToken.findUnique({ where: { tokenHash: hash(raw) }, select: { kind: true, usedAt: true, expiresAt: true } });
  return t && !t.usedAt && t.expiresAt > new Date() ? t.kind : null;
}

export const peekToken = async (raw: string, kind: TokenKind) => {
  const t = await db.verificationToken.findUnique({ where: { tokenHash: hash(raw) }, select: { kind: true, usedAt: true, expiresAt: true } });
  return !!t && t.kind === kind && !t.usedAt && t.expiresAt > new Date();
};
