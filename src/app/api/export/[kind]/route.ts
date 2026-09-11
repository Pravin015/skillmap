import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { toCsv } from "@/lib/csv";

const csv = (name: string, rows: Record<string, unknown>[], columns?: string[]) =>
  new NextResponse(toCsv(rows, columns), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="corpgurus-${name}-${new Date().toISOString().slice(0, 10)}.csv"` } });
const json = (name: string, data: unknown) =>
  new NextResponse(JSON.stringify(data, null, 2), { headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="corpgurus-${name}-${new Date().toISOString().slice(0, 10)}.json"` } });

/** Signed-in members export their own data. Trainers: profile, applications, work-orders, invoices, feedback. Companies: requirements, applicants, work-orders, invoices. `all` = JSON bundle. */
export async function GET(_req: Request, { params }: { params: Promise<{ kind: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "sign in" }, { status: 401 });
  const { kind } = await params;
  const tid = user.trainerProfile?.id;
  const cid = user.membership?.company.id;

  if (tid) {
    switch (kind) {
      case "applications": {
        const rows = await db.application.findMany({ where: { trainerId: tid }, include: { requirement: { include: { company: { select: { name: true } } } } }, orderBy: { createdAt: "desc" } });
        return csv("applications", rows.map((a) => ({ applied_on: a.createdAt, requirement: a.requirement.title, company: a.requirement.company.name, start: a.requirement.startDate, end: a.requirement.endDate, days: a.requirement.days, mode: a.requirement.mode, city: a.requirement.city, proposed_rate: a.proposedRate, currency: a.requirement.currency, status: a.status, decline_reason: a.declineReason, cover_note: a.coverNote })));
      }
      case "work-orders": {
        const rows = await db.workOrder.findMany({ where: { trainerId: tid }, include: { company: { select: { name: true } } }, orderBy: { createdAt: "desc" } });
        return csv("work-orders", rows.map((w) => ({ number: `WO-${String(w.number).padStart(4, "0")}`, version: w.version, status: w.status, company: w.company.name, title: w.title, start: w.startDate, end: w.endDate, days: w.days, day_rate: w.dayRate, total: w.total, currency: w.currency, participants: w.participants, mode: w.mode, accepted_at: w.acceptedAt })));
      }
      case "invoices": {
        const rows = await db.invoice.findMany({ where: { trainerId: tid }, include: { company: { select: { name: true } } }, orderBy: { issuedAt: "desc" } });
        return csv("invoices", rows.map((i) => ({ invoice_number: i.invoiceNumber, company: i.company.name, issued: i.issuedAt, due: i.dueDate, amount: i.amount, gst_rate: i.gstRate, gst_amount: i.gstAmount, total: i.total, currency: i.currency, status: i.status, paid_at: i.paidAt, paid_reference: i.paidReference })));
      }
      case "feedback": {
        const rows = await db.feedbackResponse.findMany({ where: { link: { trainerId: tid } }, include: { link: { include: { requirement: { select: { title: true } } } } }, orderBy: { createdAt: "desc" } });
        return csv("participant-feedback", rows.map((f) => ({ date: f.createdAt, requirement: f.link.requirement.title, score: f.score, would_recommend: f.wouldRecommend, comment: f.comment })));
      }
      case "profile": case "all": {
        const p = await db.trainerProfile.findUnique({ where: { id: tid }, include: { user: { select: { name: true, email: true, createdAt: true } }, skills: { select: { name: true } }, certifications: true, courses: { include: { skills: { select: { name: true } } } }, availability: true, photos: true, recommendations: { include: { author: { select: { name: true } } } } } });
        const extra = kind === "all" ? { applications: await db.application.findMany({ where: { trainerId: tid }, include: { requirement: { select: { title: true, startDate: true, endDate: true } } } }), workOrders: await db.workOrder.findMany({ where: { trainerId: tid } }), invoices: await db.invoice.findMany({ where: { trainerId: tid } }), posts: await db.post.findMany({ where: { authorId: user.id, deletedAt: null } }), notifications: await db.notification.findMany({ where: { userId: user.id }, take: 500 }) } : {};
        return json(kind === "all" ? "everything" : "profile", { exportedAt: new Date(), profile: p, ...extra });
      }
    }
  }
  if (cid) {
    switch (kind) {
      case "requirements": {
        const rows = await db.requirement.findMany({ where: { companyId: cid }, include: { category: true, skills: { select: { name: true } }, _count: { select: { applications: true } }, applications: { where: { status: "AWARDED" }, include: { trainer: { include: { user: { select: { name: true } } } } } } }, orderBy: { createdAt: "desc" } });
        return csv("requirements", rows.map((r) => ({ posted: r.createdAt, title: r.title, category: r.category.name, skills: r.skills.map((s) => s.name), mode: r.mode, city: r.city, start: r.startDate, end: r.endDate, days: r.days, participants: r.participants, budget_min: r.budgetMin, budget_max: r.budgetMax, currency: r.currency, visibility: r.visibility, status: r.status, applications: r._count.applications, awarded_to: r.applications[0]?.trainer.user.name ?? "" })));
      }
      case "applicants": {
        const rows = await db.application.findMany({ where: { requirement: { companyId: cid } }, include: { requirement: { select: { title: true } }, trainer: { include: { user: { select: { name: true, email: true } } } } }, orderBy: { createdAt: "desc" } });
        return csv("applicants", rows.map((a) => ({ applied_on: a.createdAt, requirement: a.requirement.title, trainer: a.trainer.user.name, trainer_email: a.trainer.user.email, headline: a.trainer.headline, cities: a.trainer.cities, proposed_rate: a.proposedRate, status: a.status, cover_note: a.coverNote })));
      }
      case "work-orders": {
        const rows = await db.workOrder.findMany({ where: { companyId: cid }, include: { trainer: { include: { user: { select: { name: true } } } } }, orderBy: { createdAt: "desc" } });
        return csv("work-orders", rows.map((w) => ({ number: `WO-${String(w.number).padStart(4, "0")}`, version: w.version, status: w.status, trainer: w.trainer.user.name, title: w.title, start: w.startDate, end: w.endDate, days: w.days, day_rate: w.dayRate, total: w.total, currency: w.currency, participants: w.participants, accepted_at: w.acceptedAt })));
      }
      case "invoices": {
        const rows = await db.invoice.findMany({ where: { companyId: cid }, include: { trainer: { include: { user: { select: { name: true } } } } }, orderBy: { issuedAt: "desc" } });
        return csv("invoices", rows.map((i) => ({ invoice_number: i.invoiceNumber, trainer: i.trainer.user.name, trainer_gstin: i.trainerGstin, issued: i.issuedAt, due: i.dueDate, amount: i.amount, gst_rate: i.gstRate, gst_amount: i.gstAmount, total: i.total, currency: i.currency, status: i.status, paid_at: i.paidAt, paid_reference: i.paidReference })));
      }
      case "all": {
        const c = await db.company.findUnique({ where: { id: cid }, include: { members: { include: { user: { select: { name: true, email: true } } } }, requirements: { include: { applications: true, workOrder: true } }, invoices: true, saved: true } });
        return json("company-everything", { exportedAt: new Date(), company: c });
      }
    }
  }
  return NextResponse.json({ error: "unknown export" }, { status: 404 });
}
