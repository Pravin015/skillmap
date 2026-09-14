import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { appUrl } from "@/lib/oauth";
import { connectCalendar, syncTrainerBusy } from "@/lib/calendar";
import { audit } from "@/lib/notify";

const STATE_COOKIE = "cg_cal_state";
const back = (q: string) => NextResponse.redirect(`${appUrl()}/settings/availability?cal=${q}`);

/** OAuth callback: store tokens, then pull busy days once so the calendar strip updates immediately. */
export async function GET(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(`${appUrl()}/login?next=/settings/availability`);
  const { provider } = await params;
  const p = provider.toUpperCase() === "MICROSOFT" ? "MICROSOFT" : "GOOGLE";
  const url = new URL(req.url);
  const code = url.searchParams.get("code"), state = url.searchParams.get("state");
  const cookieState = req.headers.get("cookie")?.match(new RegExp(`${STATE_COOKIE}=([^;]+)`))?.[1];
  if (!code || !state || state !== cookieState) return back("state");
  try {
    await connectCalendar(user.id, p, code);
    await audit(user.id, "calendar.connect", p);
    if (user.trainerProfile) await syncTrainerBusy(user.id, user.trainerProfile.id).catch(() => null);
  } catch (e) {
    console.error("[calendar] connect", (e as Error).message);
    return back("error");
  }
  const res = back("connected");
  res.cookies.delete(STATE_COOKIE);
  return res;
}
