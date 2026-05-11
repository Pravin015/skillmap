// POST /api/reports — submit an abuse report
// GET  /api/reports — admin: list all reports (filterable)
// PATCH /api/reports — admin: change status
//
// Anyone signed in can submit. Triage is admin-only.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimitAsync, getClientIP } from "@/lib/rate-limit";

const VALID_TARGETS = new Set(["JOB", "BLOG_POST", "COURSE", "MENTOR_PROFILE", "USER", "COMPANY", "COMPETITION", "EVENT", "OTHER"]);
const VALID_REASONS = new Set(["SPAM", "SCAM_OR_FRAUD", "HARASSMENT_OR_ABUSE", "IMPERSONATION", "OFFENSIVE_CONTENT", "COPYRIGHT", "MISLEADING_INFO", "OTHER"]);
const VALID_STATUSES = new Set(["OPEN", "UNDER_REVIEW", "ACTION_TAKEN", "DISMISSED"]);

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: "Sign in to submit a report." }, { status: 401 });
  }

  // Light rate limit — defeats spam-flooding the moderation queue.
  // 10 reports per user per hour, plus 30 per IP per hour.
  const userOk = await rateLimitAsync(`report:user:${userId}`, 10, 60 * 60 * 1000);
  if (!userOk.allowed) {
    return NextResponse.json({ error: "Too many reports. Try again in an hour." }, { status: 429 });
  }
  const ipOk = await rateLimitAsync(`report:ip:${getClientIP(req)}`, 30, 60 * 60 * 1000);
  if (!ipOk.allowed) {
    return NextResponse.json({ error: "Too many reports from your network." }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const targetType = String(body.targetType || "").toUpperCase();
  const targetId = String(body.targetId || "").trim();
  const reason = String(body.reason || "").toUpperCase();
  const details = body.details ? String(body.details).slice(0, 2000) : null;
  const targetUrl = body.targetUrl ? String(body.targetUrl).slice(0, 500) : null;

  if (!VALID_TARGETS.has(targetType)) {
    return NextResponse.json({ error: "Invalid targetType" }, { status: 400 });
  }
  if (!targetId) {
    return NextResponse.json({ error: "targetId required" }, { status: 400 });
  }
  if (!VALID_REASONS.has(reason)) {
    return NextResponse.json({ error: "Invalid reason" }, { status: 400 });
  }

  const report = await prisma.abuseReport.create({
    data: {
      reporterId: userId,
      targetType: targetType as never,
      targetId,
      targetUrl,
      reason: reason as never,
      details,
    },
    select: { id: true, createdAt: true },
  });

  return NextResponse.json({ ok: true, reportId: report.id, createdAt: report.createdAt });
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (role !== "ADMIN") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const targetType = searchParams.get("targetType");

  const where: Record<string, unknown> = {};
  if (status && VALID_STATUSES.has(status.toUpperCase())) where.status = status.toUpperCase();
  if (targetType && VALID_TARGETS.has(targetType.toUpperCase())) where.targetType = targetType.toUpperCase();

  const reports = await prisma.abuseReport.findMany({
    where,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 200,
    include: {
      reporter: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  return NextResponse.json({ reports });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  const userId = (session?.user as { id?: string })?.id;
  if (role !== "ADMIN" || !userId) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const id = String(body.id || "");
  const status = String(body.status || "").toUpperCase();
  const resolution = body.resolution ? String(body.resolution).slice(0, 2000) : null;

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  if (!VALID_STATUSES.has(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const updated = await prisma.abuseReport.update({
    where: { id },
    data: {
      status: status as never,
      resolution,
      resolvedAt: status === "ACTION_TAKEN" || status === "DISMISSED" ? new Date() : null,
      resolvedById: status === "ACTION_TAKEN" || status === "DISMISSED" ? userId : null,
    },
  });

  return NextResponse.json({ report: updated });
}
