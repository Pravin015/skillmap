import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { appUrl } from "@/lib/oauth";
import { retrieveCheckoutSession, stripeConfigured } from "@/lib/stripe";

/** Stripe redirects here after Checkout. We confirm the session server-side; the webhook remains the source of truth for renewals. */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  const sessionId = new URL(req.url).searchParams.get("session_id");
  if (!user || !sessionId || !stripeConfigured()) return NextResponse.redirect(`${appUrl()}/settings/billing?error=stripe`);
  const local = await db.subscription.findFirst({ where: { stripeCheckoutId: sessionId } });
  if (!local) return NextResponse.redirect(`${appUrl()}/settings/billing?error=stripe`);
  try {
    const s = await retrieveCheckoutSession(sessionId);
    if (s.status === "complete" && s.subscription) {
      await db.subscription.update({ where: { id: local.id }, data: { stripeSubscriptionId: s.subscription, stripeCustomerId: s.customer ?? undefined, status: s.payment_status === "paid" ? "ACTIVE" : "AUTHENTICATED" } });
      return NextResponse.redirect(`${appUrl()}/settings/billing?success=1`);
    }
  } catch { /* fall through */ }
  return NextResponse.redirect(`${appUrl()}/settings/billing?error=stripe`);
}
