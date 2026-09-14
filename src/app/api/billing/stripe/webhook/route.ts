import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { planByCode } from "@/lib/billing";
import { mapStripeStatus, verifyStripeSignature } from "@/lib/stripe";
import { notify } from "@/lib/notify";

type Event = { id: string; type: string; data: { object: Record<string, unknown> } };

/** Register https://<domain>/api/billing/stripe/webhook for checkout.session.completed, invoice.paid, invoice.payment_failed, customer.subscription.updated, customer.subscription.deleted. */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyStripeSignature(raw, req.headers.get("stripe-signature"))) return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  let event: Event;
  try { event = JSON.parse(raw) as Event; } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }); }
  if (await db.webhookEvent.findUnique({ where: { eventId: event.id } })) return NextResponse.json({ ok: true, duplicate: true });
  await db.webhookEvent.create({ data: { eventId: event.id, type: `stripe:${event.type}`, payload: event as object } });

  const o = event.data.object as { id: string; subscription?: string; customer?: string; status?: string; current_period_end?: number; cancel_at_period_end?: boolean; amount_paid?: number; currency?: string; metadata?: Record<string, string>; payment_intent?: string };
  const subId = event.type.startsWith("customer.subscription") ? o.id : o.subscription;
  const sub = subId ? await db.subscription.findFirst({ where: { OR: [{ stripeSubscriptionId: subId }, ...(o.metadata?.localId ? [{ id: o.metadata.localId }] : [])] }, include: { company: { include: { members: { select: { userId: true } } } } } }) : null;
  if (!sub) return NextResponse.json({ ok: true, unknown: true });
  const recipients = sub.userId ? [sub.userId] : sub.company?.members.map((m) => m.userId) ?? [];
  const planName = planByCode(sub.plan).name;

  switch (event.type) {
    case "checkout.session.completed":
      await db.subscription.update({ where: { id: sub.id }, data: { stripeSubscriptionId: o.subscription ?? sub.stripeSubscriptionId, stripeCustomerId: o.customer ?? sub.stripeCustomerId, status: "ACTIVE" } });
      await notify(recipients, "billing", `${planName} is active`, "Thank you. Your plan benefits are switched on.", "/settings/billing");
      break;
    case "invoice.paid":
      await db.payment.upsert({ where: { razorpayPaymentId: `stripe_${o.id}` }, create: { subscriptionId: sub.id, razorpayPaymentId: `stripe_${o.id}`, amount: o.amount_paid ?? sub.amount, currency: (o.currency ?? "usd").toUpperCase(), status: "captured", method: "card" }, update: { status: "captured" } });
      await db.subscription.update({ where: { id: sub.id }, data: { status: "ACTIVE" } });
      break;
    case "invoice.payment_failed":
      await db.subscription.update({ where: { id: sub.id }, data: { status: "PENDING" } });
      await notify(recipients, "billing", `Payment problem on ${planName}`, "A renewal charge failed. Update your card to keep your benefits.", "/settings/billing");
      break;
    case "customer.subscription.updated":
      await db.subscription.update({ where: { id: sub.id }, data: { status: mapStripeStatus(o.status ?? "active"), currentPeriodEnd: o.current_period_end ? new Date(o.current_period_end * 1000) : sub.currentPeriodEnd, cancelAtPeriodEnd: !!o.cancel_at_period_end } });
      break;
    case "customer.subscription.deleted":
      await db.subscription.update({ where: { id: sub.id }, data: { status: "CANCELLED", cancelAtPeriodEnd: false } });
      await notify(recipients, "billing", `${planName} has ended`, "Your account is back on the free plan.", "/pricing");
      break;
  }
  return NextResponse.json({ ok: true });
}
