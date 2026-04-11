"use client";

import Link from "next/link";

const syne = "font-[family-name:var(--font-syne)]";

const benefits = [
  { icon: "🎯", title: "Pre-assessed talent pool", desc: "Every candidate on SkillMap has a profile score, skill map, and verified certifications. You see who's ready — not just who applied." },
  { icon: "⚡", title: "Faster time to hire", desc: "No more sifting through 500 generic resumes. Our AI matches candidates to your exact requirements. See skill-match percentages instantly." },
  { icon: "🏆", title: "Hackathon-based hiring", desc: "Create custom coding challenges, quizzes, and hackathons. Let candidates prove their skills, not just talk about them. Hire from the leaderboard." },
  { icon: "📊", title: "Hiring analytics dashboard", desc: "Track your entire hiring funnel — applications, screening, interviews, offers. See which sources bring the best candidates and optimise." },
  { icon: "👥", title: "Multi-HR team management", desc: "Add unlimited HR team members. Track each HR's activity, job posts, and hiring performance. Reset passwords, manage access — all from one dashboard." },
  { icon: "🔒", title: "Verified company profiles", desc: "Only official company emails accepted. Every company is manually verified by our team. Candidates trust you because we've vetted you." },
];

const howItWorks = [
  { num: "01", title: "Register your company", desc: "Complete the company onboarding form with your official email. Our team verifies and activates your account within 2-3 days." },
  { num: "02", title: "Add your HR team", desc: "Create HR accounts from your company dashboard. Each HR gets a secure login with a generated password. No separate signup needed." },
  { num: "03", title: "Post jobs & create challenges", desc: "Your HRs post job openings with exact skill requirements. Create hackathons or quizzes to test candidates before interviews." },
  { num: "04", title: "Review matched candidates", desc: "See applications sorted by AI-calculated skill match scores. View full profiles, certifications, and project links. Move candidates through your pipeline." },
];

const plans = [
  { name: "Starter", price: "Free", period: "", features: ["Up to 3 job posts", "1 HR account", "Basic candidate search", "Application tracking", "Email support"], cta: "Get started free", href: "/forms/company-onboarding" },
  { name: "Growth", price: "₹4,999", period: "/mo", features: ["Unlimited job posts", "Up to 10 HR accounts", "Advanced candidate search", "Hackathon module", "Hiring analytics", "Priority support", "Custom company branding"], cta: "Start free trial", href: "/forms/company-onboarding", featured: true },
  { name: "Enterprise", price: "Custom", period: "", features: ["Unlimited everything", "Unlimited HR accounts", "Dedicated account manager", "API access", "White-label option", "Campus hiring tools", "Custom integrations"], cta: "Contact sales", href: "/forms/hire-from-us" },
];

const logos = [
  { name: "TCS", bg: "#00b9f2" }, { name: "Infosys", bg: "#007cc3" }, { name: "Wipro", bg: "#9b59b6" },
  { name: "KPMG", bg: "#00338d" }, { name: "Deloitte", bg: "#86bc25" }, { name: "Google", bg: "#4285f4" },
];

export default function ForCompaniesPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden py-24 md:py-32 px-6 md:px-12" style={{ background: "var(--ink)" }}>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] opacity-10" style={{ background: "var(--accent)" }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-[100px] opacity-10" style={{ background: "#47c8ff" }} />
        <div className="relative max-w-[1100px] mx-auto">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-xs font-bold tracking-[0.1em] uppercase ${syne}`} style={{ background: "rgba(232,255,71,0.1)", color: "var(--accent)", border: "1px solid rgba(232,255,71,0.2)" }}>
            <span className="text-base">🏢</span> For Companies & HR Teams
          </div>
          <h1 className={`${syne} font-extrabold text-white leading-[1] tracking-[-0.03em] mb-6`} style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}>
            Stop hiring blind.<br />
            <span style={{ color: "var(--accent)" }}>Start hiring smart.</span>
          </h1>
          <p className="text-lg font-light max-w-[560px] leading-[1.7] mb-10" style={{ color: "rgba(255,255,255,0.5)" }}>
            Access a pool of pre-assessed, skill-mapped graduates who are genuinely ready for your roles. No more resume roulette.
          </p>
          <div className="flex gap-4 flex-wrap">
            <Link href="/forms/company-onboarding" className={`inline-flex items-center gap-2 px-8 py-4 rounded-2xl ${syne} font-bold text-base no-underline transition-transform hover:-translate-y-0.5`} style={{ background: "var(--accent)", color: "var(--ink)" }}>
              Register your company →
            </Link>
            <Link href="/forms/hire-from-us" className={`inline-flex items-center gap-2 px-8 py-4 rounded-2xl ${syne} font-semibold text-base no-underline border-[1.5px] transition-colors hover:border-[var(--accent)]`} style={{ borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)" }}>
              Hire from us
            </Link>
          </div>
        </div>
      </section>

      {/* Trusted by */}
      <section className="py-10 px-6 border-b" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="max-w-[900px] mx-auto flex flex-wrap items-center justify-center gap-6">
          <span className="text-xs font-medium uppercase tracking-wider mr-4" style={{ color: "var(--muted)" }}>Companies on SkillMap</span>
          {logos.map((l) => (
            <div key={l.name} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${syne}`} style={{ borderColor: "var(--border)" }}>
              <div className="w-6 h-6 rounded flex items-center justify-center text-[0.5rem] font-bold text-white" style={{ background: l.bg }}>{l.name.charAt(0)}</div>
              <span className="text-xs font-bold">{l.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 px-6 md:px-12" style={{ background: "var(--surface)" }}>
        <div className="max-w-[1100px] mx-auto">
          <span className={`${syne} text-[0.7rem] font-bold tracking-[0.15em] uppercase block mb-4`} style={{ color: "var(--muted)" }}>Why SkillMap</span>
          <h2 className={`${syne} font-extrabold tracking-[-0.02em] mb-12`} style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            Hiring shouldn&apos;t feel<br />like finding a needle in a haystack.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b) => (
              <div key={b.title} className="rounded-2xl border bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-lg" style={{ borderColor: "var(--border)" }}>
                <div className="text-3xl mb-4">{b.icon}</div>
                <h3 className={`${syne} font-bold text-base mb-2`}>{b.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 md:px-12 bg-white">
        <div className="max-w-[1100px] mx-auto">
          <span className={`${syne} text-[0.7rem] font-bold tracking-[0.15em] uppercase block mb-4`} style={{ color: "var(--muted)" }}>How it works</span>
          <h2 className={`${syne} font-extrabold tracking-[-0.02em] mb-12`} style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            Live in 4 steps.<br />Hiring in days.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((s) => (
              <div key={s.num} className="relative">
                <div className={`${syne} text-5xl font-extrabold mb-4 opacity-[0.06]`}>{s.num}</div>
                <h3 className={`${syne} font-bold text-base mb-2`}>{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6 md:px-12" style={{ background: "var(--ink)", color: "white" }}>
        <div className="max-w-[1100px] mx-auto">
          <span className={`${syne} text-[0.7rem] font-bold tracking-[0.15em] uppercase block mb-4`} style={{ color: "var(--accent)" }}>Pricing</span>
          <h2 className={`${syne} font-extrabold tracking-[-0.02em] mb-12`} style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            Plans that scale<br />with your hiring.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[900px]">
            {plans.map((p) => (
              <div key={p.name} className={`rounded-2xl p-8 border ${p.featured ? "" : ""}`} style={{ background: p.featured ? "var(--accent)" : "rgba(255,255,255,0.05)", borderColor: p.featured ? "var(--accent)" : "rgba(255,255,255,0.1)", color: p.featured ? "var(--ink)" : "white" }}>
                <div className={`${syne} text-xs font-bold tracking-[0.1em] uppercase mb-6`} style={{ opacity: 0.5 }}>{p.name}</div>
                <div className={`${syne} text-4xl font-extrabold mb-1`}>{p.price}<span className="text-sm font-normal opacity-50">{p.period}</span></div>
                <ul className="mt-6 mb-8 space-y-2.5 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2 items-start opacity-80"><span className="opacity-50 shrink-0">→</span>{f}</li>
                  ))}
                </ul>
                <Link href={p.href} className={`block w-full text-center py-3.5 rounded-xl ${syne} font-bold text-sm no-underline transition-transform hover:-translate-y-0.5`} style={{ background: p.featured ? "var(--ink)" : "rgba(255,255,255,0.1)", color: p.featured ? "var(--accent)" : "white" }}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 md:px-12 text-center" style={{ background: "var(--ink2)" }}>
        <div className="max-w-[600px] mx-auto relative">
          <div className="absolute w-[400px] h-[400px] rounded-full blur-[100px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10" style={{ background: "var(--accent)" }} />
          <h2 className={`relative ${syne} font-extrabold text-white tracking-[-0.03em] mb-4`} style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
            Ready to hire <span style={{ color: "var(--accent)" }}>smarter</span>?
          </h2>
          <p className="relative text-base mb-8" style={{ color: "rgba(255,255,255,0.5)" }}>Register your company and start receiving matched applications today.</p>
          <Link href="/forms/company-onboarding" className={`relative inline-flex items-center gap-2 px-8 py-4 rounded-2xl ${syne} font-bold text-base no-underline cta-btn-main`} style={{ background: "var(--accent)", color: "var(--ink)" }}>
            Get started →
          </Link>
        </div>
      </section>
    </div>
  );
}
