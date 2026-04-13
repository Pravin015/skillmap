"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const syne = "font-[family-name:var(--font-syne)]";

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
      <section className="px-4 pt-24 pb-16 md:pt-32 md:pb-20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="section-eyebrow animate-fade-up justify-center">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ background: "var(--primary)" }} />
            India&apos;s #1 Job-Readiness Platform
          </div>

          <h1 className={`${syne} font-extrabold leading-tight tracking-tight mb-5 animate-fade-up-1`} style={{ fontSize: "clamp(2.2rem, 5vw, 3.5rem)", color: "var(--ink)" }}>
            Your Career <span style={{ color: "var(--primary)" }}>Starts</span> Here
          </h1>

          <p className="text-base md:text-lg max-w-xl mx-auto mb-8 animate-fade-up-2" style={{ color: "var(--muted)", lineHeight: 1.7 }}>
            Tell us your dream company and role — we&apos;ll build your personalised roadmap with AI-powered guidance, mock interviews, and mentor support.
          </p>

          {/* Chat Bar */}
          <form onSubmit={handleChatSubmit} className="max-w-xl mx-auto mb-5 animate-fade-up-3">
            <div className="flex items-center gap-2 rounded-2xl border-2 bg-white p-2 transition-all focus-within:border-[var(--primary)]" style={{ borderColor: "var(--border)" }}>
              <svg className="ml-3 shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="I want to join Google as a Software Engineer..."
                className="flex-1 py-3 px-2 text-sm outline-none bg-transparent"
                style={{ color: "var(--ink)" }}
              />
              <button type="submit" className="btn-primary shrink-0" style={{ borderRadius: 12, padding: "10px 20px" }}>
                Get My Roadmap
              </button>
            </div>
          </form>

          <p className="text-xs animate-fade-up-3" style={{ color: "var(--muted)" }}>
            {session ? "Powered by AI — personalised for you" : (
              <>Free to start · No credit card · <Link href="/auth/login" className="font-medium no-underline" style={{ color: "var(--primary)" }}>Already have an account?</Link></>
            )}
          </p>
        </div>
      </section>

      {/* ═══ COMPANY LOGOS ═══ */}
      <section className="px-4 pb-10">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-[11px] font-medium tracking-wider uppercase mb-5" style={{ color: "var(--muted)" }}>
            Trusted by students targeting
          </p>
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-3">
            {logoCompanies.map((name) => (
              <span key={name} className={`${syne} text-sm font-bold`} style={{ color: "var(--border)" }}>
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section className="px-4 pb-16">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-4">
          {[
            { num: "15+", label: "Companies Mapped", desc: "With interview Q&A and skill maps" },
            { num: "100+", label: "Interview Questions", desc: "Curated by industry and difficulty" },
            { num: "6", label: "Role Dashboards", desc: "Student, HR, Mentor, Company, Institution, Admin" },
          ].map((s) => (
            <div key={s.label} className="card-elevated text-center">
              <div className={`${syne} text-2xl md:text-3xl font-extrabold mb-1`} style={{ color: "var(--primary)" }}>{s.num}</div>
              <div className="text-xs font-semibold mb-0.5" style={{ color: "var(--ink)" }}>{s.label}</div>
              <div className="text-[10px] hidden md:block" style={{ color: "var(--muted)" }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section className="px-4 py-16" style={{ background: "var(--surface-alt)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="section-eyebrow justify-center">Features</div>
            <h2 className={`${syne} font-extrabold text-2xl md:text-3xl`} style={{ color: "var(--ink)" }}>
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
      <section className="px-4 py-16" style={{ background: "var(--surface)" }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="section-eyebrow justify-center">How it works</div>
            <h2 className={`${syne} font-extrabold text-2xl md:text-3xl`} style={{ color: "var(--ink)" }}>
              From Confused to Hired
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {howSteps.map((s) => (
              <div key={s.num} className="card-elevated relative" style={{ padding: "28px 20px" }}>
                <div className={`${syne} text-4xl font-extrabold absolute top-3 right-4`} style={{ color: "var(--primary)", opacity: 0.08 }}>{s.num}</div>
                <div className={`${syne} text-xs font-bold mb-3 inline-block px-2 py-0.5 rounded`} style={{ background: "var(--primary-light)", color: "var(--primary)" }}>Step {s.num}</div>
                <h3 className={`${syne} text-sm font-bold mb-2`} style={{ color: "var(--ink)" }}>{s.title}</h3>
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
            <h2 className={`${syne} font-extrabold text-2xl md:text-3xl`} style={{ color: "var(--ink)" }}>
              Not a Job Board. A Readiness Engine.
            </h2>
            <p className="text-sm mt-2" style={{ color: "var(--muted)" }}>What competitors don&apos;t offer — we include for free</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {whyUs.map((d) => (
              <div key={d.title} className="card-elevated" style={{ borderLeft: "3px solid var(--primary)" }}>
                <h3 className={`${syne} text-sm font-bold mb-2`} style={{ color: "var(--ink)" }}>{d.title}</h3>
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
            <h2 className={`${syne} font-extrabold text-2xl md:text-3xl`} style={{ color: "var(--ink)" }}>
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
          <h2 className={`${syne} font-extrabold text-2xl text-center mb-8`} style={{ color: "var(--ink)" }}>
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
          <h2 className={`${syne} font-extrabold text-xl md:text-2xl text-white mb-3`}>
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
