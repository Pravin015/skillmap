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
      <section className="px-4" style={{ background: "#FFFFFF", paddingTop: "6rem", paddingBottom: "6rem" }}>
        <div className="mx-auto" style={{ maxWidth: 1200 }}>
          {/* Section Header */}
          <div className="text-center mb-12">
            <div className="section-eyebrow justify-center">WHAT YOU GET</div>
            <h2 className={`${heading}`} style={{ color: "var(--ink)" }}>
              Everything You Need.
            </h2>
            <p className={`${heading} mt-1`} style={{ color: "var(--muted)", fontSize: "clamp(1.1rem, 2vw, 1.5rem)", fontWeight: 400 }}>
              Nothing you don&apos;t.
            </p>
            <p className="mt-4 mx-auto" style={{ color: "var(--color-text-secondary)", fontSize: "0.95rem", lineHeight: 1.7, maxWidth: 600 }}>
              Stop paying lakhs for generic video courses. SkillMap gives you AI guidance, company-specific prep, real mentors, and scam protection — free or Rs.299/month.
            </p>
          </div>

          {/* TIER 1 — Hero Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Feature 1: AI Career Advisor */}
            <div style={{ background: "var(--color-bg-dark)", border: "1px solid rgba(10,191,188,0.2)", borderTop: "2px solid var(--primary)", borderRadius: "1rem", padding: "2.5rem" }}>
              <div className="flex items-center gap-3 mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 8h10M7 12h6M7 16h8"/></svg>
                <span style={{ background: "rgba(10,191,188,0.12)", border: "1px solid rgba(10,191,188,0.25)", borderRadius: 999, padding: "0.2rem 0.7rem", fontSize: "0.7rem", fontWeight: 600, color: "var(--primary)" }}>Powered by Claude AI</span>
              </div>
              <h3 className={heading} style={{ color: "#fff", fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>Your Personal Career Advisor</h3>
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", lineHeight: 1.65, marginBottom: "1.5rem" }}>
                Tell us your dream company and role. Our AI builds a personalised week-by-week roadmap with free resources — specific to TCS, Google, Amazon, or wherever you want to go. No generic advice. Ever.
              </p>
              {/* Mock Chat UI */}
              <div style={{ borderRadius: "0.75rem", padding: "1rem", background: "rgba(255,255,255,0.03)" }}>
                <div className="flex justify-end mb-2">
                  <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: "0.75rem 0.75rem 0.25rem 0.75rem", padding: "0.6rem 0.9rem", fontSize: "0.8rem", color: "#fff", maxWidth: "80%" }}>
                    I want to join Infosys as a Java Developer
                  </div>
                </div>
                <div className="flex justify-start">
                  <div style={{ background: "rgba(10,191,188,0.12)", border: "1px solid rgba(10,191,188,0.2)", borderRadius: "0.75rem 0.75rem 0.75rem 0.25rem", padding: "0.6rem 0.9rem", fontSize: "0.8rem", color: "var(--primary)", maxWidth: "85%", lineHeight: 1.5 }}>
                    Week 1-2: Core Java + DSA basics. Week 3-4: Spring Boot fundamentals. Week 5-6: Infosys-specific coding patterns...
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2: Mock Interviews */}
            <div style={{ background: "var(--color-bg-dark)", border: "1px solid rgba(10,191,188,0.2)", borderTop: "2px solid var(--accent)", borderRadius: "1rem", padding: "2.5rem" }}>
              <div className="flex items-center gap-3 mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                <span style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 999, padding: "0.2rem 0.7rem", fontSize: "0.7rem", fontWeight: 600, color: "var(--accent)" }}>15 Companies · 3 Modes</span>
              </div>
              <h3 className={heading} style={{ color: "#fff", fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>Practice Until You&apos;re Ready</h3>
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", lineHeight: 1.65, marginBottom: "1.5rem" }}>
                Real interview questions from TCS, Google, Wipro, Deloitte, and 11 more. Self-prep, AI-powered interview with instant scoring, or book a session with a mentor who works there.
              </p>
              {/* Mock Score Widget */}
              <div style={{ borderRadius: "0.75rem", padding: "1.25rem", background: "rgba(255,255,255,0.03)" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>Interview Score</div>
                <div className={heading} style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--primary)", lineHeight: 1 }}>78<span style={{ fontSize: "1rem", color: "var(--color-text-muted)" }}>/100</span></div>
                <div className="mt-3 space-y-2">
                  {[{ label: "Technical", pct: 85 }, { label: "Communication", pct: 70 }, { label: "Domain", pct: 80 }].map((b) => (
                    <div key={b.label}>
                      <div className="flex justify-between mb-1" style={{ fontSize: "0.7rem" }}>
                        <span style={{ color: "var(--color-text-muted)" }}>{b.label}</span>
                        <span style={{ color: "var(--primary)" }}>{b.pct}%</span>
                      </div>
                      <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.08)" }}>
                        <div style={{ height: 4, borderRadius: 2, width: `${b.pct}%`, background: "var(--primary)" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* TIER 2 — Supporting Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Job Matching */}
            <div style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "0.75rem", padding: "1.5rem" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5" className="mb-3"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
              <h3 className={heading} style={{ fontSize: "1rem", fontWeight: 700, color: "var(--ink)", marginBottom: "0.4rem" }}>Jobs That Match You</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", lineHeight: 1.6, marginBottom: "0.75rem" }}>AI calculates your skill-match percentage for every job. See only roles relevant to your domain — no spam, no noise.</p>
              <span style={{ fontSize: "0.7rem", color: "var(--primary)", fontWeight: 600 }}>Skill match % · One-click apply</span>
            </div>

            {/* Mentor Sessions */}
            <div style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "0.75rem", padding: "1.5rem" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5" className="mb-3"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              <h3 className={heading} style={{ fontSize: "1rem", fontWeight: 700, color: "var(--ink)", marginBottom: "0.4rem" }}>Talk to Someone Who&apos;s Been There</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", lineHeight: 1.6, marginBottom: "0.75rem" }}>Book 1-on-1 sessions with verified professionals from your dream companies. Free or paid from Rs.300.</p>
              <span style={{ fontSize: "0.7rem", color: "var(--primary)", fontWeight: 600 }}>Verified mentors · Rated &amp; reviewed</span>
            </div>

            {/* Offer Verification */}
            <div style={{ background: "#FFFBF0", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "0.75rem", padding: "1.5rem" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" className="mb-3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
              <h3 className={heading} style={{ fontSize: "1rem", fontWeight: 700, color: "var(--ink)", marginBottom: "0.4rem" }}>Is That Offer Real?</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", lineHeight: 1.6, marginBottom: "0.75rem" }}>Paste any offer letter. Our AI checks 20 fraud parameters and gives a trust score. Rs.1,200 Cr lost to job scams in India last year.</p>
              <span style={{ fontSize: "0.7rem", color: "var(--accent)", fontWeight: 600 }}>20 fraud checks · Instant verdict</span>
            </div>

            {/* Lab Assessments */}
            <div style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "0.75rem", padding: "1.5rem" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5" className="mb-3"><path d="M9 3h6v5l3 9H6l3-9V3z"/><path d="M6 17h12"/><path d="M10 3v5"/><path d="M14 3v5"/></svg>
              <h3 className={heading} style={{ fontSize: "1rem", fontWeight: 700, color: "var(--ink)", marginBottom: "0.4rem" }}>Prove Your Skills</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", lineHeight: 1.6, marginBottom: "0.75rem" }}>Timed, proctored MCQ labs with webcam verification. Results employers actually trust — not self-reported skills.</p>
              <span style={{ fontSize: "0.7rem", color: "var(--primary)", fontWeight: 600 }}>Proctored · Auto-graded · Shareable</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how-section" style={{ background: "var(--color-bg-dark)", paddingTop: "6rem", paddingBottom: "6rem" }}>
        <div className="mx-auto px-4" style={{ maxWidth: 1000 }}>
          {/* Header */}
          <div className="text-center mb-14">
            <div className="section-eyebrow justify-center" style={{ color: "var(--primary)" }}>HOW IT WORKS</div>
            <h2 className={heading} style={{ color: "#fff" }}>From Confused to Hired</h2>
            <p style={{ color: "var(--color-text-secondary)", marginTop: "0.5rem", fontSize: "1rem" }}>Four steps. No fluff.</p>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Horizontal connector line (desktop) */}
            <div className="hidden lg:block absolute top-6 left-[12.5%] right-[12.5%] h-[1.5px]" style={{ background: "rgba(10,191,188,0.2)" }} />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-6">
              {[
                { num: "01", title: "Create Your Profile", desc: "Add your skills, education, and target companies. Takes 3 minutes." },
                { num: "02", title: "Tell Us Your Goal", desc: "Type your dream company and role. Our AI builds your personalised roadmap instantly." },
                { num: "03", title: "Prepare with AI + Mentors", desc: "Follow your week-by-week plan. Practice mock interviews. Book mentor sessions." },
                { num: "04", title: "Apply and Get Hired", desc: "Apply to matched jobs with your skill score. Land interviews at your dream company." },
              ].map((step) => (
                <div key={step.num} className="text-center relative">
                  {/* Step circle */}
                  <div
                    className="mx-auto flex items-center justify-center"
                    style={{
                      width: "3rem", height: "3rem", borderRadius: "50%",
                      background: "rgba(10,191,188,0.1)",
                      border: "1.5px solid var(--primary)",
                    }}
                  >
                    <span className={heading} style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--primary)" }}>{step.num}</span>
                  </div>

                  {/* Title */}
                  <h3 className={heading} style={{ color: "#fff", fontWeight: 700, fontSize: "1.1rem", marginTop: "1.25rem", marginBottom: "0.5rem" }}>
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="mx-auto" style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", lineHeight: 1.6, maxWidth: 220 }}>
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginBottom: "1rem" }}>Ready to start?</p>
            <button
              onClick={() => router.push(session ? "/chat" : "/auth/signup?role=STUDENT")}
              className="btn-primary"
              style={{ padding: "0.9rem 2rem", fontSize: "1rem" }}
            >
              Build My Free Roadmap →
            </button>
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
