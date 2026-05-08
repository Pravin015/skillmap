// Cron endpoint: pull courses from ashpanix-institute, upsert into our DB.
//
// Schedule from Railway: every 6h.
//   curl -X POST https://astraahire.com/api/cron/sync-courses \
//        -H "x-cron-secret: $CRON_SECRET"
//
// Idempotent — re-runs are safe. Only courses with synthetic slug
// `ashpanix-*` are touched; locally-created courses untouched.
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { syncCourses } from "@/lib/integrations/ashpanix-courses";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  const headerVal =
    req.headers.get("x-cron-secret") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    "";
  const a = Buffer.from(headerVal);
  const b = Buffer.from(secret);
  const ok = a.length === b.length && crypto.timingSafeEqual(a, b);
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await syncCourses();
  return NextResponse.json(result);
}

// GET — admin-friendly dry status ping (no secret needed)
export async function GET() {
  const { ashpanixConfigured } = await import("@/lib/integrations/ashpanix-courses");
  return NextResponse.json({ configured: ashpanixConfigured });
}
