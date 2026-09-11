"use client";

import { useRef, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import type { BillingInterval, PlanCode } from "@prisma/client";
import { confirmCheckout, startCheckout } from "@/lib/actions/billing";
import { Button } from "./ui";

declare global {
  interface Window { Razorpay?: new (opts: Record<string, unknown>) => { open: () => void; on: (ev: string, cb: (r: unknown) => void) => void } }
}

function loadCheckoutJs() {
  return new Promise<void>((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Could not load Razorpay Checkout. Check your connection and try again."));
    document.head.appendChild(s);
  });
}

/** Opens Razorpay Checkout for a subscription. On success it submits the payment proof to confirmCheckout. */
export function CheckoutButton({ plan, interval, label, variant = "primary" }: { plan: PlanCode; interval: BillingInterval; label: string; variant?: "primary" | "violet" | "secondary" }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [proof, setProof] = useState<{ p: string; s: string; sig: string } | null>(null);

  const run = () => start(async () => {
    setError(null);
    const session = await startCheckout(plan, interval);
    if ("error" in session) { setError(session.error); return; }
    try { await loadCheckoutJs(); } catch (e) { setError((e as Error).message); return; }
    const rz = new window.Razorpay!({
      key: session.keyId, subscription_id: session.subscriptionId, name: session.name, description: session.description,
      prefill: session.prefill, theme: { color: "#0f4c9a" },
      handler: (r: { razorpay_payment_id: string; razorpay_subscription_id: string; razorpay_signature: string }) => {
        setProof({ p: r.razorpay_payment_id, s: r.razorpay_subscription_id, sig: r.razorpay_signature });
        queueMicrotask(() => formRef.current?.requestSubmit());
      },
      modal: { ondismiss: () => setError("Checkout closed before payment. Nothing was charged.") },
    });
    rz.on("payment.failed", (r: unknown) => setError((r as { error?: { description?: string } }).error?.description ?? "Payment failed."));
    rz.open();
  });

  return (
    <div>
      <Button type="button" variant={variant} className="w-full" onClick={run} disabled={pending}>{pending ? <Loader2 size={15} className="animate-spin" /> : null}{label}</Button>
      {error ? <p className="mt-2 text-xs text-rose">{error}</p> : null}
      <form ref={formRef} action={confirmCheckout} className="hidden">
        <input type="hidden" name="razorpay_payment_id" value={proof?.p ?? ""} />
        <input type="hidden" name="razorpay_subscription_id" value={proof?.s ?? ""} />
        <input type="hidden" name="razorpay_signature" value={proof?.sig ?? ""} />
      </form>
    </div>
  );
}
