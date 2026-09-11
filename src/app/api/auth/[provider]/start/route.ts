import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { appUrl, authorizationUrl, isProvider, providerConfigured, STATE_COOKIE } from "@/lib/oauth";

export async function GET(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const url = new URL(req.url);
  if (!isProvider(provider) || !providerConfigured(provider)) {
    return NextResponse.redirect(`${appUrl()}/login?error=provider`);
  }
  const state = randomUUID();
  const as = url.searchParams.get("as") === "company" ? "company" : url.searchParams.get("as") === "trainer" ? "trainer" : undefined;
  const nextPath = url.searchParams.get("next") ?? "";
  const res = NextResponse.redirect(authorizationUrl(provider, state));
  res.cookies.set(STATE_COOKIE, JSON.stringify({ state, as, next: nextPath.startsWith("/") ? nextPath : undefined }), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 600,
  });
  return res;
}
