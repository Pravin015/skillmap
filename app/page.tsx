"use client";

import { useState, useEffect, useRef } from "react";
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
  { q: "Is SkillMap only for engineering graduates?", a: "No — SkillMap works for any domain. Whether you're in engineering, MBA, commerce, or arts, you can tell us your target company and role and we'll build a roadmap specific to you." },
  { q: "How does the AI know what skills I need?", a: "Our AI is trained on real hiring patterns from 15+ companies including TCS, Infosys, Google, KPMG, and Deloitte. It maps your profile against what each company actually looks for — not generic job descriptions." },
  { q: "Is it really free?", a: "Yes. The AI advisor, company roadmaps, mock interview Q&A, job matching, and offer verification are all free. Career Ready (Rs.299/month) unlocks AI-powered live mock interviews and priority mentor booking." },
  { q: "What if I get a fake job offer?", a: "Upload the offer letter to our Offer Verification tool. Our AI checks 20 fraud parameters — letterhead, email domain, salary realism, payment requests, and more — and gives you a trust score in seconds." },
  { q: "How long does it take to get hired?", a: "It depends on your starting point. Students who follow their SkillMap roadmap consistently typically see interview calls within 4-8 weeks. The AI tracks your progress and adjusts your plan if you fall behind." },
];

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [stat1, setStat1] = useState(0);
  const [stat2, setStat2] = useState(0);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  const [activeCard, setActiveCard] = useState(0);

  // Scroll reveal observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("in-view"); }); },
      { threshold: 0.15 }
    );
    document.querySelectorAll(".animate-on-scroll").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Stat counter animation
  useEffect(() => {
    if (!statsVisible) return;
    const duration = 1500;
    const steps = 30;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      setStat1(Math.round(15 * eased));
      setStat2(Math.round(100 * eased));
      if (step >= steps) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, [statsVisible]);

  useEffect(() => {
    if (!statsRef.current) return;
    const observer = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsVisible(true); }, { threshold: 0.5 });
    observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  // Floating card rotation
  useEffect(() => {
    const timer = setInterval(() => setActiveCard((p) => (p + 1) % 4), 3500);
    return () => clearInterval(timer);
  }, []);

  function handleChatSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    sessionStorage.setItem("skillmap_query", query.trim());
    router.push(session ? "/chat" : "/auth/signup?role=STUDENT");
  }

  return (
    <div style={{ background: "var(--surface)" }}>

      {/* ═══ HERO ═══ */}
      <section className="relative px-4 overflow-hidden" style={{ background: "#0C1A1A", minHeight: "100vh", paddingTop: "7rem", paddingBottom: "4rem" }}>
        {/* BG layers */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 50% at 30% 40%, rgba(10,191,188,0.06) 0%, transparent 70%)" }} />
        <div className="absolute top-0 left-0 right-0 h-[1px] pointer-events-none" style={{ background: "linear-gradient(90deg, transparent, rgba(10,191,188,0.3), transparent)" }} />
        <div className="absolute inset-0 pointer-events-none hero-grid-bg" />

        <div className="relative mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16" style={{ maxWidth: 1200 }}>
          {/* ── LEFT SIDE (60%) ── */}
          <div className="flex-1 lg:max-w-[58%] text-center lg:text-left">
            {/* Eyebrow */}
            <div className="animate-fade-up inline-flex items-center mb-5" style={{ background: "rgba(10,191,188,0.08)", border: "1px solid rgba(10,191,188,0.2)", borderRadius: 999, padding: "0.3rem 1rem", fontFamily: "var(--font-heading)", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "#0ABFBC" }}>
              Free to start · No courses · No gatekeeping
            </div>

            {/* Headline */}
            <h1 className={heading} style={{ fontSize: "clamp(2.2rem, 5vw, 4rem)", lineHeight: 1.05, letterSpacing: "-0.03em", fontWeight: 700, marginBottom: "1.25rem" }}>
              <span className="hero-line hero-line-1" style={{ color: "#fff" }}>Nobody Told You</span>
              <span className="hero-line hero-line-2" style={{ color: "#0ABFBC" }}>What To Learn.</span>
              <span className="hero-line hero-line-3" style={{ color: "#fff" }}>We Will.</span>
            </h1>

            {/* Subheadline */}
            <p className="animate-fade-up-2" style={{ color: "#6B8F8F", fontSize: "1.05rem", lineHeight: 1.7, maxWidth: 500, marginBottom: "2rem" }}>
              Tell us your dream company. Get a week-by-week roadmap, AI mock interviews, and real mentors — built for Indian graduates.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleChatSubmit} className="animate-fade-up-3 mb-4" style={{ maxWidth: 520 }}>
              <div className="flex items-center gap-2 p-2 transition-all" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "0.75rem" }}>
                <svg className="ml-3 shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                <input id="hero-input" type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="I want to join Google as a Cyber Security Engineer..." className="flex-1 py-3 px-2 text-sm outline-none bg-transparent" style={{ color: "#fff" }} />
                <button type="submit" className="btn-primary shrink-0" style={{ padding: "0.6rem 1.25rem", fontSize: "0.85rem" }}>Get My Roadmap</button>
              </div>
              <p className="mt-2 lg:text-left text-center" style={{ color: "#4A6363", fontSize: "0.72rem" }}>Powered by Claude AI · Personalised for you</p>
            </form>

            {/* Register As */}
            <div className="animate-fade-up-3 mb-8">
              <p className={`${heading} mb-3 lg:text-left text-center`} style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem", fontWeight: 600 }}>Register As</p>
              <div className="flex flex-wrap gap-2 lg:justify-start justify-center">
                {[
                  { label: "Mentor", href: "/forms/mentor-onboarding" },
                  { label: "Company / HR", href: "/auth/signup?role=ORG" },
                  { label: "College / University", href: "/forms/institution-onboarding" },
                ].map((r) => (
                  <Link key={r.label} href={r.href} className="no-underline transition-all" style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "0.5rem", padding: "0.5rem 1.25rem", color: "rgba(255,255,255,0.8)", fontSize: "0.85rem", fontWeight: 500 }}>
                    {r.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Social Proof */}
            <div className="animate-fade-up-3">
              <div className="flex flex-wrap gap-2 lg:justify-start justify-center">
                {["TCS", "Infosys", "Google", "Deloitte", "Amazon"].map((c) => (
                  <span key={c} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#6B8F8F", fontSize: "0.72rem", borderRadius: 999, padding: "0.2rem 0.65rem" }}>{c}</span>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT SIDE (40%) — Floating Cards ── */}
          <div className="hidden lg:flex flex-col items-center justify-center" style={{ width: "38%", minHeight: 420 }}>
            <div className="relative w-full" style={{ height: 400 }}>
              {[
                { type: "JOB", icon: "💼", title: "Cybersecurity Analyst L1", company: "TCS", meta: "Bangalore · 3.5-5 LPA", badge: "Active", badgeColor: "#10b981" },
                { type: "EVENT", icon: "🎤", title: "Mock Interview Workshop", company: "By Priya S.", meta: "Free · 45 spots left", badge: "Upcoming", badgeColor: "#F59E0B" },
                { type: "COMPETITION", icon: "🏆", title: "CodeQuest Hackathon", company: "SkillMap", meta: "Rs.50K prize · 234 registered", badge: "Live", badgeColor: "#ef4444" },
                { type: "MENTOR", icon: "👨\u200D🏫", title: "1-on-1 Career Session", company: "Arjun M. · TCS", meta: "Rs.500/session · 4.9★", badge: "Available", badgeColor: "#0ABFBC" },
              ].map((card, i) => (
                <div
                  key={card.type}
                  className="absolute left-0 right-0 transition-all duration-700 ease-in-out"
                  style={{
                    top: `${i * 8}px`,
                    opacity: activeCard === i ? 1 : 0.15,
                    transform: activeCard === i ? "translateY(0) scale(1)" : `translateY(${(i - activeCard) * 20}px) scale(0.96)`,
                    zIndex: activeCard === i ? 10 : 1,
                    pointerEvents: activeCard === i ? "auto" : "none",
                  }}
                >
                  <div style={{
                    background: "linear-gradient(#0F2222, #0F2222) padding-box, linear-gradient(135deg, rgba(10,191,188,0.25), rgba(10,191,188,0.05), rgba(10,191,188,0.15)) border-box",
                    border: "1px solid transparent",
                    borderRadius: "1rem",
                    padding: "1.5rem",
                    boxShadow: activeCard === i ? "0 8px 32px rgba(10,191,188,0.1), inset 0 1px 0 rgba(255,255,255,0.05)" : "none",
                  }}>
                    <div className="flex items-start gap-3">
                      <div style={{ fontSize: "1.5rem" }}>{card.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span style={{ fontSize: "0.65rem", fontWeight: 600, color: "#4A6363", textTransform: "uppercase", letterSpacing: "0.08em" }}>{card.type}</span>
                          <span style={{ fontSize: "0.6rem", fontWeight: 700, color: card.badgeColor, background: `${card.badgeColor}15`, padding: "0.1rem 0.4rem", borderRadius: 999 }}>{card.badge}</span>
                        </div>
                        <div className={heading} style={{ color: "#fff", fontSize: "1rem", fontWeight: 700, marginBottom: "0.2rem" }}>{card.title}</div>
                        <div style={{ color: "#6B8F8F", fontSize: "0.8rem", marginBottom: "0.15rem" }}>{card.company}</div>
                        <div style={{ color: "#4A6363", fontSize: "0.75rem" }}>{card.meta}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats row — full width below */}
        <div ref={statsRef} className="relative mx-auto mt-12 grid grid-cols-3 gap-3" style={{ maxWidth: 700 }}>
          {[
            { num: statsVisible ? `${stat1}+` : "0", label: "Companies Mapped", sub: "With real interview Q&A" },
            { num: statsVisible ? `${stat2}+` : "0", label: "Interview Questions", sub: "Curated by insiders" },
            { num: "Free", label: "To Start", sub: "No credit card needed" },
          ].map((s) => (
            <div key={s.label} className="text-center card-dark" style={{ padding: "1rem 1.5rem" }}>
              <div className={heading} style={{ fontSize: "1.75rem", fontWeight: 700, color: "#fff" }}>{s.num}</div>
              <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "rgba(255,255,255,0.7)", marginTop: "0.2rem" }}>{s.label}</div>
              <div className="hidden sm:block" style={{ fontSize: "0.7rem", color: "#4A6363", marginTop: "0.15rem" }}>{s.sub}</div>
            </div>
          ))}
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
            <div className="card-dark animate-on-scroll" style={{ borderTop: "2px solid var(--primary)", padding: "2.5rem" }}>
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
            <div className="card-dark animate-on-scroll" style={{ borderTop: "2px solid var(--accent)", padding: "2.5rem" }}>
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
                <div className={heading} style={{ fontSize: "2.5rem", fontWeight: 700, color: "var(--primary)", lineHeight: 1 }}>78<span style={{ fontSize: "1rem", color: "var(--color-text-muted)" }}>/100</span></div>
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

          {/* TIER 2 — USP Cards (Bold Treatment) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: "🎯", title: "Jobs That Match You", desc: "AI calculates your skill-match percentage for every job. See only roles relevant to your domain — no spam, no noise.", tag: "Skill match % · One-click apply", stat: "85%", statLabel: "avg match accuracy", color: "#0ABFBC" },
              { icon: "👨\u200D🏫", title: "Real Mentors, Real Advice", desc: "Book 1-on-1 sessions with verified professionals from your dream companies. Free or paid from Rs.300.", tag: "Verified mentors · Rated & reviewed", stat: "4.8★", statLabel: "avg mentor rating", color: "#0ABFBC" },
              { icon: "🛡️", title: "Is That Offer Real?", desc: "Paste any offer letter. Our AI checks 20 fraud parameters. Rs.1,200 Cr lost to job scams in India last year.", tag: "20 fraud checks · Instant verdict", stat: "20", statLabel: "fraud parameters", color: "#F59E0B" },
              { icon: "🧪", title: "Prove Your Skills", desc: "Timed, proctored MCQ labs with webcam verification. Results employers actually trust.", tag: "Proctored · Auto-graded · Shareable", stat: "100%", statLabel: "employer trusted", color: "#0ABFBC" },
            ].map((f) => (
              <div key={f.title} className="card-dark animate-on-scroll group" style={{ padding: "1.75rem", borderTop: `2px solid ${f.color}`, position: "relative", overflow: "hidden" }}>
                {/* Glow effect on hover */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "60px", background: `linear-gradient(180deg, ${f.color}08, transparent)`, transition: "opacity 0.3s", opacity: 0.5 }} />
                <div style={{ position: "relative" }}>
                  {/* Stat badge — top right */}
                  <div style={{ position: "absolute", top: 0, right: 0, textAlign: "right" }}>
                    <div className={heading} style={{ fontSize: "1.5rem", fontWeight: 700, color: f.color, lineHeight: 1 }}>{f.stat}</div>
                    <div style={{ fontSize: "0.6rem", color: "#4A6363", marginTop: "0.1rem" }}>{f.statLabel}</div>
                  </div>
                  {/* Icon */}
                  <div style={{ fontSize: "1.75rem", marginBottom: "0.75rem" }}>{f.icon}</div>
                  {/* Title */}
                  <h3 className={heading} style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", marginBottom: "0.5rem", paddingRight: "3rem" }}>{f.title}</h3>
                  {/* Description */}
                  <p style={{ fontSize: "0.82rem", color: "#6B8F8F", lineHeight: 1.6, marginBottom: "0.75rem" }}>{f.desc}</p>
                  {/* Tag */}
                  <span style={{ fontSize: "0.7rem", color: f.color, fontWeight: 600 }}>{f.tag}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how-section" className="relative overflow-hidden" style={{ background: "#0C1A1A", paddingTop: "6rem", paddingBottom: "6rem" }}>
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 50% 40% at 50% 60%, rgba(10,191,188,0.05) 0%, transparent 70%)" }} />

        <div className="relative mx-auto px-4" style={{ maxWidth: 1100 }}>
          {/* Header */}
          <div className="text-center mb-16">
            <div className="section-eyebrow justify-center">HOW IT WORKS</div>
            <h2 className={heading} style={{ color: "#fff", marginBottom: "0.5rem" }}>From Confused to Hired</h2>
            <p style={{ color: "#4A6363", fontSize: "1rem" }}>Four steps. No fluff.</p>
          </div>

          {/* Steps — Cards with number, icon, content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { num: "01", icon: "✍️", title: "Create Your Profile", desc: "Add your skills, education, and target companies. Takes 3 minutes.", time: "3 min", color: "#0ABFBC" },
              { num: "02", icon: "🎯", title: "Tell Us Your Goal", desc: "Type your dream company and role. Our AI builds your personalised roadmap instantly.", time: "Instant", color: "#0ABFBC" },
              { num: "03", icon: "🤖", title: "Prepare with AI + Mentors", desc: "Follow your week-by-week plan. Practice mock interviews. Book mentor sessions.", time: "4-8 weeks", color: "#F59E0B" },
              { num: "04", icon: "🏆", title: "Apply and Get Hired", desc: "Apply to matched jobs with your skill score. Land interviews at your dream company.", time: "You're ready", color: "#10b981" },
            ].map((step, i) => (
              <div key={step.num} className="animate-on-scroll card-dark relative group" style={{ padding: "2rem 1.5rem", borderTop: `2px solid ${step.color}` }}>
                {/* Step number — large watermark */}
                <div className={heading} style={{ position: "absolute", top: "1rem", right: "1.25rem", fontSize: "3.5rem", fontWeight: 700, color: "rgba(255,255,255,0.03)", lineHeight: 1 }}>{step.num}</div>

                {/* Icon */}
                <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>{step.icon}</div>

                {/* Step label */}
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  <span className={heading} style={{ fontSize: "0.7rem", fontWeight: 700, color: step.color, background: `${step.color}15`, padding: "0.2rem 0.6rem", borderRadius: 999 }}>Step {step.num}</span>
                  <span style={{ fontSize: "0.65rem", color: "#4A6363" }}>{step.time}</span>
                </div>

                {/* Title */}
                <h3 className={heading} style={{ color: "#fff", fontWeight: 700, fontSize: "1.05rem", marginBottom: "0.5rem" }}>{step.title}</h3>

                {/* Description */}
                <p style={{ color: "#6B8F8F", fontSize: "0.85rem", lineHeight: 1.6 }}>{step.desc}</p>

                {/* Connector arrow (desktop only, not on last) */}
                {i < 3 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10" style={{ color: "rgba(255,255,255,0.15)", fontSize: "1.2rem" }}>→</div>
                )}
              </div>
            ))}
          </div>

          {/* Progress bar visual */}
          <div className="hidden md:flex items-center justify-center mt-8 gap-2" style={{ maxWidth: 600, margin: "2rem auto 0" }}>
            {[25, 50, 75, 100].map((pct, i) => (
              <div key={pct} className="flex items-center gap-2 flex-1">
                <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-full rounded-full" style={{ width: "100%", background: i === 3 ? "#10b981" : i === 2 ? "#F59E0B" : "#0ABFBC", opacity: 0.6 }} />
                </div>
                {i < 3 && <div style={{ color: "rgba(255,255,255,0.1)", fontSize: "0.6rem" }}>→</div>}
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-10">
            <p style={{ color: "#6B8F8F", fontSize: "0.9rem", marginBottom: "1rem" }}>Ready to start?</p>
            <button onClick={() => router.push(session ? "/chat" : "/auth/signup?role=STUDENT")} className="btn-primary animate-glow" style={{ padding: "0.9rem 2.2rem", fontSize: "1rem" }}>
              Build My Free Roadmap →
            </button>
          </div>
        </div>
      </section>

      {/* ═══ WHY SKILLMAP — Comparison Table ═══ */}
      <section className="px-4" style={{ background: "var(--color-bg-subtle)", paddingTop: "6rem", paddingBottom: "6rem" }}>
        <div className="mx-auto" style={{ maxWidth: 1200 }}>
          <div className="text-center mb-12">
            <div className="section-eyebrow justify-center">WHY SKILLMAP</div>
            <h2 className={heading} style={{ color: "var(--ink)" }}>Not a Course. Not a Job Board.</h2>
            <p className="mt-2 mx-auto" style={{ color: "var(--color-text-secondary)", fontSize: "1rem", maxWidth: 550, lineHeight: 1.6 }}>
              The only platform built end-to-end for Indian graduates who want a job, not a certificate.
            </p>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block mx-auto overflow-hidden" style={{ maxWidth: 900, border: "1px solid var(--color-border)", borderRadius: "1rem" }}>
            <table className="w-full" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#0D2020" }}>
                  <th style={{ padding: "1rem 1.5rem", textAlign: "left", color: "#fff", fontSize: "0.85rem", fontWeight: 600, width: "35%" }}>Feature</th>
                  <th style={{ padding: "1rem 1.5rem", textAlign: "left", color: "var(--primary)", fontSize: "0.85rem", fontWeight: 700, width: "25%" }}>SkillMap</th>
                  <th style={{ padding: "1rem 1.5rem", textAlign: "left", color: "var(--color-text-secondary)", fontSize: "0.85rem", fontWeight: 500 }}>Naukri / LinkedIn</th>
                  <th style={{ padding: "1rem 1.5rem", textAlign: "left", color: "var(--color-text-secondary)", fontSize: "0.85rem", fontWeight: 500 }}>upGrad / Scaler</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "AI Career Roadmap", sm: "✓ Free, personalised", nk: "✗ Not available", up: "~ Paid courses only" },
                  { feature: "Company-Specific Prep", sm: "✓ 15 companies mapped", nk: "✗ Generic listings", up: "✗ Generic curriculum" },
                  { feature: "AI Mock Interviews", sm: "✓ Real-time feedback", nk: "✗ Not available", up: "~ Limited, paid" },
                  { feature: "Verified Mentors", sm: "✓ Book from Rs.300", nk: "✗ No mentoring", up: "~ Expensive packages" },
                  { feature: "Fake Offer Detection", sm: "✓ AI-powered, instant", nk: "✗ Not available", up: "✗ Not available" },
                  { feature: "Proctored Skill Labs", sm: "✓ Free, employer-trusted", nk: "✗ Not available", up: "~ Paid add-on" },
                  { feature: "Cost", sm: "✓ Free or Rs.299/mo", nk: "~ Free but limited", up: "✗ Rs.3-4 Lakhs" },
                ].map((row, i) => (
                  <tr key={row.feature} style={{ background: i % 2 === 0 ? "#fff" : "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "1rem 1.5rem", fontWeight: 600, color: "var(--color-text-primary)", fontSize: "0.9rem" }}>{row.feature}</td>
                    <td style={{ padding: "1rem 1.5rem", fontSize: "0.9rem" }}>
                      <span style={{ color: "var(--primary)", fontWeight: 700 }}>{row.sm.charAt(0)}</span>
                      <span style={{ color: "var(--color-text-primary)", marginLeft: 4 }}>{row.sm.slice(1)}</span>
                    </td>
                    <td style={{ padding: "1rem 1.5rem", fontSize: "0.85rem" }}>
                      <span style={{ color: row.nk.startsWith("✗") ? "#D1D5DB" : "#F59E0B", fontWeight: 700 }}>{row.nk.charAt(0)}</span>
                      <span style={{ color: "var(--color-text-secondary)", marginLeft: 4 }}>{row.nk.slice(1)}</span>
                    </td>
                    <td style={{ padding: "1rem 1.5rem", fontSize: "0.85rem" }}>
                      <span style={{ color: row.up.startsWith("✗") ? "#D1D5DB" : row.up.startsWith("~") ? "#F59E0B" : "var(--primary)", fontWeight: 700 }}>{row.up.charAt(0)}</span>
                      <span style={{ color: "var(--color-text-secondary)", marginLeft: 4 }}>{row.up.slice(1)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: Stacked Cards (SkillMap column only) */}
          <div className="md:hidden space-y-3">
            {[
              { feature: "AI Career Roadmap", value: "Free, personalised" },
              { feature: "Company-Specific Prep", value: "15 companies mapped" },
              { feature: "AI Mock Interviews", value: "Real-time feedback" },
              { feature: "Verified Mentors", value: "Book from Rs.300" },
              { feature: "Fake Offer Detection", value: "AI-powered, instant" },
              { feature: "Proctored Skill Labs", value: "Free, employer-trusted" },
              { feature: "Cost", value: "Free or Rs.299/mo" },
            ].map((r) => (
              <div key={r.feature} style={{ background: "#fff", border: "1px solid var(--color-border)", borderRadius: "0.75rem", padding: "1rem 1.25rem" }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "0.25rem" }}>{r.feature}</div>
                <div style={{ fontSize: "0.85rem", color: "var(--primary)", fontWeight: 600 }}>✓ {r.value}</div>
              </div>
            ))}
          </div>

          <p className="text-center mt-6" style={{ color: "var(--color-text-secondary)", fontSize: "0.8rem" }}>
            * Competitor features based on publicly available information, April 2026
          </p>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section className="px-4" style={{ background: "#FFFFFF", paddingTop: "6rem", paddingBottom: "6rem" }}>
        <div className="mx-auto" style={{ maxWidth: 900 }}>
          <div className="text-center mb-12">
            <div className="section-eyebrow justify-center">SUCCESS STORIES</div>
            <h2 className={heading} style={{ color: "var(--ink)" }}>They Were Exactly Where You Are.</h2>
            <p className="mt-1" style={{ color: "var(--color-text-secondary)", fontSize: "1rem" }}>Then they used SkillMap.</p>
          </div>

          {/* Featured Quote */}
          <div className="mb-6" style={{ background: "#0D2020", border: "1px solid rgba(10,191,188,0.15)", borderRadius: "1rem", padding: "3rem", maxWidth: 750, margin: "0 auto 1.5rem" }}>
            <div style={{ color: "#F59E0B", fontSize: "1rem", marginBottom: "0.75rem" }}>★★★★★</div>
            <div style={{ color: "var(--primary)", fontFamily: "Georgia, serif", fontSize: "5rem", lineHeight: 0, marginBottom: "1.5rem" }}>&ldquo;</div>
            <p className={heading} style={{ color: "#fff", fontSize: "1.3rem", fontWeight: 500, lineHeight: 1.6, marginBottom: "1.5rem" }}>
              SkillMap told me I was missing CEH certification for TCS Cybersecurity. Got it in 5 weeks. Got the call in week 6.
            </p>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center shrink-0" style={{ width: "2.5rem", height: "2.5rem", borderRadius: "50%", background: "var(--primary)", color: "#fff", fontWeight: 700, fontSize: "0.85rem" }}>RK</div>
              <div>
                <div style={{ color: "#fff", fontWeight: 600, fontSize: "0.95rem" }}>Rahul Kumar</div>
                <div style={{ color: "var(--color-text-secondary)", fontSize: "0.8rem" }}>B.Tech CSE, 2025 · Now at TCS</div>
              </div>
            </div>
          </div>

          {/* Supporting Quotes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ maxWidth: 750, margin: "0 auto" }}>
            {[
              { quote: "Nobody told me KPMG looks for ISO 27001 knowledge. SkillMap's roadmap was so specific — I knew exactly what to do.", name: "Priya Sharma", role: "MBA Finance, 2025 · Now at KPMG", initials: "PS" },
              { quote: "The AI advisor felt like talking to a senior who actually knew what they were talking about. Cracked Infosys first attempt.", name: "Sneha Joshi", role: "B.Tech IT, 2026 · Infosys", initials: "SJ" },
            ].map((r) => (
              <div key={r.name} style={{ background: "#fff", border: "1px solid var(--color-border)", borderRadius: "0.75rem", padding: "2rem" }}>
                <div style={{ color: "#F59E0B", fontSize: "0.85rem", marginBottom: "0.75rem" }}>★★★★★</div>
                <div style={{ color: "var(--primary)", fontFamily: "Georgia, serif", fontSize: "2.5rem", lineHeight: 0, marginBottom: "1rem" }}>&ldquo;</div>
                <p style={{ fontSize: "1rem", color: "var(--color-text-primary)", lineHeight: 1.65, marginBottom: "1.25rem" }}>{r.quote}</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center shrink-0" style={{ width: "2rem", height: "2rem", borderRadius: "50%", background: "var(--primary-light)", color: "var(--primary)", fontWeight: 700, fontSize: "0.7rem" }}>{r.initials}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--color-text-primary)" }}>{r.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>{r.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center mt-8" style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>
            Join students who stopped guessing and started preparing.
          </p>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="px-4" style={{ background: "#0C1A1A", paddingTop: "6rem", paddingBottom: "6rem" }}>
        <div className="mx-auto" style={{ maxWidth: 700 }}>
          <div className="text-center mb-10">
            <div className="section-eyebrow justify-center">FAQ</div>
            <h2 className={heading} style={{ color: "#fff" }}>Questions We Get A Lot.</h2>
          </div>

          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <div
                key={i}
                className={`overflow-hidden transition-all duration-300 ${openFaq === i ? "faq-open" : ""}`}
                style={{
                  background: openFaq === i ? "rgba(10,191,188,0.05)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${openFaq === i ? "rgba(10,191,188,0.25)" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: "0.75rem",
                }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex justify-between items-center text-left bg-transparent border-none cursor-pointer"
                  style={{ padding: "1.25rem 1.5rem" }}
                >
                  <span style={{ fontWeight: 600, color: "#fff", fontSize: "0.95rem", paddingRight: "1rem" }}>{item.q}</span>
                  <span className="shrink-0 faq-icon transition-transform duration-300" style={{ color: openFaq === i ? "#0ABFBC" : "#4A6363", fontSize: "1.2rem" }}>+</span>
                </button>
                <div className="faq-answer" style={{ padding: "0 1.5rem", color: "#6B8F8F", fontSize: "0.9rem", lineHeight: 1.7 }}>
                  {item.a}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section
        className="relative px-4 text-center"
        style={{ background: "#0D2020", paddingTop: "7rem", paddingBottom: "7rem" }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(10,191,188,0.12) 0%, transparent 70%)" }} />

        <div className="relative mx-auto" style={{ maxWidth: 650 }}>
          {/* Eyebrow pill */}
          <div
            className="inline-flex items-center mb-6"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(10,191,188,0.2)",
              borderRadius: 999,
              padding: "0.3rem 1rem",
              fontSize: "0.7rem",
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase" as const,
              color: "var(--primary)",
            }}
          >
            Your next step takes 2 minutes
          </div>

          {/* Headline */}
          <h2 className={heading} style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 700, lineHeight: 1.1, color: "#fff", marginBottom: "1rem" }}>
            Your Dream Company<br />Is Looking For Someone<br /><span style={{ color: "var(--primary)" }}>Exactly Like You.</span>
          </h2>

          <p style={{ color: "var(--color-text-secondary)", fontSize: "1rem", marginBottom: "2.5rem" }}>
            Tell us where you want to go. We&apos;ll show you exactly how to get there.
          </p>

          {/* Input Bar */}
          <form onSubmit={handleChatSubmit} className="max-w-lg mx-auto">
            <div
              className="flex items-center gap-2 p-2"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "0.625rem",
              }}
            >
              <svg className="ml-3 shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="I want to join Deloitte as a Data Analyst..."
                className="flex-1 py-3 px-2 text-sm outline-none bg-transparent"
                style={{ color: "#fff" }}
              />
              <button
                type="submit"
                className="shrink-0 font-semibold transition-all"
                style={{ background: "var(--primary)", color: "#fff", padding: "0.6rem 1.25rem", fontSize: "0.85rem", borderRadius: "0.5rem", border: "none", cursor: "pointer" }}
              >
                Start Free →
              </button>
            </div>
          </form>

          <p className="mt-3" style={{ color: "var(--color-text-secondary)", fontSize: "0.8rem" }}>
            Free to start · No credit card · No courses to buy
          </p>

          {/* Trust badges */}
          <div className="flex justify-center gap-2 mt-3 flex-wrap">
            {["🔒 Secure", "🤖 AI-Powered", "🇮🇳 Built for India"].map((badge) => (
              <span
                key={badge}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 999,
                  padding: "0.3rem 0.8rem",
                  color: "var(--color-text-muted)",
                  fontSize: "0.75rem",
                }}
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
