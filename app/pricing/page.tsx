"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

const syne = "font-[family-name:var(--font-syne)]";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
  prefill: { name: string; email: string };
  theme: { color: string };
  modal: { ondismiss: () => void };
}

interface RazorpayInstance {
  open: () => void;
}

interface Sub {
  plan: string;
  active: boolean;
  expiresAt: string | null;
}

const plans = [
  {
    id: "FREE",
    name: "Explorer",
    price: "₹0",
    period: "/mo",
    desc: "Get started with basics",
    features: [
      "Browse 50+ company skill maps",
      "See live job openings",
      "1 domain + 3 company matches",
      "Basic AI chat (10 messages/day)",
      "Interview process overview",
    ],
    cta: "Current plan",
    disabled: true,
  },
  {
    id: "CAREER_READY",
    name: "Career Ready",
    price: "₹299",
    period: "/mo",
    desc: "Everything you need to get hired",
    features: [
      "Everything in Explorer",
      "Unlimited AI mentor conversations",
      "Full skill gap analysis",
      "Week-by-week prep roadmap",
      "Job alerts for your matches",
      "Progress tracking dashboard",
      "Priority support",
    ],
    cta: "Upgrade now",
    featured: true,
  },
  {
    id: "INSTITUTION",
    name: "College / Bootcamp",
    price: "Custom",
    period: "",
    desc: "For institutions and bulk access",
    features: [
      "Bulk student access",
      "Placement cell dashboard",
      "Batch progress analytics",
      "Custom company targeting",
      "Dedicated account manager",
      "White-label option",
    ],
    cta: "Contact us",
    href: "/forms/partner",
  },
];

export default function PricingPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [subscription, setSubscription] = useState<Sub | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    // Load Razorpay script
    if (document.getElementById("razorpay-script")) { setScriptLoaded(true); return; }
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);

    // Fetch current subscription
    if (session?.user) {
      fetch("/api/payments/history")
        .then((r) => r.json())
        .then((d) => { if (d.subscription) setSubscription(d.subscription); })
        .catch(() => {});
    }
  }, [session]);

  async function handlePurchase(planId: string) {
    if (!session?.user) { setMessage({ type: "error", text: "Please login first" }); return; }
    if (!scriptLoaded) { setMessage({ type: "error", text: "Payment system loading, please wait..." }); return; }

    setLoading(planId);
    setMessage(null);

    try {
      // Create order
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error });
        setLoading(null);
        return;
      }

      // Open Razorpay checkout
      const options: RazorpayOptions = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "SkillMap",
        description: "Career Ready Plan — Monthly",
        order_id: data.orderId,
        handler: async function (response) {
          // Verify payment
          const verifyRes = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          const verifyData = await verifyRes.json();

          if (verifyData.success) {
            setMessage({ type: "success", text: "Payment successful! Your Career Ready plan is now active." });
            setSubscription({ plan: "CAREER_READY", active: true, expiresAt: null });
          } else {
            setMessage({ type: "error", text: "Payment verification failed. Please contact support." });
          }
          setLoading(null);
        },
        prefill: {
          name: data.name || "",
          email: data.email || "",
        },
        theme: { color: "#6366f1" },
        modal: {
          ondismiss: () => setLoading(null),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch {
      setMessage({ type: "error", text: "Something went wrong. Please try again." });
      setLoading(null);
    }
  }

  const isSubscribed = subscription?.plan === "CAREER_READY" && subscription?.active;

  return (
    <div className="min-h-[calc(100vh-4rem)]" style={{ background: "var(--surface)" }}>
      {/* Header */}
      <section className="py-16 px-4 md:px-8 text-center" style={{ background: "var(--ink)" }}>
        <div className="max-w-3xl mx-auto">
          <div className="section-eyebrow justify-center" style={{ color: "var(--primary)" }}>Pricing</div>
          <h1 className={`${syne} font-extrabold text-3xl md:text-4xl text-white mb-3`}>
            Start Free. Upgrade When Ready.
          </h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
            No hidden fees. Cancel anytime. Your career investment starts at Rs.299/month.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="py-12 px-4 md:px-8 -mt-6">
        <div className="max-w-4xl mx-auto">
          {message && (
            <div className={`rounded-xl p-4 text-sm mb-6 text-center font-medium ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const isCurrentPlan = (isSubscribed && plan.id === "CAREER_READY") || (!isSubscribed && plan.id === "FREE");

              return (
                <div key={plan.id} className={`rounded-2xl p-8 border ${plan.featured ? "ring-2" : ""}`} style={{ background: "white", borderColor: plan.featured ? "var(--primary)" : "var(--border)", ...(plan.featured ? { boxShadow: "0 0 0 2px var(--primary-light)" } : {}) }}>
                  {plan.featured && (
                    <div className="text-[10px] font-bold text-center mb-3 px-2.5 py-1 rounded-full inline-block" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                      Most Popular
                    </div>
                  )}
                  <div className={`${syne} text-sm font-bold mb-1`} style={{ color: "var(--ink)" }}>{plan.name}</div>
                  <div className={`${syne} text-3xl font-extrabold mb-1`} style={{ color: "var(--primary)" }}>
                    {plan.price}<span className="text-sm font-normal" style={{ color: "var(--muted)" }}>{plan.period}</span>
                  </div>
                  <p className="text-xs mb-6" style={{ color: "var(--muted)" }}>{plan.desc}</p>

                  <ul className="space-y-2.5 mb-8 text-sm">
                    {plan.features.map((f) => (
                      <li key={f} className="flex gap-2 items-start text-xs" style={{ color: "var(--ink-light)" }}>
                        <span style={{ color: "var(--primary)" }}>✓</span>{f}
                      </li>
                    ))}
                  </ul>

                  {plan.href ? (
                    <Link href={plan.href} className="block w-full text-center btn-outline no-underline">
                      {plan.cta}
                    </Link>
                  ) : isCurrentPlan ? (
                    <div className="w-full text-center py-2.5 rounded-xl text-sm font-semibold" style={{ background: "rgba(16,185,129,0.1)", color: "var(--success)" }}>
                      ✓ Current plan
                    </div>
                  ) : plan.disabled ? (
                    <div className="w-full text-center py-2.5 rounded-xl text-sm font-medium" style={{ background: "var(--surface-alt)", color: "var(--muted)" }}>
                      Free forever
                    </div>
                  ) : (
                    <button
                      onClick={() => handlePurchase(plan.id)}
                      disabled={loading === plan.id}
                      className={`w-full btn-primary disabled:opacity-50`}
                    >
                      {loading === plan.id ? "Processing..." : plan.cta}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Payment info */}
          <div className="mt-8 text-center">
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              Secure payment powered by Razorpay · UPI, Cards, Net Banking accepted · Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Payment history */}
      {session?.user && (
        <section className="py-12 px-4 md:px-8 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="max-w-4xl mx-auto">
            <PaymentHistory />
          </div>
        </section>
      )}
    </div>
  );
}

function PaymentHistory() {
  const [payments, setPayments] = useState<{ id: string; amount: number; status: string; plan: string; createdAt: string; razorpayPaymentId: string | null }[]>([]);

  useEffect(() => {
    fetch("/api/payments/history")
      .then((r) => r.json())
      .then((d) => setPayments(d.payments || []))
      .catch(() => {});
  }, []);

  if (payments.length === 0) return null;

  const statusColors: Record<string, string> = {
    CREATED: "bg-yellow-100 text-yellow-700",
    CAPTURED: "bg-green-100 text-green-700",
    FAILED: "bg-red-100 text-red-700",
    REFUNDED: "bg-gray-100 text-gray-700",
  };

  return (
    <div>
      <h2 className={`${syne} font-bold text-lg mb-4`}>Payment History</h2>
      <div className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-xs font-medium" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 hidden sm:table-cell">Payment ID</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td className={`px-4 py-3 text-sm ${syne} font-bold`}>{p.plan.replace("_", " ")}</td>
                  <td className="px-4 py-3 text-sm font-medium">₹{(p.amount / 100).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[0.65rem] font-bold px-2 py-0.5 rounded-full ${statusColors[p.status] || ""}`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs hidden sm:table-cell" style={{ color: "var(--muted)" }}>{p.razorpayPaymentId || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
