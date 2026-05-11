// POST /api/b2b/track-referral
// Records a JobReferral when a user lands on a job page with
// ?ref=&institute=&student= query params. Fire-and-forget from the
// client; do not block page render on this.
//
// Body: { ref, institute?, student?, externalJobId?, internalJobId? }
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientIP, rateLimitAsync } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // Cheap IP-based throttle — this endpoint is public + unauthenticated.
  const ip = getClientIP(req);
  const { allowed } = await rateLimitAsync(`b2b-track:${ip}`, 60, 60 * 1000);
  if (!allowed) return NextResponse.json({ ok: false }, { status: 429 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body.ref !== "string" || !body.ref) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    await prisma.jobReferral.create({
      data: {
        ref: String(body.ref).slice(0, 50),
        institute: body.institute ? String(body.institute).slice(0, 80) : null,
        studentHash: body.student ? String(body.student).slice(0, 128) : null,
        externalJobId: body.externalJobId ? String(body.externalJobId) : null,
        internalJobId: body.internalJobId ? String(body.internalJobId) : null,
        ip,
        userAgent: req.headers.get("user-agent")?.slice(0, 200) || null,
      },
    });
  } catch { /* best-effort */ }

  return NextResponse.json({ ok: true });
}
