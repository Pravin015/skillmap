"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const heading = "font-[family-name:var(--font-heading)]";

const logoCompanies = ["Google", "Amazon", "TCS", "Infosys", "Wipro", "Deloitte", "KPMG", "Flipkart", "Microsoft", "Razorpay"];

const features = [
  { icon: "🤖", title: "AI Career Advisor", desc: "Personalised guidance powered by Claude AI", href: "/chat" },
  { icon: "🎤", title: "Mock Interviews", desc: "Practice for 15+ companies with AI feedback", href: "/mock-interview" },
  { icon: "💼", title: "Smart Job Matching", desc: "Domain-filtered jobs with skill-match scoring", href: "/jobs" },
  { icon: "👨‍🏫", title: "Mentor Sessions", desc: "1-on-1 with verified industry professionals", href: "/companies" },
  { icon: "🧪", title: "Lab Assessments", desc: "Proctored MCQ labs for technical screening", href: "/jobs" },
  { icon: "🏆", title: "Competitions", desc: "Hackathons, coding challenges, and quizzes", href: "/competitions" },
  { icon: "🛡️", title: "Offer Verification", desc: "AI-powered fake offer letter detection", href: "/offer-verify" },
  { icon: "📊", title: "Skill Tracking", desc: "Track progress across all activities", href: "/dashboard" },
];

const howSteps = [
  { num: "01", title: "Create Your Profile", desc: "Sign up with email verification. Add your skills, education, and career goals." },
  { num: "02", title: "Tell Us Your Dream Company", desc: "Type which company and role you want — our AI builds your personalised roadmap." },
  { num: "03", title: "Prepare with AI + Mentors", desc: "Follow week-by-week prep plans. Practice mock interviews. Connect with mentors." },
  { num: "04", title: "Get Hired", desc: "Apply to matched jobs, ace the interview, and land your dream offer." },
];

const whyUs = [
  { title: "AI-Powered Interview Prep", desc: "Practice mock interviews for TCS, Google, Amazon, and 12 more companies. Get real-time feedback and scores on every answer. No competitor offers this." },
  { title: "Company-Specific Skill Maps", desc: "Know exactly what skills each company requires. No guessing — we've decoded hiring patterns from TCS to Goldman Sachs." },
  { title: "Proctored Assessments", desc: "Fullscreen enforcement, tab-switch detection, and webcam verification. Enterprise-grade proctoring included free." },
  { title: "Fake Offer Detection", desc: "Upload any offer letter — our AI checks 20 fraud parameters and gives you a trust score. Protecting students from job scams." },
];

const reviews = [
  { quote: "SkillMap told me I was missing CEH certification for TCS Cybersecurity. Got it in 5 weeks. Got the call in week 6.", name: "Rahul Kumar", role: "B.Tech CSE, 2025", company: "TCS" },
  { quote: "Nobody told me KPMG looks for ISO 27001 knowledge. SkillMap's roadmap was so specific — I knew exactly what to do.", name: "Priya Sharma", role: "MBA Finance, 2025", company: "KPMG" },
  { quote: "The AI advisor felt like talking to a senior who actually knew what they were talking about. Cracked Infosys first attempt.", name: "Sneha Joshi", role: "B.Tech IT, 2025", company: "Infosys" },
];

const faqItems = [
  { q: "Is SkillMap only for engineering graduates?", a: "Not at all. We cover paths for B.Com, BBA, B.Sc, BA, MBA, MCA and more. KPMG, Deloitte, EY and many others hire from non-engineering backgrounds." },
  { q: "How does the AI know what skills I need?", a: "We've built a detailed database of skill requirements per company and role — sourced from job descriptions, interview reports, and hiring patterns. The AI cross-references this with your background." },
  { q: "How long does it take to get hired?", a: "For fresher-friendly companies like TCS/Wipro, 4-8 weeks. For Google or Deloitte, 3-6 months. We give honest timelines, not false promises." },
  { q: "Is it free?", a: "Yes. Jobs, AI advisor, mock interviews, competitions, and events are free. Premium features are Rs.299/mo with the Career Ready plan." },
  { q: "What about fake job offers?", a: "Our Offer Verification tool checks 20 fraud parameters using AI. Upload any offer letter and get a trust score instantly. Report scams to cybercrime.gov.in." },
];

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  function handleChatSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    sessionStorage.setItem("skillmap_query", query.trim());
    router.push(session ? "/chat" : "/auth/signup?role=STUDENT");
  }

  return (
    <div style={{ background: "var(--surface)" }}>

      {/* ═══ HERO ═══ */}
      <section
        className="relative px-4 pt-28 pb-20 md:pt-36 md:pb-24 flex flex-col items-center justify-center text-center"
        style={{
          background: "var(--color-bg-dark)",
          minHeight: "100vh",
        }}
      >
        {/* Subtle radial glow */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(10,191,188,0.08) 0%, transparent 70%)" }} />

        <div className="relative max-w-[800px] mx-auto w-full">
          {/* Eyebrow */}
          <div
            className="animate-fade-up inline-flex items-center gap-2 mb-6 mx-auto"
            style={{
              background: "rgba(10,191,188,0.1)",
              border: "1px solid rgba(10,191,188,0.2)",
              borderRadius: 999,
              padding: "0.3rem 1rem",
              fontFamily: "var(--font-heading)",
              fontSize: "0.7rem",
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase" as const,
              color: "var(--primary)",
            }}
          >
            Free to start · No courses · No gatekeeping
          </div>

          {/* Headline */}
          <h1
            className={`${heading} animate-fade-up-1 font-[800] mb-6`}
            style={{
              fontSize: "clamp(2.8rem, 7vw, 5.5rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              color: "#FFFFFF",
            }}
          >
            Nobody Told You<br />
            <span style={{ color: "var(--primary)" }}>What To Learn.</span><br />
            We Will.
          </h1>

          {/* Subheadline */}
          <p
            className="animate-fade-up-2 mx-auto mb-10"
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 400,
              fontSize: "clamp(1rem, 2vw, 1.2rem)",
              lineHeight: 1.7,
              color: "var(--color-text-muted)",
              maxWidth: 580,
            }}
          >
            Tell us your dream company. Get a week-by-week roadmap, AI mock interviews, and real mentors — built for Indian graduates.
          </p>

          {/* CTA Buttons */}
          <div className="animate-fade-up-3 flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
            <button
              onClick={() => {
                const el = document.getElementById("hero-input");
                if (el) el.focus();
                else router.push(session ? "/chat" : "/auth/signup?role=STUDENT");
              }}
              className={`${heading} font-semibold transition-all`}
              style={{
                background: "var(--primary)",
                color: "#fff",
                padding: "0.9rem 2.2rem",
                fontSize: "1rem",
                borderRadius: "0.5rem",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 20px rgba(10,191,188,0.35)",
              }}
            >
              Build My Roadmap — It&apos;s Free
            </button>
            <a
              href="#how-section"
              className="transition-colors"
              style={{
                color: "var(--color-text-muted)",
                fontSize: "0.95rem",
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              See How It Works ↓
            </a>
          </div>

          {/* Input Bar */}
          <form onSubmit={handleChatSubmit} className="max-w-xl mx-auto mb-4 animate-fade-up-3">
            <div
              className="flex items-center gap-2 p-2 transition-all"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "0.625rem",
              }}
            >
              <svg className="ml-3 shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input
                id="hero-input"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="I want to join Google as a UX Designer..."
                className="flex-1 py-3 px-2 text-sm outline-none bg-transparent"
                style={{ color: "#FFFFFF" }}
              />
              <button
                type="submit"
                className="shrink-0 font-semibold transition-all"
                style={{
                  background: "var(--primary)",
                  color: "#fff",
                  padding: "0.6rem 1.25rem",
                  fontSize: "0.85rem",
                  borderRadius: "0.5rem",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Get My Roadmap
              </button>
            </div>
            <p className="text-center mt-2" style={{ color: "var(--color-text-secondary)", fontSize: "0.75rem" }}>
              Powered by Claude AI · Personalised for you
            </p>
          </form>

          {/* Social Proof */}
          <div className="animate-fade-up-3 mb-12">
            <p className="mb-3" style={{ color: "var(--color-text-secondary)", fontSize: "0.8rem" }}>
              Trusted by students targeting
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {["TCS", "Infosys", "Google", "Deloitte", "Amazon"].map((c) => (
                <span
                  key={c}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "var(--color-text-muted)",
                    fontSize: "0.75rem",
                    borderRadius: 999,
                    padding: "0.25rem 0.75rem",
                  }}
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
            {[
              { num: "15+", label: "Companies Mapped", sub: "With real interview Q&A" },
              { num: "100+", label: "Interview Questions", sub: "Curated by insiders" },
              { num: "Free", label: "To Start", sub: "No credit card needed" },
            ].map((s) => (
              <div
                key={s.label}
                className="text-center"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "0.75rem",
                  padding: "1.25rem 2rem",
                }}
              >
                <div className={`${heading}`} style={{ fontSize: "2rem", fontWeight: 800, color: "var(--primary)" }}>{s.num}</div>
                <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#FFFFFF", marginTop: "0.25rem" }}>{s.label}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginTop: "0.2rem" }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section className="px-4 py-16" style={{ background: "var(--surface-alt)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="section-eyebrow justify-center">Features</div>
            <h2 className={`${heading} font-extrabold text-2xl md:text-3xl`} style={{ color: "var(--ink)" }}>
              Everything You Need to Get Hired
            </h2>
            <p className="text-sm mt-2" style={{ color: "var(--muted)" }}>Full-stack career readiness platform for Indian graduates</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {features.map((f) => (
              <Link key={f.title} href={f.href} className="card group no-underline text-center" style={{ padding: "20px 16px" }}>
                <div className="text-2xl mb-2">{f.icon}</div>
                <div className={`text-xs font-semibold mb-1 group-hover:text-[var(--primary)] transition-colors`} style={{ color: "var(--ink)" }}>{f.title}</div>
                <div className="text-[10px] leading-relaxed" style={{ color: "var(--muted)" }}>{f.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how-section" className="px-4 py-16" style={{ background: "var(--surface)" }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="section-eyebrow justify-center">How it works</div>
            <h2 className={`${heading} font-extrabold text-2xl md:text-3xl`} style={{ color: "var(--ink)" }}>
              From Confused to Hired
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {howSteps.map((s) => (
              <div key={s.num} className="card-elevated relative" style={{ padding: "28px 20px" }}>
                <div className={`${heading} text-4xl font-extrabold absolute top-3 right-4`} style={{ color: "var(--primary)", opacity: 0.08 }}>{s.num}</div>
                <div className={`${heading} text-xs font-bold mb-3 inline-block px-2 py-0.5 rounded`} style={{ background: "var(--primary-light)", color: "var(--primary)" }}>Step {s.num}</div>
                <h3 className={`${heading} text-sm font-bold mb-2`} style={{ color: "var(--ink)" }}>{s.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ WHY SKILLMAP ═══ */}
      <section className="px-4 py-16" style={{ background: "var(--surface-alt)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="section-eyebrow justify-center">Why SkillMap</div>
            <h2 className={`${heading} font-extrabold text-2xl md:text-3xl`} style={{ color: "var(--ink)" }}>
              Not a Job Board. A Readiness Engine.
            </h2>
            <p className="text-sm mt-2" style={{ color: "var(--muted)" }}>What competitors don&apos;t offer — we include for free</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {whyUs.map((d) => (
              <div key={d.title} className="card-elevated" style={{ borderLeft: "3px solid var(--primary)" }}>
                <h3 className={`${heading} text-sm font-bold mb-2`} style={{ color: "var(--ink)" }}>{d.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section className="px-4 py-16" style={{ background: "var(--surface)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="section-eyebrow justify-center">Success Stories</div>
            <h2 className={`${heading} font-extrabold text-2xl md:text-3xl`} style={{ color: "var(--ink)" }}>
              Real Results. Real People.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reviews.map((r) => (
              <div key={r.name} className="card-elevated">
                <div className="text-xs mb-3 tracking-wider" style={{ color: "var(--warning)" }}>★★★★★</div>
                <p className="text-sm leading-relaxed mb-4 italic" style={{ color: "var(--ink-light)" }}>&ldquo;{r.quote}&rdquo;</p>
                <div className="flex items-center gap-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: "var(--primary)" }}>
                    {r.name.split(" ").map((w) => w[0]).join("")}
                  </div>
                  <div>
                    <div className="text-xs font-semibold" style={{ color: "var(--ink)" }}>{r.name}</div>
                    <div className="text-[10px]" style={{ color: "var(--muted)" }}>{r.role} · {r.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="px-4 py-16" style={{ background: "var(--surface-alt)" }}>
        <div className="max-w-2xl mx-auto">
          <h2 className={`${heading} font-extrabold text-2xl text-center mb-8`} style={{ color: "var(--ink)" }}>
            Frequently Asked Questions
          </h2>

          <div className="space-y-2">
            {faqItems.map((item, i) => (
              <div key={i} className={`rounded-xl border overflow-hidden ${openFaq === i ? "faq-open" : ""}`} style={{ borderColor: openFaq === i ? "var(--primary)" : "var(--border)", background: "white" }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex justify-between items-center p-4 text-left bg-transparent border-none cursor-pointer"
                >
                  <span className="text-sm font-semibold pr-4" style={{ color: "var(--ink)" }}>{item.q}</span>
                  <span className="text-lg shrink-0 faq-icon transition-transform duration-300" style={{ color: openFaq === i ? "var(--primary)" : "var(--muted)" }}>+</span>
                </button>
                <div className="faq-answer px-4 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                  {item.a}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="px-4 py-20" style={{ background: "var(--primary)" }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className={`${heading} font-extrabold text-xl md:text-2xl text-white mb-3`}>
            Your Dream Company is Hiring Right Now
          </h2>
          <p className="text-sm mb-8" style={{ color: "rgba(255,255,255,0.7)" }}>
            Tell us where you want to be — we&apos;ll show you how to get there.
          </p>

          <form onSubmit={handleChatSubmit} className="max-w-lg mx-auto mb-4">
            <div className="flex items-center gap-2 rounded-2xl p-2" style={{ background: "rgba(255,255,255,0.15)" }}>
              <svg className="ml-3 shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="I want to join Amazon as a Data Analyst..."
                className="flex-1 py-3 px-2 text-sm outline-none bg-transparent text-white placeholder:text-white/50"
              />
              <button type="submit" className="shrink-0 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all hover:opacity-90" style={{ background: "white", color: "var(--primary)" }}>
                Start Free
              </button>
            </div>
          </form>

          <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
            Free to start · No credit card · Takes 3 minutes
          </p>
        </div>
      </section>
    </div>
  );
}
