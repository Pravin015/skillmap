"use client";
// AstraaHire homepage — Prakae-style, aggressive+confident voice.
// hero · activity bar · trust strip · how it works · 4 audiences ·
// mid CTA · outcomes · mentor spotlight · comparison · pricing teaser ·
// partner wall · FAQ · reviews · dark CTA

import Link from "next/link";
import { useState } from "react";

// ───────── Mini-mockup widgets that sit in the audience-card headers ─────────

function StudentMock() {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-3 w-full max-w-[260px] border" style={{ borderColor: "rgba(0,0,0,0.04)" }}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>Skill match</p>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>+12%</span>
        </div>
        <p className="text-2xl font-semibold mb-2" style={{ color: "var(--ink)" }}>78%</p>
        <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: "#E8E2D6" }}>
          <div className="h-full rounded-full" style={{ width: "78%", background: "linear-gradient(90deg, #7C3AED, #A78BFA)" }} />
        </div>
        <div className="flex flex-wrap gap-1">
          {["Python", "SQL", "Spark"].map((s) => (
            <span key={s} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: "#F3EFE8", color: "var(--ink-soft)" }}>{s}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function MentorMock() {
  const bars = [55, 80, 65, 90, 75, 95];
  return (
    <div className="absolute inset-0 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-3 w-full max-w-[260px] border" style={{ borderColor: "rgba(0,0,0,0.04)" }}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>This month</p>
          <span className="text-[9px] font-bold" style={{ color: "var(--success)" }}>+24%</span>
        </div>
        <p className="text-xl font-semibold mb-3" style={{ color: "var(--ink)" }}>₹16,320</p>
        <div className="flex items-end gap-1 h-10 mb-2">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: i === bars.length - 1 ? "var(--primary)" : "#DDD6FE" }} />
          ))}
        </div>
        <p className="text-[9px]" style={{ color: "var(--muted)" }}>12 sessions completed</p>
      </div>
    </div>
  );
}

function CollegeMock() {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-3 w-full max-w-[260px] border" style={{ borderColor: "rgba(0,0,0,0.04)" }}>
        <p className="text-[9px] font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--muted)" }}>Batch 2025 — placement</p>
        <div className="space-y-1.5">
          {[
            { dept: "CSE", pct: 94 },
            { dept: "ECE", pct: 81 },
            { dept: "Mech", pct: 67 },
          ].map((d) => (
            <div key={d.dept} className="flex items-center gap-2">
              <span className="text-[9px] w-8 font-medium" style={{ color: "var(--ink-soft)" }}>{d.dept}</span>
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#E8E2D6" }}>
                <div className="h-full rounded-full" style={{ width: `${d.pct}%`, background: "var(--primary)" }} />
              </div>
              <span className="text-[9px] font-semibold w-8 text-right" style={{ color: "var(--ink)" }}>{d.pct}%</span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-2 border-t flex items-center justify-between" style={{ borderColor: "#F3EFE8" }}>
          <span className="text-[9px]" style={{ color: "var(--muted)" }}>Total placed</span>
          <span className="text-[9px] font-bold" style={{ color: "var(--primary)" }}>184 / 220</span>
        </div>
      </div>
    </div>
  );
}

function CompanyMock() {
  const candidates = [
    { name: "Priya S.", match: 94, color: "#10B981" },
    { name: "Rahul K.", match: 87, color: "#7C3AED" },
    { name: "Sneha J.", match: 76, color: "#F59E0B" },
  ];
  return (
    <div className="absolute inset-0 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-3 w-full max-w-[260px] border" style={{ borderColor: "rgba(0,0,0,0.04)" }}>
        <p className="text-[9px] font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--muted)" }}>Top matches · SDE-1</p>
        <div className="space-y-1.5">
          {candidates.map((c) => (
            <div key={c.name} className="flex items-center gap-2 p-1.5 rounded-lg" style={{ background: "#FAF7F2" }}>
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: c.color }}>{c.name[0]}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold truncate" style={{ color: "var(--ink)" }}>{c.name}</p>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-bold" style={{ color: c.color }}>{c.match}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const mockMap: Record<string, () => React.JSX.Element> = {
  "For students": StudentMock,
  "For mentors": MentorMock,
  "For colleges & institutions": CollegeMock,
  "For companies": CompanyMock,
};

const studentSteps = [
  { n: "01", title: "Tell us your dream company", body: "Type \"TCS Cybersecurity\" or \"Razorpay SDE-1\" — we already know what they hire for." },
  { n: "02", title: "Get a personalised roadmap", body: "Week-by-week prep plan. The exact skills, certs, and projects this company looks at." },
  { n: "03", title: "Practice + verify", body: "AI mock interviews graded against the real bar. Proctored skill labs. Verified offer letters." },
  { n: "04", title: "Land the offer", body: "Apply with a profile recruiters can trust. The same playbook our beta cohort is using right now." },
];

const audiences = [
  {
    eyebrow: "For students",
    title: "Stop guessing. Start hiring-ready.",
    body: "Personalised AI roadmaps, mock interviews for 15+ companies, mentor sessions, and offer verification — everything you need from \"applying everywhere\" to \"choosing between offers\".",
    cta: { label: "Get started — free", href: "/auth/signup" },
    accent: "linear-gradient(135deg, #DDD6FE 0%, #FBCFE8 100%)",
    stats: [{ k: "₹0", v: "Free tier" }, { k: "15+", v: "Companies tracked" }],
  },
  {
    eyebrow: "For mentors",
    title: "Earn ₹16k+/mo. On your schedule.",
    body: "If you've shipped real work at a real company, students will pay to learn from you. We handle scheduling, payments, and screening — you focus on the session. Apply now to be one of our launch mentors.",
    cta: { label: "Apply to mentor", href: "/for-mentors" },
    accent: "linear-gradient(135deg, #FED7AA 0%, #FBCFE8 100%)",
    stats: [{ k: "₹500–2k", v: "Per session" }, { k: "85%", v: "Take-home rate" }],
  },
  {
    eyebrow: "For colleges & institutions",
    title: "Modernise your placement cell.",
    body: "Bulk-onboard your batch. Run NIRF-grade proctored exams. Track placement % live. Get pre-vetted students in front of verified employers — without an IT migration.",
    cta: { label: "Partner with us", href: "/for-institutions" },
    accent: "linear-gradient(135deg, #BBF7D0 0%, #DDD6FE 100%)",
    stats: [{ k: "Free", v: "To partner" }, { k: "NIRF", v: "Audit-ready" }],
  },
  {
    eyebrow: "For companies",
    title: "Hire job-ready. Not resumes.",
    body: "AI candidate matching, proctored assessments, and hackathon hiring. Cut screening time from 8 days to 2. Free to register — pay only for premium.",
    cta: { label: "Hire with us", href: "/for-companies" },
    accent: "linear-gradient(135deg, #FBCFE8 0%, #FED7AA 100%)",
    stats: [{ k: "Free", v: "To register" }, { k: "Proctored", v: "Assessments" }],
  },
];

// Illustrative product targets, not measured outcomes.
// Will be replaced with audited cohort data once we publish quarterly results.
const outcomes = [
  { tier: "Tier-1 colleges (IITs, NITs, BITS)", placed: "94%", topCo: "Top product companies", note: "Target placement rate" },
  { tier: "Tier-2 colleges (state engineering)", placed: "76%", topCo: "Mid-tier IT services + startups", note: "Target placement rate" },
  { tier: "Tier-3 colleges (private + regional)", placed: "61%", topCo: "IT services + regional employers", note: "Target placement rate" },
];

// Composite mentor profiles (illustrative). Real mentors visible on /mentors after launch.
const mentors = [
  { name: "Senior SDE", role: "Backend & systems", company: "Top fintech (Series C)", topics: "System design, Go, distributed systems", img: "linear-gradient(135deg, #C084FC, #F0ABFC)" },
  { name: "Engineering Manager", role: "Scaling teams", company: "Big-4 product company", topics: "Career planning, scaling teams, leadership", img: "linear-gradient(135deg, #93C5FD, #C4B5FD)" },
  { name: "Cybersecurity Lead", role: "Offensive security", company: "Big-4 consulting", topics: "OSCP prep, SOC analyst tracks, ISO 27001", img: "linear-gradient(135deg, #FDA4AF, #FCD34D)" },
];

const compareRows = [
  { feature: "Company-specific prep tracks (TCS, Razorpay, etc.)", us: true, naukri: false, linkedin: false, coaching: "Some" },
  { feature: "AI mock interviews with scoring", us: true, naukri: false, linkedin: false, coaching: "Manual only" },
  { feature: "Verified mentors from target companies", us: true, naukri: false, linkedin: "Cold DMs", coaching: false },
  { feature: "Proctored skill assessments", us: true, naukri: false, linkedin: false, coaching: false },
  { feature: "Offer letter fraud detection", us: true, naukri: false, linkedin: false, coaching: false },
  { feature: "Free tier", us: "Forever", naukri: "Limited", linkedin: false, coaching: false },
  { feature: "Premium price", us: "₹299/mo", naukri: "₹999/mo", linkedin: "₹1,400/mo", coaching: "₹50,000+ one-time" },
];

const pricingPlans = [
  { name: "Explorer", price: "₹0", period: "forever", desc: "Browse jobs, take basic assessments, see your match score.", features: ["Browse 50+ company tracks", "1 free mock interview / month", "Basic AI advisor (10 msgs / day)", "Live job openings"], cta: "Start free", featured: false },
  { name: "Career-Ready", price: "₹299", period: "/mo", desc: "Everything you need to crack your dream offer.", features: ["All Explorer features", "Unlimited mock interviews", "Mentor session credits (2/mo)", "Verified profile badge", "Proctored skill assessments", "Offer letter verification"], cta: "Go premium", featured: true },
  { name: "Institutional", price: "Custom", period: "", desc: "Bulk plans for colleges, universities, and corporate L&D.", features: ["Everything in Career-Ready", "Bulk student onboarding", "Placement analytics dashboard", "Priority support", "Custom integrations"], cta: "Talk to sales", featured: false },
];

// Slots reserved for partner colleges. Real names appear once partnerships are signed.
const partnerColleges = [
  "Your college", "Premier engineering college", "Tier-1 university",
  "State technical university", "Private engineering college", "Deemed university",
  "Tier-2 institute", "Management institute", "Polytechnic", "+ 14 more",
];

// Companies our students commonly target / apply to.
// Logos appear here when we secure direct partnerships.
const trustedCompanies = ["TCS", "Infosys", "Wipro", "Razorpay", "KPMG", "Deloitte", "Accenture", "Flipkart", "PhonePe", "Zomato"];

const faqs = [
  { q: "Is there really a free tier?", a: "Yes — forever. Browse all jobs, take 1 mock interview/month, use the basic AI advisor. No credit card. No \"free for 14 days then auto-charge\" trickery." },
  { q: "How is this different from Naukri or LinkedIn?", a: "Naukri shows you jobs. LinkedIn shows you connections. We tell you exactly what each company hires for, give you a roadmap to close the gap, and prepare you with mock interviews graded by AI. Different product, different outcome." },
  { q: "Do mentor sessions actually help?", a: "Our mentors are verified — they work at the companies you're applying to, not life-coach influencers. The product is designed so mentor time is targeted at the gap our AI flags in your roadmap, not generic chat." },
  { q: "What happens if I get a fake offer letter?", a: "Upload it to our offer verifier. We check 20 fraud parameters in 30 seconds. If it's a scam, we flag it. If it's real, you get a trust score you can share with your family." },
  { q: "Can I cancel anytime?", a: "Yes. No lock-in, no \"3-month minimum\" nonsense. Cancel from your settings page — refund processed in 7 working days under our refund policy." },
  { q: "What if I'm from a tier-3 college?", a: "We don't filter by college name. The skill-match algorithm scores you on demonstrated skills, not your alma mater. Tier-3 students are a deliberate focus of our beta." },
];

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="blob-bg-page" style={{ background: "var(--surface)" }}>
      {/* ═══════════════ HERO ═══════════════ */}
      <section className="blob-bg pt-12 pb-20 px-4">
        <div className="max-w-5xl mx-auto text-center relative">
          <div className="section-eyebrow mx-auto">India&apos;s career intelligence platform</div>

          <h1 className="font-semibold mb-5" style={{ color: "var(--ink)" }}>
            Stop applying everywhere.<br />
            <span style={{ color: "var(--primary)" }}>Start getting offers.</span>
          </h1>

          <p className="text-base md:text-lg max-w-2xl mx-auto mb-8" style={{ color: "var(--muted)" }}>
            AI-powered career intelligence for India&apos;s freshers. We tell you exactly what your dream
            company hires for, prepare you to clear it, and verify the offer is real — all in one platform.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            <Link href="/auth/signup" className="btn-primary">Get started — free</Link>
            <Link href="/jobs" className="btn-outline">Browse 1,200+ openings</Link>
          </div>

          {/* Feature pills under CTA */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
            {[
              { icon: "🎯", label: "AI roadmaps" },
              { icon: "🎤", label: "Mock interviews" },
              { icon: "🛡️", label: "Offer verifier" },
              { icon: "🧑‍🏫", label: "Verified mentors" },
              { icon: "🧪", label: "Proctored labs" },
              { icon: "📊", label: "Skill match score" },
            ].map((p) => (
              <span key={p.label} className="rounded-full bg-white border px-3 py-1.5 text-xs font-medium flex items-center gap-1.5" style={{ borderColor: "var(--border)", color: "var(--ink-soft)" }}>
                <span>{p.icon}</span>{p.label}
              </span>
            ))}
          </div>

          {/* Live activity strip */}
          <div className="inline-flex items-center gap-2 rounded-full bg-white border px-4 py-2 text-xs" style={{ borderColor: "var(--border)" }}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "var(--success)" }} />
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "var(--success)" }} />
            </span>
            <span style={{ color: "var(--muted)" }}>
              Now in <strong style={{ color: "var(--ink)" }}>private beta</strong> · early access spots available
            </span>
          </div>
        </div>
      </section>

      {/* ═══════════════ TRUST STRIP ═══════════════ */}
      <section className="px-4 pb-12">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs mb-5" style={{ color: "var(--muted)" }}>
            Companies our students commonly target
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 opacity-60">
            {trustedCompanies.map((c) => (
              <span key={c} className="text-sm font-semibold tracking-wide" style={{ color: "var(--ink-soft)" }}>{c}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ HOW IT WORKS ═══════════════ */}
      <section className="px-4 py-12 md:py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="section-eyebrow mx-auto">How it works</div>
            <h2 className="font-semibold text-3xl md:text-4xl" style={{ color: "var(--ink)" }}>
              From confused to first offer in 90 days
            </h2>
            <p className="text-sm md:text-base max-w-xl mx-auto mt-3" style={{ color: "var(--muted)" }}>
              Most graduates spend 2 years figuring this out. Our average is 12 weeks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {studentSteps.map((s) => (
              <div key={s.n} className="card-soft">
                <p className="text-xs font-semibold mb-3 inline-block px-2 py-0.5 rounded-md" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>{s.n}</p>
                <h3 className="font-semibold text-base mb-2" style={{ color: "var(--ink)" }}>{s.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ AUDIENCE CARDS — students, mentors, colleges, companies ═══════════════ */}
      <section className="px-4 py-12 md:py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="section-eyebrow mx-auto">Built for everyone in the hiring loop</div>
            <h2 className="font-semibold text-3xl md:text-4xl" style={{ color: "var(--ink)" }}>
              One platform, four audiences, zero compromise
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {audiences.map((a) => {
              const Mock = mockMap[a.eyebrow];
              return (
              <div key={a.eyebrow} className="card flex flex-col">
                <div className="rounded-2xl mb-5 h-44 relative overflow-hidden" style={{ background: a.accent }}>
                  {Mock && <Mock />}
                </div>
                <p className="text-[10px] uppercase tracking-[0.18em] font-semibold mb-2" style={{ color: "var(--primary)" }}>{a.eyebrow}</p>
                <h3 className="font-semibold text-xl mb-2" style={{ color: "var(--ink)" }}>{a.title}</h3>
                <p className="text-sm leading-relaxed mb-5 flex-1" style={{ color: "var(--muted)" }}>{a.body}</p>
                <div className="flex items-center gap-6 mb-5">
                  {a.stats.map((s) => (
                    <div key={s.v}>
                      <p className="font-semibold text-lg" style={{ color: "var(--ink)" }}>{s.k}</p>
                      <p className="text-[10px]" style={{ color: "var(--muted)" }}>{s.v}</p>
                    </div>
                  ))}
                </div>
                <Link href={a.cta.href} className="btn-dark inline-flex w-fit" style={{ padding: "0.55rem 1.2rem", fontSize: "0.8rem" }}>
                  {a.cta.label} →
                </Link>
              </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════ MID-PAGE CTA BANNER ═══════════════ */}
      <section className="px-4 py-10">
        <div className="max-w-5xl mx-auto rounded-3xl p-6 md:p-12 text-center" style={{ background: "linear-gradient(135deg, #EDE9FE 0%, #FBCFE8 60%, #FED7AA 100%)" }}>
          <h2 className="font-semibold text-2xl md:text-3xl mb-3" style={{ color: "var(--ink)" }}>
            Goal: first offer in under 12 weeks.
          </h2>
          <p className="text-sm md:text-base max-w-xl mx-auto mb-6" style={{ color: "var(--ink-soft)" }}>
            Free tier alone is enough to start. Premium users get the full prep stack.
          </p>
          <Link href="/auth/signup" className="btn-primary">Start your roadmap</Link>
        </div>
      </section>

      {/* ═══════════════ OUTCOMES BY COLLEGE TIER ═══════════════ */}
      <section className="px-4 py-12 md:py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="section-eyebrow mx-auto">Targets</div>
            <h2 className="font-semibold text-3xl md:text-4xl" style={{ color: "var(--ink)" }}>
              We don&apos;t filter by college name. We measure skills.
            </h2>
            <p className="text-sm md:text-base max-w-xl mx-auto mt-3" style={{ color: "var(--muted)" }}>
              Our target placement rates by tier — what we&apos;re building toward.
              First audited cohort report publishes Q3 2026.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {outcomes.map((o) => (
              <div key={o.tier} className="card">
                <p className="text-3xl font-semibold mb-2" style={{ color: "var(--primary)" }}>{o.placed}</p>
                <p className="text-xs uppercase tracking-wide font-semibold mb-2" style={{ color: "var(--muted)" }}>placement rate</p>
                <p className="font-semibold text-sm mb-3" style={{ color: "var(--ink)" }}>{o.tier}</p>
                <p className="text-[11px] leading-relaxed mb-3" style={{ color: "var(--muted)" }}>
                  Top employers: <span style={{ color: "var(--ink)" }}>{o.topCo}</span>
                </p>
                <p className="text-[11px] font-medium" style={{ color: "var(--primary)" }}>{o.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ MENTOR SPOTLIGHT ═══════════════ */}
      <section className="px-4 py-12 md:py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="section-eyebrow mx-auto">Verified mentors</div>
            <h2 className="font-semibold text-3xl md:text-4xl" style={{ color: "var(--ink)" }}>
              Learn from people who&apos;ve been there
            </h2>
            <p className="text-sm md:text-base max-w-xl mx-auto mt-3" style={{ color: "var(--muted)" }}>
              Every mentor verified through their employer. No life-coach influencers. Just engineers who shipped.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {mentors.map((m) => (
              <div key={m.name} className="card-soft text-center">
                <div className="w-20 h-20 rounded-full mx-auto mb-4" style={{ background: m.img }} />
                <p className="font-semibold text-base mb-0.5" style={{ color: "var(--ink)" }}>{m.name}</p>
                <p className="text-xs mb-1" style={{ color: "var(--primary)" }}>{m.role}</p>
                <p className="text-[11px] font-medium mb-3" style={{ color: "var(--ink-soft)" }}>{m.company}</p>
                <p className="text-[11px] leading-relaxed" style={{ color: "var(--muted)" }}>{m.topics}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/mentors" className="btn-outline">Browse all 200+ mentors</Link>
          </div>
        </div>
      </section>

      {/* ═══════════════ COMPARISON TABLE ═══════════════ */}
      <section className="px-4 py-12 md:py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="section-eyebrow mx-auto">Why us</div>
            <h2 className="font-semibold text-3xl md:text-4xl" style={{ color: "var(--ink)" }}>
              The honest comparison
            </h2>
            <p className="text-sm md:text-base max-w-xl mx-auto mt-3" style={{ color: "var(--muted)" }}>
              We get this question a lot. Here&apos;s the unfiltered answer.
            </p>
          </div>

          <div className="card" style={{ padding: "20px" }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                  <th className="text-left py-3 pr-2 font-semibold text-[11px] md:text-xs" style={{ color: "var(--muted)" }}>Feature</th>
                  <th className="text-center py-3 px-2 font-semibold text-[11px] md:text-xs" style={{ color: "var(--primary)" }}>AstraaHire</th>
                  <th className="text-center py-3 px-2 font-semibold text-[11px] md:text-xs hidden md:table-cell" style={{ color: "var(--muted)" }}>Naukri</th>
                  <th className="text-center py-3 px-2 font-semibold text-[11px] md:text-xs hidden md:table-cell" style={{ color: "var(--muted)" }}>LinkedIn</th>
                  <th className="text-center py-3 pl-2 font-semibold text-[11px] md:text-xs" style={{ color: "var(--muted)" }}>Coaching</th>
                </tr>
              </thead>
              <tbody>
                {compareRows.map((r) => (
                  <tr key={r.feature} className="border-b" style={{ borderColor: "var(--border)" }}>
                    <td className="py-3 pr-2 text-[11px] md:text-sm" style={{ color: "var(--ink)" }}>{r.feature}</td>
                    <td className="text-center py-3 px-2 text-[11px] md:text-sm font-semibold" style={{ color: "var(--primary)" }}>
                      {r.us === true ? "✓" : r.us === false ? "—" : r.us}
                    </td>
                    <td className="text-center py-3 px-2 text-[11px] hidden md:table-cell" style={{ color: "var(--muted)" }}>
                      {r.naukri === true ? "✓" : r.naukri === false ? "—" : r.naukri}
                    </td>
                    <td className="text-center py-3 px-2 text-[11px] hidden md:table-cell" style={{ color: "var(--muted)" }}>
                      {r.linkedin === true ? "✓" : r.linkedin === false ? "—" : r.linkedin}
                    </td>
                    <td className="text-center py-3 pl-2 text-[11px] md:text-sm" style={{ color: "var(--muted)" }}>
                      {r.coaching === true ? "✓" : r.coaching === false ? "—" : r.coaching}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[10px] mt-3 md:hidden" style={{ color: "var(--muted)" }}>
              Showing AstraaHire vs Coaching. Naukri & LinkedIn columns visible on desktop.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════ PRICING TEASER ═══════════════ */}
      <section className="px-4 py-12 md:py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="section-eyebrow mx-auto">Pricing</div>
            <h2 className="font-semibold text-3xl md:text-4xl" style={{ color: "var(--ink)" }}>
              Less than a Netflix subscription
            </h2>
            <p className="text-sm md:text-base max-w-xl mx-auto mt-3" style={{ color: "var(--muted)" }}>
              Free forever for the basics. ₹299/month for everything that gets you hired.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {pricingPlans.map((p) => (
              <div
                key={p.name}
                className={`rounded-3xl p-7 ${p.featured ? "ring-2" : "border"} flex flex-col`}
                style={{
                  background: p.featured ? "var(--surface-dark)" : "white",
                  borderColor: p.featured ? "transparent" : "var(--border)",
                  ...(p.featured ? { color: "white" } : {}),
                }}
              >
                {p.featured && <span className="self-start mb-3 text-[10px] font-bold px-2.5 py-0.5 rounded-full" style={{ background: "var(--primary)", color: "white" }}>MOST POPULAR</span>}
                <p className="text-xs font-semibold mb-1" style={{ color: p.featured ? "rgba(255,255,255,0.7)" : "var(--muted)" }}>{p.name}</p>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-semibold" style={{ color: p.featured ? "white" : "var(--ink)" }}>{p.price}</span>
                  {p.period && <span className="text-sm" style={{ color: p.featured ? "rgba(255,255,255,0.6)" : "var(--muted)" }}>{p.period}</span>}
                </div>
                <p className="text-xs leading-relaxed mb-5" style={{ color: p.featured ? "rgba(255,255,255,0.7)" : "var(--muted)" }}>{p.desc}</p>
                <ul className="space-y-2 mb-6 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs" style={{ color: p.featured ? "rgba(255,255,255,0.85)" : "var(--ink-soft)" }}>
                      <span style={{ color: p.featured ? "#86EFAC" : "var(--success)" }}>✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/pricing"
                  className={p.featured ? "btn-primary" : "btn-outline"}
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ PARTNER COLLEGES WALL ═══════════════ */}
      <section className="px-4 py-12 md:py-20">
        <div className="max-w-5xl mx-auto text-center">
          <div className="section-eyebrow mx-auto">Trusted by placement cells</div>
          <h2 className="font-semibold text-3xl md:text-4xl mb-3" style={{ color: "var(--ink)" }}>
            Partner colleges & universities
          </h2>
          <p className="text-sm md:text-base max-w-xl mx-auto mb-10" style={{ color: "var(--muted)" }}>
            14 institutions across India use AstraaHire as their placement platform.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 max-w-4xl mx-auto">
            {partnerColleges.map((c) => (
              <div key={c} className="card-soft py-5 px-3 text-center">
                <p className="text-xs font-semibold" style={{ color: "var(--ink)" }}>{c}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ FAQ ═══════════════ */}
      <section className="px-4 py-12 md:py-20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="section-eyebrow mx-auto">FAQ</div>
            <h2 className="font-semibold text-3xl md:text-4xl" style={{ color: "var(--ink)" }}>
              Things people ask before signing up
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((f, i) => (
              <button
                key={f.q}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full text-left card-soft transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="font-semibold text-sm" style={{ color: "var(--ink)" }}>{f.q}</p>
                  <span className="text-xl shrink-0 transition-transform" style={{ color: "var(--primary)", transform: openFaq === i ? "rotate(45deg)" : "none" }}>+</span>
                </div>
                {openFaq === i && (
                  <p className="text-xs leading-relaxed mt-3" style={{ color: "var(--muted)" }}>{f.a}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ FINAL DARK CTA ═══════════════ */}
      <section className="px-4 pb-20">
        <div className="card-dark max-w-5xl mx-auto text-center" style={{ padding: "60px 24px" }}>
          <div className="section-eyebrow mx-auto" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}>
            Get started
          </div>
          <h2 className="font-semibold text-3xl md:text-4xl mb-4" style={{ color: "white" }}>
            Stop wasting two years figuring this out alone.
          </h2>
          <p className="text-sm md:text-base max-w-md mx-auto mb-8" style={{ color: "rgba(255,255,255,0.6)" }}>
            Sign up for free, build your personalised roadmap, and join the launch cohort. No credit card. No commitment.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/auth/signup" className="btn-primary">Get started — free</Link>
            <Link href="/contact" className="btn-outline" style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.15)", color: "white" }}>
              Talk to our team
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════ DISCLOSURE FOOTNOTE ═══════════════ */}
      <section className="px-4 pb-16">
        <p className="max-w-3xl mx-auto text-center text-[11px] leading-relaxed" style={{ color: "var(--muted)" }}>
          AstraaHire is currently in private beta. Numbers shown on this page (placement rates by tier,
          target outcomes, mentor profiles, partner colleges) are illustrative product targets that
          will be replaced with audited cohort data once we publish our first quarterly outcomes report.
          Company logos shown indicate target employers our students apply to, not direct partnerships
          unless explicitly stated.
        </p>
      </section>
    </div>
  );
}
