// Server-side persistence for /testing-platform QA dashboard.
// Admin-only; status is shared across all admins so the team can
// hand off testing without losing context.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = new Set(["not_tested", "pending", "done"]);

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id) return { error: "Unauthorized", status: 401 as const };
  if (user.role !== "ADMIN") return { error: "Admin only", status: 403 as const };
  return { user };
}

// GET — return a map of itemId → { status, notes, updatedAt, updatedBy }
export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const rows = await prisma.testingChecklistStatus.findMany({
    select: { itemId: true, status: true, notes: true, updatedAt: true, updatedById: true },
  });

  // Hydrate updater names
  const userIds = [...new Set(rows.map((r) => r.updatedById).filter(Boolean) as string[])];
  const users = userIds.length
    ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } })
    : [];
  const userMap = new Map(users.map((u) => [u.id, u.name]));

  const statuses: Record<string, { status: string; notes: string | null; updatedAt: string; updatedBy: string | null }> = {};
  for (const r of rows) {
    statuses[r.itemId] = {
      status: r.status,
      notes: r.notes,
      updatedAt: r.updatedAt.toISOString(),
      updatedBy: r.updatedById ? userMap.get(r.updatedById) ?? null : null,
    };
  }

  return NextResponse.json({ statuses });
}

// PUT — { itemId, status, notes? } — upsert one row.
// status === "not_tested" deletes the row (default state = absent).
export async function PUT(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await req.json().catch(() => ({}))) as { itemId?: string; status?: string; notes?: string };
  const itemId = String(body.itemId || "").trim();
  const status = String(body.status || "").trim();

  if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });
  if (!VALID_STATUSES.has(status)) {
    return NextResponse.json({ error: "status must be not_tested | pending | done" }, { status: 400 });
  }

  if (status === "not_tested") {
    await prisma.testingChecklistStatus.deleteMany({ where: { itemId } });
    return NextResponse.json({ ok: true, status });
  }

  const row = await prisma.testingChecklistStatus.upsert({
    where: { itemId },
    create: {
      itemId,
      status,
      notes: body.notes ?? null,
      updatedById: auth.user.id,
    },
    update: {
      status,
      notes: body.notes ?? null,
      updatedById: auth.user.id,
    },
    select: { itemId: true, status: true, notes: true, updatedAt: true },
  });

  return NextResponse.json({ ok: true, ...row });
}

// DELETE — clear every row (Reset all button)
export async function DELETE() {
  const auth = await requireAdmin();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const result = await prisma.testingChecklistStatus.deleteMany({});
  return NextResponse.json({ deleted: result.count });
}
