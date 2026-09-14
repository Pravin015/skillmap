import { NextResponse } from "next/server";
import { runDailyJobs } from "@/lib/jobs";
import { getCurrentUser, isStaff } from "@/lib/auth";

/** Trigger with a scheduler (cron, GitHub Actions, Vercel Cron) using the x-cron-secret header, or as a signed-in super admin. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const provided = req.headers.get("x-cron-secret") ?? new URL(req.url).searchParams.get("secret");
  const user = provided && secret && provided === secret ? null : await getCurrentUser();
  if (!(provided && secret && provided === secret) && !isStaff(user)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const summary = await runDailyJobs();
  return NextResponse.json({ ok: true, summary, ranAt: new Date().toISOString() });
}
