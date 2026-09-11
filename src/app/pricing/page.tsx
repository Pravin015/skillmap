import Link from "next/link";
import { Check } from "lucide-react";
import type { BillingInterval } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { activeSubscription, inr, PLANS, razorpayConfigured, simulatorEnabled } from "@/lib/billing";
import { simulateCheckout } from "@/lib/actions/billing";
import { CheckoutButton } from "@/components/checkout-button";
import { ActionForm, SubmitButton } from "@/components/form-bits";
import { Alert, Badge, ButtonLink, PageHeader } from "@/components/ui";
import { cn } from "@/lib/utils";

export const metadata = { title: "Pricing" };

export default async function PricingPage({ searchParams }: { searchParams: Promise<{ interval?: string }> }) {
  const { interval: iv } = await searchParams;
  const interval: BillingInterval = iv === "yearly" ? "YEARLY" : "MONTHLY";
  const user = await getCurrentUser();
  const current = await activeSubscription(user);
  const live = razorpayConfigured();
  const sim = simulatorEnabled();
  const isOwner = user?.membership?.role === "OWNER";

  return (
    <div>
      <PageHeader eyebrow="Plans" title="Simple plans. No commission." body="Start free. Upgrade when the platform is earning you batches or saving your team time. Prices in INR, GST extra, cancel any time." />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-line bg-white p-0.5 text-sm">
          <Link href="/pricing" className={cn("rounded-md px-3 py-1.5 font-medium", interval === "MONTHLY" ? "bg-navy text-white" : "text-muted hover:text-ink")}>Monthly</Link>
          <Link href="/pricing?interval=yearly" className={cn("rounded-md px-3 py-1.5 font-medium", interval === "YEARLY" ? "bg-navy text-white" : "text-muted hover:text-ink")}>Yearly <span className={interval === "YEARLY" ? "text-white/70" : "text-lime"}>· 2 months free</span></Link>
        </div>
        {!live ? <Badge tone="amber">{sim ? "Payments in simulator mode" : "Payments not configured"}</Badge> : null}
      </div>
      {!live && sim ? <div className="mb-6"><Alert tone="amber">Razorpay keys are not set, so the buttons below simulate a purchase without charging anything. Add <span className="font-mono">RAZORPAY_KEY_ID</span> and <span className="font-mono">RAZORPAY_KEY_SECRET</span> to switch to real Checkout.</Alert></div> : null}

      <div className="grid gap-4 lg:grid-cols-4">
        <PlanCard name={user?.role === "COMPANY" ? "Company Starter" : "Free"} price="₹0" period="forever" tagline={user?.role === "COMPANY" ? "Post your first requirements." : "Build your profile and start applying."}
          features={user?.role === "COMPANY" ? ["2 open requirements at a time", "Browse the full directory", "Message trainers who applied", "2 team members"] : ["Full profile and verification", "5 applications a month", "Public comments and connections", "Rates visible to companies only"]}
          footer={<ButtonLink href={user ? "/dashboard" : "/signup"} variant="secondary" className="w-full">{user ? "Included" : "Get started"}</ButtonLink>} muted />
        {PLANS.map((p) => {
          const price = interval === "YEARLY" ? p.yearly : p.monthly;
          const isCurrent = current?.plan === p.code;
          const canBuy = !!user && (p.audience === "TRAINER" ? user.role === "TRAINER" : isOwner);
          const audienceNote = p.audience === "TRAINER" ? "For trainer accounts" : "For company owners";
          let footer: React.ReactNode;
          if (isCurrent) footer = <ButtonLink href="/settings/billing" variant="outline" className="w-full">Current plan · manage</ButtonLink>;
          else if (!user) footer = <ButtonLink href={`/signup${p.audience === "COMPANY" ? "?as=company" : ""}`} variant={p.audience === "COMPANY" ? "violet" : "primary"} className="w-full">Sign up to subscribe</ButtonLink>;
          else if (!canBuy) footer = <p className="text-center text-xs text-muted">{p.audience === "TRAINER" ? "Available on trainer accounts" : user.membership ? "Ask your company owner to upgrade" : "Available on company accounts"}</p>;
          else if (current) footer = <p className="text-center text-xs text-muted">Cancel {current.plan.replace("_", " ").toLowerCase()} first to switch</p>;
          else if (live) footer = <CheckoutButton plan={p.code} interval={interval} label={`Subscribe · ${inr(price)}`} variant={p.audience === "COMPANY" ? "violet" : "primary"} />;
          else if (sim) footer = <ActionForm action={simulateCheckout}><input type="hidden" name="plan" value={p.code} /><input type="hidden" name="interval" value={interval} /><SubmitButton className="w-full" variant={p.audience === "COMPANY" ? "violet" : "primary"} pendingText="Activating…">Simulate subscribe · {inr(price)}</SubmitButton></ActionForm>;
          else footer = <p className="text-center text-xs text-muted">Payments coming soon</p>;
          return <PlanCard key={p.code} name={p.name} price={inr(price)} period={interval === "YEARLY" ? "per year" : "per month"} tagline={p.tagline} features={p.features} footer={footer} highlight={p.code === "COMPANY_GROWTH"} badge={isCurrent ? "current" : audienceNote} tone={p.audience === "COMPANY" ? "violet" : "cyan"} />;
        })}
      </div>

      <section className="mt-12 grid gap-6 rounded-2xl border border-line bg-white p-6 md:grid-cols-3 md:p-8">
        <div><h3 className="font-display font-semibold">Billing</h3><p className="mt-1 text-sm text-muted">Card, UPI and net banking through Razorpay. Subscriptions renew automatically; you get an email before each charge.</p></div>
        <div><h3 className="font-display font-semibold">Cancelling</h3><p className="mt-1 text-sm text-muted">Cancel from Settings any time. Benefits stay until the end of the paid period, then the account returns to the free plan. No refunds for partial periods.</p></div>
        <div><h3 className="font-display font-semibold">Invoices and GST</h3><p className="mt-1 text-sm text-muted">Every charge appears in your billing history with the Razorpay payment reference. Add your GSTIN to the company page for tax invoices.</p></div>
      </section>
    </div>
  );
}

function PlanCard({ name, price, period, tagline, features, footer, highlight, muted, badge, tone = "cyan" }: { name: string; price: string; period: string; tagline: string; features: string[]; footer: React.ReactNode; highlight?: boolean; muted?: boolean; badge?: string; tone?: "cyan" | "violet" }) {
  return (
    <div className={cn("flex flex-col rounded-2xl border bg-white p-6", highlight ? "border-violet shadow-[0_8px_30px_rgba(75,63,158,0.12)]" : "border-line", muted && "bg-surface-2/60")}>
      <div className="flex items-start justify-between gap-2">
        <h2 className="font-display text-lg font-bold">{name}</h2>
        {badge ? <Badge tone={badge === "current" ? "lime" : tone}>{badge}</Badge> : null}
      </div>
      <p className="mt-1 min-h-10 text-sm text-muted">{tagline}</p>
      <p className="mt-4 font-display text-3xl font-bold tabular-nums">{price} <span className="text-sm font-medium text-muted">{period}</span></p>
      <ul className="mt-5 flex-1 space-y-2 text-sm">
        {features.map((f) => <li key={f} className="flex items-start gap-2"><Check size={16} className={cn("mt-0.5 shrink-0", tone === "violet" ? "text-violet" : "text-cyan")} />{f}</li>)}
      </ul>
      <div className="mt-6">{footer}</div>
    </div>
  );
}
