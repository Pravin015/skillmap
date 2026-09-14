import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mapRazorpayStatus, planByCode, verifyWebhookSignature } from "@/lib/billing";
import { notify } from "@/lib/notify";

type SubEntity = { id: string; status: string; current_end?: number | null; plan_id?: string; customer_id?: string };
type PayEntity = { id: string; amount: number; currency: string; status: string; method?: string; invoice_id?: string };
type LinkEntity = { id: string; status: string; reference_id?: string };
type PayoutEntity = { id: string; status: string; utr?: string | null; reference_id?: string | null; failure_reason?: string | null };
type Event = { event: string; payload?: { subscription?: { entity: SubEntity }; payment?: { entity: PayEntity }; payment_link?: { entity: LinkEntity }; payout?: { entity: PayoutEntity } } };

/** Razorpay → CorpGurus. Register this URL in the Razorpay dashboard with the subscription.* and payment.captured events. */
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhookSignature(raw, signature)) return NextResponse.json({ error: "invalid signature" }, { status: 400 });

  const eventId = req.headers.get("x-razorpay-event-id") ?? `${Date.now()}-${Math.random()}`;
  let event: Event;
  try { event = JSON.parse(raw) as Event; } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }); }

  // Idempotent: Razorpay retries deliveries.
  if (await db.webhookEvent.findUnique({ where: { eventId } })) return NextResponse.json({ ok: true, duplicate: true });
  await db.webhookEvent.create({ data: { eventId, type: event.event, payload: event as object } });

  const payout = event.payload?.payout?.entity;
  if (event.event.startsWith("payout.") && payout?.id) {
    const esc = await db.escrowDeposit.findFirst({ where: { OR: [{ payoutId: payout.id }, { id: payout.reference_id ?? "" }] }, include: { trainer: { select: { userId: true } }, workOrder: { select: { title: true, requirementId: true } } } });
    if (esc) {
      if (event.event === "payout.processed") {
        await db.escrowDeposit.update({ where: { id: esc.id }, data: { status: "PAID_OUT", paidOutAt: new Date(), payoutRef: payout.utr ?? esc.payoutRef, payoutId: payout.id } });
        await notify(esc.trainer.userId, "invoice", "Payout sent", `${esc.currency} ${(esc.amount - esc.fee).toLocaleString("en-IN")} for ${esc.workOrder.title}${payout.utr ? ` · UTR ${payout.utr}` : ""}.`, `/requirements/${esc.workOrder.requirementId}/work-order`);
      } else if (event.event === "payout.failed" || event.event === "payout.reversed") {
        await db.escrowDeposit.update({ where: { id: esc.id }, data: { status: "RELEASED", payoutId: null, note: `Payout ${event.event.split(".")[1]}: ${payout.failure_reason ?? "see RazorpayX"}` } });
        const staff = await db.user.findMany({ where: { role: { in: ["SUPER_ADMIN", "FINANCE", "ADMIN"] } }, select: { id: true } });
        await notify(staff.map((s) => s.id), "moderation", "Escrow payout failed", `${esc.workOrder.title}: ${payout.failure_reason ?? event.event}. Pay out manually from /admin/escrow.`, "/admin/escrow");
      }
    }
    return NextResponse.json({ ok: true, payout: !!esc });
  }

  const linkEntity = event.payload?.payment_link?.entity;
  if (event.event === "payment_link.paid" && linkEntity?.id) {
    const esc = await db.escrowDeposit.findFirst({ where: { OR: [{ providerRef: linkEntity.id }, { id: linkEntity.reference_id ?? "" }], status: "PENDING" }, include: { workOrder: { select: { requirementId: true, title: true } }, trainer: { select: { userId: true } }, company: { select: { name: true } } } });
    if (esc) {
      await db.escrowDeposit.update({ where: { id: esc.id }, data: { status: "FUNDED", fundedAt: new Date(), providerRef: linkEntity.id } });
      await notify(esc.trainer.userId, "workorder", "Payment secured in escrow", `${esc.company.name} deposited ${esc.currency} ${esc.amount.toLocaleString("en-IN")} for ${esc.workOrder.title}.`, `/requirements/${esc.workOrder.requirementId}/work-order`);
    }
    return NextResponse.json({ ok: true, escrow: !!esc });
  }

  const subEntity = event.payload?.subscription?.entity;
  const payEntity = event.payload?.payment?.entity;
  if (!subEntity?.id) return NextResponse.json({ ok: true, ignored: true });

  const sub = await db.subscription.findUnique({ where: { razorpaySubscriptionId: subEntity.id }, include: { user: { select: { id: true } }, company: { include: { members: { where: { role: "OWNER" }, select: { userId: true } } } } } });
  if (!sub) return NextResponse.json({ ok: true, unknown: true });

  const status = mapRazorpayStatus(subEntity.status);
  const recipients = sub.userId ? [sub.userId] : sub.company?.members.map((m) => m.userId) ?? [];
  const planName = planByCode(sub.plan).name;

  await db.subscription.update({
    where: { id: sub.id },
    data: {
      status,
      razorpayPlanId: subEntity.plan_id ?? sub.razorpayPlanId,
      razorpayCustomerId: subEntity.customer_id ?? sub.razorpayCustomerId,
      currentPeriodEnd: subEntity.current_end ? new Date(subEntity.current_end * 1000) : sub.currentPeriodEnd,
      cancelAtPeriodEnd: status === "CANCELLED" ? false : sub.cancelAtPeriodEnd,
    },
  });

  if (payEntity?.id && (event.event === "subscription.charged" || event.event === "payment.captured")) {
    await db.payment.upsert({
      where: { razorpayPaymentId: payEntity.id },
      create: { subscriptionId: sub.id, razorpayPaymentId: payEntity.id, amount: payEntity.amount, currency: payEntity.currency, status: payEntity.status, method: payEntity.method, invoiceId: payEntity.invoice_id },
      update: { status: payEntity.status, method: payEntity.method, invoiceId: payEntity.invoice_id },
    });
  }

  switch (event.event) {
    case "subscription.activated":
      await notify(recipients, "billing", `${planName} is active`, "Thank you. Your plan benefits are switched on.", "/settings/billing"); break;
    case "subscription.charged":
      await notify(recipients, "billing", `${planName} renewed`, `Payment of ₹${((payEntity?.amount ?? sub.amount) / 100).toLocaleString("en-IN")} received.`, "/settings/billing"); break;
    case "subscription.pending":
    case "subscription.halted":
      await notify(recipients, "billing", `Payment problem on ${planName}`, "A renewal charge failed. Update your card in Razorpay to keep your benefits.", "/settings/billing"); break;
    case "subscription.cancelled":
    case "subscription.completed":
    case "subscription.expired":
      await notify(recipients, "billing", `${planName} has ended`, "Your account is back on the free plan.", "/pricing"); break;
  }
  return NextResponse.json({ ok: true });
}
