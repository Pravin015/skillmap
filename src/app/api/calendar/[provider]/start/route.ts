import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { getCurrentUser } from "@/lib/auth";
import { appUrl } from "@/lib/oauth";
import { calendarAuthUrl, calendarConfigured } from "@/lib/calendar";

const STATE_COOKIE = "cg_cal_state";

/** Begin connecting a Google or Microsoft calendar for the signed-in user. */
export async function GET(_req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(`${appUrl()}/login?next=/settings/availability`);
  const { provider } = await params;
  const p = provider.toUpperCase() === "MICROSOFT" ? "MICROSOFT" : provider.toUpperCase() === "GOOGLE" ? "GOOGLE" : null;
  if (!p || !calendarConfigured(p)) return NextResponse.redirect(`${appUrl()}/settings/availability?cal=unconfigured`);
  const state = randomBytes(16).toString("hex");
  const res = NextResponse.redirect(calendarAuthUrl(p, state));
  res.cookies.set(STATE_COOKIE, state, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });
  return res;
}
