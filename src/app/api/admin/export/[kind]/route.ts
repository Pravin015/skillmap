import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { staffCan } from "@/lib/permissions";
import { audit } from "@/lib/notify";

const esc = (v: unknown) => { const s = v == null ? "" : v instanceof Date ? v.toISOString() : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const csv = (rows: Record<string, unknown>[]) => { if (!rows.length) return ""; const cols = Object.keys(rows[0]); return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n"); };

/** Staff CSV exports (platform permission). Audit-logged. */
export async function GET(_req: Request, { params }: { params: Promise<{ kind: string }> }) {
  const user = await getCurrentUser();
  if (!user || !staffCan(user.role, "platform")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { kind } = await params;
  let rows: Record<string, unknown>[] = [];
  if (kind === "users") rows = (await db.user.findMany({ select: { id: true, name: true, email: true, role: true, status: true, createdAt: true, onboardingCompletedAt: true, trainerProfile: { select: { slug: true, verifiedAt: true } }, memberships: { select: { role: true, company: { select: { name: true } } } } }, orderBy: { createdAt: "desc" } })).map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, status: u.status, created: u.createdAt, onboarded: u.onboardingCompletedAt, trainerSlug: u.trainerProfile?.slug, verified: u.trainerProfile?.verifiedAt, companies: u.memberships.map((m) => `${m.company.name} (${m.role})`).join("; ") }));
  else if (kind === "companies") rows = (await db.company.findMany({ select: { id: true, name: true, slug: true, type: true, industry: true, size: true, website: true, gstin: true, domainVerifiedAt: true, createdAt: true, _count: { select: { members: true, requirements: true } } }, orderBy: { createdAt: "desc" } })).map(({ _count, ...c }) => ({ ...c, members: _count.members, requirements: _count.requirements }));
  else if (kind === "requirements") rows = (await db.requirement.findMany({ select: { id: true, title: true, status: true, mode: true, city: true, startDate: true, endDate: true, days: true, participants: true, budgetMin: true, budgetMax: true, currency: true, createdAt: true, company: { select: { name: true } }, _count: { select: { applications: true } } }, orderBy: { createdAt: "desc" } })).map(({ _count, ...r }) => ({ ...r, company: r.company.name, applications: _count.applications }));
  else if (kind === "invoices") rows = (await db.invoice.findMany({ select: { id: true, invoiceNumber: true, status: true, amount: true, gstAmount: true, total: true, currency: true, dueDate: true, paidAt: true, createdAt: true, company: { select: { name: true } }, trainer: { select: { user: { select: { name: true } } } } }, orderBy: { createdAt: "desc" } })).map((i) => ({ ...i, company: i.company.name, trainer: i.trainer.user.name }));
  else if (kind === "subscriptions") rows = (await db.subscription.findMany({ select: { id: true, plan: true, interval: true, status: true, amount: true, currency: true, provider: true, currentPeriodEnd: true, createdAt: true, user: { select: { email: true } }, company: { select: { name: true } } }, orderBy: { createdAt: "desc" } })).map((s) => ({ ...s, user: s.user?.email, company: s.company?.name }));
  else return NextResponse.json({ error: "unknown export" }, { status: 404 });
  await audit(user.id, "export.csv", kind, { rows: rows.length });
  return new NextResponse(csv(rows), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="corpgurus-${kind}-${new Date().toISOString().slice(0, 10)}.csv"` } });
}
