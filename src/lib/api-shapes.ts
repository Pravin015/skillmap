import "server-only";
import type { Prisma } from "@prisma/client";

/** Stable JSON shapes for the public API v1 and webhook payloads. Internal ids are exposed as-is; nothing private (emails, phone, rates of other trainers) leaks. */

export const requirementSelect = {
  id: true, title: true, description: true, mode: true, city: true, startDate: true, endDate: true, days: true, participants: true, budgetMin: true, budgetMax: true, currency: true, language: true, visibility: true, status: true, createdAt: true, updatedAt: true,
  category: { select: { slug: true, name: true } }, skills: { select: { slug: true, name: true } }, _count: { select: { applications: true } },
} satisfies Prisma.RequirementSelect;
type Req = Prisma.RequirementGetPayload<{ select: typeof requirementSelect }>;
export const shapeRequirement = (r: Req) => ({
  id: r.id, title: r.title, description: r.description, status: r.status, visibility: r.visibility, mode: r.mode, city: r.city, language: r.language,
  start_date: r.startDate.toISOString().slice(0, 10), end_date: r.endDate.toISOString().slice(0, 10), days: r.days, participants: r.participants,
  budget: { min: r.budgetMin, max: r.budgetMax, currency: r.currency }, category: r.category, skills: r.skills, applications_count: r._count.applications,
  created_at: r.createdAt, updated_at: r.updatedAt,
});

export const applicationSelect = {
  id: true, requirementId: true, status: true, coverNote: true, proposedRate: true, declineReason: true, createdAt: true, statusChangedAt: true,
  trainer: { select: { id: true, slug: true, headline: true, cities: true, yearsExperience: true, dayRateMin: true, dayRateMax: true, verifiedAt: true, user: { select: { name: true } } } },
  requirement: { select: { title: true, currency: true } },
} satisfies Prisma.ApplicationSelect;
type App = Prisma.ApplicationGetPayload<{ select: typeof applicationSelect }>;
export const shapeApplication = (a: App) => ({
  id: a.id, requirement_id: a.requirementId, requirement_title: a.requirement.title, status: a.status, cover_note: a.coverNote, proposed_rate: a.proposedRate, currency: a.requirement.currency, decline_reason: a.declineReason,
  trainer: { id: a.trainer.id, slug: a.trainer.slug, name: a.trainer.user.name, headline: a.trainer.headline, cities: a.trainer.cities, years_experience: a.trainer.yearsExperience, day_rate: { min: a.trainer.dayRateMin, max: a.trainer.dayRateMax }, verified: !!a.trainer.verifiedAt },
  created_at: a.createdAt, status_changed_at: a.statusChangedAt,
});

export const workOrderSelect = {
  id: true, number: true, version: true, status: true, title: true, requirementId: true, startDate: true, endDate: true, days: true, dayRate: true, currency: true, total: true, participants: true, mode: true, venue: true, sentAt: true, acceptedAt: true, companySignedName: true, trainerSignedName: true, signatureHash: true, createdAt: true,
  trainer: { select: { id: true, slug: true, user: { select: { name: true } } } },
  batches: { select: { label: true, startDate: true, endDate: true, days: true, participants: true, city: true }, orderBy: { position: "asc" } },
  invoices: { select: { id: true, invoiceNumber: true, status: true, total: true, currency: true, dueDate: true, paidAt: true } },
} satisfies Prisma.WorkOrderSelect;
type Wo = Prisma.WorkOrderGetPayload<{ select: typeof workOrderSelect }>;
export const shapeWorkOrder = (w: Wo) => ({
  id: w.id, number: `WO-${String(w.number).padStart(4, "0")}`, version: w.version, status: w.status, title: w.title, requirement_id: w.requirementId,
  trainer: { id: w.trainer.id, slug: w.trainer.slug, name: w.trainer.user.name },
  start_date: w.startDate.toISOString().slice(0, 10), end_date: w.endDate.toISOString().slice(0, 10), days: w.days, participants: w.participants, mode: w.mode, venue: w.venue,
  day_rate: w.dayRate, currency: w.currency, total: w.total,
  batches: w.batches.map((b) => ({ label: b.label, start_date: b.startDate.toISOString().slice(0, 10), end_date: b.endDate.toISOString().slice(0, 10), days: b.days, participants: b.participants, city: b.city })),
  signatures: { company: w.companySignedName, trainer: w.trainerSignedName, reference: w.signatureHash },
  invoices: w.invoices.map((i) => ({ id: i.id, number: i.invoiceNumber, status: i.status, total: i.total, currency: i.currency, due_date: i.dueDate, paid_at: i.paidAt })),
  sent_at: w.sentAt, accepted_at: w.acceptedAt, created_at: w.createdAt,
});

export const purchaseOrderSelect = {
  id: true, number: true, poNumber: true, version: true, status: true, title: true, workOrderId: true, poDate: true, validUntil: true, currency: true, subtotal: true, gstRate: true, gstAmount: true, taxType: true, total: true, sacCode: true, placeOfSupply: true, periodText: true, participants: true, endClientRef: true, paymentTerms: true, issuedAt: true, acceptedAt: true, acceptedByName: true, closedAt: true, createdAt: true,
  trainer: { select: { id: true, slug: true, user: { select: { name: true } } } },
  lines: { select: { description: true, qty: true, unit: true, rate: true, amount: true }, orderBy: { position: "asc" } },
  invoices: { select: { id: true, invoiceNumber: true, status: true, amount: true, total: true, currency: true, dueDate: true, paidAt: true } },
} satisfies Prisma.PurchaseOrderSelect;
type Po = Prisma.PurchaseOrderGetPayload<{ select: typeof purchaseOrderSelect }>;
export const shapePurchaseOrder = (p: Po) => ({
  id: p.id, number: p.poNumber || null, sequence: p.number, version: p.version, status: p.status, title: p.title, work_order_id: p.workOrderId,
  trainer: { id: p.trainer.id, slug: p.trainer.slug, name: p.trainer.user.name },
  po_date: p.poDate.toISOString().slice(0, 10), valid_until: p.validUntil ? p.validUntil.toISOString().slice(0, 10) : null,
  currency: p.currency, subtotal: p.subtotal, gst_rate: p.gstRate, gst_amount: p.gstAmount, tax_type: p.taxType, total: p.total, sac_code: p.sacCode, place_of_supply: p.placeOfSupply, period: p.periodText, participants: p.participants, end_client_ref: p.endClientRef, payment_terms: p.paymentTerms,
  lines: p.lines, invoices: p.invoices.map((i) => ({ id: i.id, number: i.invoiceNumber, status: i.status, amount: i.amount, total: i.total, currency: i.currency, due_date: i.dueDate, paid_at: i.paidAt })),
  issued_at: p.issuedAt, accepted_at: p.acceptedAt, accepted_by: p.acceptedByName, closed_at: p.closedAt, created_at: p.createdAt,
});

export const invoiceSelect = {
  id: true, invoiceNumber: true, status: true, amount: true, gstRate: true, gstAmount: true, taxType: true, cgstAmount: true, sgstAmount: true, igstAmount: true, total: true, currency: true, sacCode: true, placeOfSupply: true, poNumber: true, purchaseOrderId: true, workOrderId: true, issuedAt: true, dueDate: true, paidAt: true, paidReference: true, supplierName: true, trainerGstin: true, supplierPan: true, customerName: true, companyGstin: true, createdAt: true,
  trainer: { select: { id: true, slug: true, user: { select: { name: true } } } },
  lines: { select: { description: true, qty: true, unit: true, rate: true, amount: true }, orderBy: { position: "asc" } },
} satisfies Prisma.InvoiceSelect;
type Inv = Prisma.InvoiceGetPayload<{ select: typeof invoiceSelect }>;
export const shapeInvoice = (i: Inv) => ({
  id: i.id, number: i.invoiceNumber, status: i.status, work_order_id: i.workOrderId, purchase_order_id: i.purchaseOrderId, po_number: i.poNumber,
  supplier: { name: i.supplierName ?? i.trainer.user.name, gstin: i.trainerGstin, pan: i.supplierPan, trainer: { id: i.trainer.id, slug: i.trainer.slug, name: i.trainer.user.name } },
  customer: { name: i.customerName, gstin: i.companyGstin },
  currency: i.currency, subtotal: i.amount, gst_rate: i.gstRate, tax_type: i.taxType, cgst: i.cgstAmount, sgst: i.sgstAmount, igst: i.igstAmount, gst_amount: i.gstAmount, total: i.total, sac_code: i.sacCode, place_of_supply: i.placeOfSupply,
  lines: i.lines, issued_at: i.issuedAt, due_date: i.dueDate, paid_at: i.paidAt, paid_reference: i.paidReference, created_at: i.createdAt,
});
