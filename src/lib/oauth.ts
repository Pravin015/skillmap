import "server-only";
import { SignJWT, jwtVerify } from "jose";

export type Provider = "google" | "linkedin";

type Config = { name: string; authUrl: string; tokenUrl: string; userinfoUrl: string; scope: string; idEnv: string; secretEnv: string };

const PROVIDERS: Record<Provider, Config> = {
  google: {
    name: "Google",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userinfoUrl: "https://openidconnect.googleapis.com/v1/userinfo",
    scope: "openid email profile",
    idEnv: "GOOGLE_CLIENT_ID",
    secretEnv: "GOOGLE_CLIENT_SECRET",
  },
  linkedin: {
    name: "LinkedIn",
    authUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    userinfoUrl: "https://api.linkedin.com/v2/userinfo",
    scope: "openid profile email",
    idEnv: "LINKEDIN_CLIENT_ID",
    secretEnv: "LINKEDIN_CLIENT_SECRET",
  },
};

export const PROVIDER_LIST: Provider[] = ["google", "linkedin"];
export const providerName = (p: Provider) => PROVIDERS[p].name;
export const isProvider = (p: string): p is Provider => p in PROVIDERS;

function creds(p: Provider) {
  const c = PROVIDERS[p];
  return { id: process.env[c.idEnv] ?? "", secret: process.env[c.secretEnv] ?? "" };
}
export const providerConfigured = (p: Provider) => { const c = creds(p); return !!c.id && !!c.secret; };
export const configuredProviders = () => PROVIDER_LIST.filter(providerConfigured);

export const appUrl = () => (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3210").replace(/\/$/, "");
export const redirectUri = (p: Provider) => `${appUrl()}/api/auth/${p}/callback`;

export function authorizationUrl(p: Provider, state: string) {
  const c = PROVIDERS[p];
  const u = new URL(c.authUrl);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("client_id", creds(p).id);
  u.searchParams.set("redirect_uri", redirectUri(p));
  u.searchParams.set("scope", c.scope);
  u.searchParams.set("state", state);
  if (p === "google") { u.searchParams.set("access_type", "online"); u.searchParams.set("prompt", "select_account"); }
  return u.toString();
}

export async function exchangeCode(p: Provider, code: string): Promise<string> {
  const c = PROVIDERS[p];
  const body = new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri(p), client_id: creds(p).id, client_secret: creds(p).secret });
  const res = await fetch(c.tokenUrl, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" }, body, cache: "no-store" });
  const json = (await res.json().catch(() => ({}))) as { access_token?: string; error?: string; error_description?: string };
  if (!res.ok || !json.access_token) throw new Error(json.error_description || json.error || `${c.name} token exchange failed (${res.status})`);
  return json.access_token;
}

export type OAuthProfile = { sub: string; email: string | null; emailVerified: boolean; name: string; picture: string | null };

export async function fetchProfile(p: Provider, accessToken: string): Promise<OAuthProfile> {
  const res = await fetch(PROVIDERS[p].userinfoUrl, { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
  if (!res.ok) throw new Error(`${PROVIDERS[p].name} profile fetch failed (${res.status})`);
  const j = (await res.json()) as { sub: string; email?: string; email_verified?: boolean | string; name?: string; given_name?: string; family_name?: string; picture?: string };
  const name = j.name || [j.given_name, j.family_name].filter(Boolean).join(" ") || "New member";
  return { sub: j.sub, email: j.email?.toLowerCase() ?? null, emailVerified: j.email_verified === true || j.email_verified === "true", name, picture: j.picture ?? null };
}

/* Short-lived signed cookie carrying a verified provider profile between the callback and the sign-up completion form. */
export const PENDING_COOKIE = "cg_oauth_pending";
export const STATE_COOKIE = "cg_oauth_state";
const secret = new TextEncoder().encode(process.env.AUTH_SECRET ?? "dev-secret");
export type Pending = OAuthProfile & { provider: Provider; as?: "trainer" | "company"; next?: string };

export async function signPending(p: Pending) {
  return new SignJWT(p as unknown as Record<string, unknown>).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("15m").sign(secret);
}
export async function readPending(token: string | undefined): Promise<Pending | null> {
  if (!token) return null;
  try { const { payload } = await jwtVerify(token, secret); return payload as unknown as Pending; } catch { return null; }
}
