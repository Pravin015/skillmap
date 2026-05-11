"use client";
// /contact — hero + 3 contact cards + form, all in Prakae light theme.
import { useState } from "react";
import PageHero from "@/components/page/PageHero";
import Section from "@/components/page/Section";
import DarkCTA from "@/components/page/DarkCTA";

const channels = [
  {
    title: "Talk to sales",
    body: "Hiring 50+ from a single college? Bulk plans, custom workflows, and dedicated onboarding.",
    href: "mailto:sales@astraahire.com",
    cta: "sales@astraahire.com",
    icon: "💼",
    accent: "linear-gradient(135deg, #DDD6FE, #FBCFE8)",
  },
  {
    title: "Get product help",
    body: "Issues with your account, payment, or platform features. We respond within 4 working hours.",
    href: "mailto:support@astraahire.com",
    cta: "support@astraahire.com",
    icon: "🛟",
    accent: "linear-gradient(135deg, #FED7AA, #FBCFE8)",
  },
  {
    title: "Become a mentor",
    body: "Industry professionals — share your experience, earn on your terms, and shape the next generation.",
    href: "/for-mentors",
    cta: "Apply to mentor",
    icon: "🧑‍🏫",
    accent: "linear-gradient(135deg, #BBF7D0, #DDD6FE)",
  },
];

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("General");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !message) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/forms/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "CONTACT",
          name,
          email,
          notes: `Topic: ${topic}\n\n${message}`,
        }),
      });
      if (res.ok) {
        setStatus("sent");
        setName(""); setEmail(""); setMessage("");
      } else setStatus("error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--surface)" }}>
      <PageHero
        eyebrow="Contact"
        title={<>Talk to a real human at<br />AstraaHire</>}
        subtitle="Sales questions, partner deals, product help, mentor applications — pick the right inbox below or use the form. We reply within 4 working hours."
      />

      {/* Channel cards */}
      <Section className="!py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {channels.map((c) => (
            <a key={c.title} href={c.href} className="card text-left no-underline flex flex-col">
              <div className="rounded-2xl mb-5 h-28 flex items-center justify-center text-3xl" style={{ background: c.accent }}>
                {c.icon}
              </div>
              <h3 className="font-semibold text-base mb-1.5" style={{ color: "var(--ink)" }}>{c.title}</h3>
              <p className="text-xs leading-relaxed mb-4 flex-1" style={{ color: "var(--muted)" }}>{c.body}</p>
              <span className="text-xs font-semibold" style={{ color: "var(--primary)" }}>{c.cta} →</span>
            </a>
          ))}
        </div>
      </Section>

      {/* Form */}
      <Section
        eyebrow="Send a message"
        title="Or write to us directly"
        subtitle="Drop a few details. We'll route it to the right person."
      >
        <form onSubmit={handleSubmit} className="card max-w-2xl mx-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--ink)" }}>Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none" style={{ borderColor: "var(--border)" }} placeholder="Your full name" />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--ink)" }}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none" style={{ borderColor: "var(--border)" }} placeholder="you@example.com" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--ink)" }}>Topic</label>
            <select value={topic} onChange={(e) => setTopic(e.target.value)} className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none" style={{ borderColor: "var(--border)" }}>
              <option>General</option>
              <option>Sales</option>
              <option>Product Help</option>
              <option>Partnership</option>
              <option>Press</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--ink)" }}>Message</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} required rows={5} className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none resize-none" style={{ borderColor: "var(--border)" }} placeholder="Tell us a bit about what you need…" />
          </div>

          {status === "sent" && (
            <div className="rounded-xl p-3 text-sm" style={{ background: "rgba(34,197,94,0.1)", color: "#16a34a" }}>
              ✓ Got it — we&apos;ll be in touch shortly.
            </div>
          )}
          {status === "error" && (
            <div className="rounded-xl p-3 text-sm" style={{ background: "rgba(239,68,68,0.1)", color: "#dc2626" }}>
              Something broke. Email us directly at support@astraahire.com.
            </div>
          )}

          <button type="submit" disabled={status === "sending"} className="btn-primary w-full justify-center">
            {status === "sending" ? "Sending…" : "Send message"}
          </button>
        </form>
      </Section>

      <DarkCTA
        title={<>Big plans? Let&apos;s talk.</>}
        body="If you're a college, company, or institution looking to onboard cohorts of students — book a demo."
        primaryCta={{ label: "Book a demo", href: "/forms?type=hire" }}
        secondaryCta={{ label: "See pricing", href: "/pricing" }}
      />
    </div>
  );
}
