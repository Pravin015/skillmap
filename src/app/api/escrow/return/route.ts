import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fetchRazorpayPaymentLink, razorpayConfigured } from "@/lib/billing";
import { notify } from "@/lib/notify";

/** Razorpay payment-link callback. The link status is re-fetched from Razorpay (never trusted from the query string). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id") ?? "";
  const esc = await db.escrowDeposit.findUnique({ where: { id }, include: { workOrder: { select: { requirementId: true, title: true } }, trainer: { select: { userId: true } }, company: { select: { name: true } } } });
  if (!esc) return NextResponse.redirect(new URL("/dashboard", url.origin));
  if (esc.status === "PENDING" && esc.providerRef && razorpayConfigured()) {
    try {
      const link = await fetchRazorpayPaymentLink(esc.providerRef);
      if (link.status === "paid") {
        await db.escrowDeposit.update({ where: { id }, data: { status: "FUNDED", fundedAt: new Date() } });
        await notify(esc.trainer.userId, "workorder", "Payment secured in escrow", `${esc.company.name} deposited ${esc.currency} ${esc.amount.toLocaleString("en-IN")} for ${esc.workOrder.title}.`, `/requirements/${esc.workOrder.requirementId}/work-order`);
      }
    } catch (e) {
      console.error("[escrow/return]", (e as Error).message);
    }
  }
  return NextResponse.redirect(new URL(`/requirements/${esc.workOrder.requirementId}/work-order?escrow=1`, url.origin));
}
