import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { appUrl, exchangeCode, fetchProfile, isProvider, PENDING_COOKIE, providerConfigured, signPending, STATE_COOKIE } from "@/lib/oauth";

const fail = (reason: string) => NextResponse.redirect(`${appUrl()}/login?error=${reason}`);

export async function GET(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  if (!isProvider(provider) || !providerConfigured(provider)) return fail("provider");
  const url = new URL(req.url);
  if (url.searchParams.get("error")) return fail("denied");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const jar = await cookies();
  let saved: { state?: string; as?: "trainer" | "company"; next?: string } = {};
  try { saved = JSON.parse(jar.get(STATE_COOKIE)?.value ?? "{}"); } catch { /* ignore */ }
  if (!code || !state || !saved.state || saved.state !== state) return fail("state");

  let profile;
  try {
    const token = await exchangeCode(provider, code);
    profile = await fetchProfile(provider, token);
  } catch (e) {
    console.error("[oauth]", provider, (e as Error).message);
    return fail("exchange");
  }

  const next = saved.next && saved.next.startsWith("/") ? saved.next : "/dashboard";

  // 1. Already linked → sign in.
  const linked = await db.oAuthAccount.findUnique({ where: { provider_providerAccountId: { provider, providerAccountId: profile.sub } }, include: { user: true } });
  if (linked) {
    if (linked.user.status === "SUSPENDED") return fail("suspended");
    await createSession(linked.userId);
    const res = NextResponse.redirect(`${appUrl()}${next}`);
    res.cookies.delete(STATE_COOKIE);
    return res;
  }

  // 2. Same verified email already registered → link and sign in.
  if (profile.email && profile.emailVerified) {
    const existing = await db.user.findUnique({ where: { email: profile.email } });
    if (existing) {
      if (existing.status === "SUSPENDED") return fail("suspended");
      await db.oAuthAccount.create({ data: { provider, providerAccountId: profile.sub, userId: existing.id, email: profile.email } });
      if (!existing.avatarUrl && profile.picture) await db.user.update({ where: { id: existing.id }, data: { avatarUrl: profile.picture } });
      await createSession(existing.id);
      const res = NextResponse.redirect(`${appUrl()}${next}`);
      res.cookies.delete(STATE_COOKIE);
      return res;
    }
  }

  // 3. New member → finish sign-up (choose trainer / company).
  const pending = await signPending({ ...profile, provider, as: saved.as, next: saved.next });
  const res = NextResponse.redirect(`${appUrl()}/signup/complete`);
  res.cookies.set(PENDING_COOKIE, pending, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 900 });
  res.cookies.delete(STATE_COOKIE);
  return res;
}
