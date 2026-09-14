import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/** AES-256-GCM for secrets at rest (OAuth tokens, bank account numbers). Key derived from AUTH_SECRET. */
const key = () => createHash("sha256").update(process.env.AUTH_SECRET ?? "dev-secret").digest();

export function encrypt(plain: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return `v1.${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${enc.toString("base64url")}`;
}

export function decrypt(token: string | null | undefined) {
  if (!token) return null;
  try {
    const [v, iv, tag, data] = token.split(".");
    if (v !== "v1") return null;
    const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8");
  } catch { return null; }
}

/** "XXXXXX1234" style display for account numbers. */
export const maskAccount = (n: string | null | undefined) => (n ? `${"•".repeat(Math.max(0, n.length - 4))}${n.slice(-4)}` : "");
