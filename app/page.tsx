"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const syne = "font-[family-name:var(--font-syne)]";

const logoCompanies = ["Google", "Amazon", "TCS", "Infosys", "Wipro", "Deloitte", "KPMG", "Flipkart", "Microsoft", "Accenture"];

const features = [
  { icon: "🤖", title: "AI Career Advisor", desc: "Get personalised career guidance powered by AI", href: "/chat" },
  { icon: "🎤", title: "Mock Interviews", desc: "Practice with AI interviewers for 15+ companies", href: "/mock-interview" },
  { icon: "💼", title: "Job Matching", desc: "Domain-filtered jobs with skill-match scoring", href: "/jobs" },
  { icon: "🧑‍🏫", title: "Mentor Sessions", desc: "1-on-1 sessions with verified industry mentors", href: "/companies" },
  { icon: "🧪", title: "Lab Assessments", desc: "Timed MCQ labs for technical screening", href: "/jobs" },
  { icon: "📅", title: "Events", desc: "Workshops, webinars, and career events", href: "/events" },
  { icon: "📝", title: "Blog", desc: "Career tips from mentors, HR, and experts", href: "/blog" },
  { icon: "📊", title: "Skill Tracking", desc: "Track your progress across all activities", href: "/dashboard" },
];

const howItWorks = [
  { step: "01", icon: "✍️", title: "Sign Up in 3 Minutes", desc: "Create your account, verify email, add your skills and career preferences." },
  { step: "02", icon: "🎯", title: "Tell Us Your Dream Company", desc: "Type which company and role you want — our AI builds your roadmap instantly." },
  { step: "03", icon: "📋", title: "Follow Your AI Roadmap", desc: "Week-by-week prep plan with free resources, mock interviews, and skill tracking." },
  { step: "04", icon: "🏆", title: "Get Hired", desc: "Apply to matched jobs, ace the interview, and land your offer." },
];

const differentiators = [
  { icon: "🎤", title: "AI-Powered Interview Prep", desc: "Practice mock interviews for TCS, Google, Amazon, and 12 more companies. Get real-time feedback and scores on every answer." },
  { icon: "🗺️", title: "Company-Specific Skill Maps", desc: "Know exactly what skills TCS, KPMG, or Deloitte require. No guessing — we've decoded the hiring patterns." },
  { icon: "👨‍🏫", title: "Real Mentor Sessions", desc: "Book paid or free 1-on-1 sessions with verified industry professionals. Get insider guidance." },
  { icon: "🧪", title: "Lab Assessments & Scoring", desc: "Take timed assessments attached to job applications. HR sees your score — show your skills, not just your resume." },
];

const reviews = [
  { quote: "SkillMap told me I was missing CEH certification for TCS Cybersecurity. Got it in 5 weeks. Got the call in week 6.", name: "Rahul Kumar", role: "B.Tech CSE, 2025", company: "TCS", color: "#00b9f2" },
  { quote: "Nobody told me KPMG looks for ISO 27001 knowledge. SkillMap's roadmap was so specific — I knew exactly what to do every week.", name: "Priya Sharma", role: "MBA Finance, 2025", company: "KPMG", color: "#00338d" },
  { quote: "The AI advisor felt like talking to a senior who actually knew what they were talking about. Cracked Infosys in my first attempt.", name: "Sneha Joshi", role: "B.Tech IT, 2025", company: "Infosys", color: "#007cc3" },
];

const faqItems = [
  { q: "Is SkillMap only for engineering graduates?", a: "Not at all. We cover paths for B.Com, BBA, B.Sc, BA, MBA, MCA and more. KPMG, Deloitte, EY and many others actively hire from non-engineering backgrounds." },
  { q: "How does the AI know what skills I need?", a: "We've built a detailed database of skill requirements for each company and role — sourced from job descriptions, interview reports, and hiring pattern research. The AI cross-references this with your background." },
  { q: "How long does it take to get hired?", a: "For fresher-friendly companies like TCS and Wipro, 4-8 weeks of focused prep. For Google or Deloitte, 3-6 months. We give you an honest timeline." },
  { q: "Is it free?", a: "Yes, the core platform is free — jobs, AI advisor, mock interviews, and events. Premium features like unlimited AI sessions and priority support are available with Career Ready plan at Rs.299/mo." },
  { q: "What if my dream company isn't hiring right now?", a: "We'll show you similar companies with matching culture and skill requirements. You still get the prep plan so you're ready the moment they open up. We also send alerts." },
];

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  function handleChatSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    if (session) {
      // Logged in — go straight to AI advisor
      sessionStorage.setItem("skillmap_query", query.trim());
      router.push("/chat");
    } else {
      // Not logged in — save query and go to signup
      sessionStorage.setItem("skillmap_query", query.trim());
      router.push("/auth/signup?role=STUDENT");
    }
  }

  return (
    <div className="flex flex-col" style={{ background: "var(--surface)" }}>

      {/* ═══ HERO ═══ */}
      <section className="px-4 md:px-8 pt-28 pb-16 md:pt-36 md:pb-24">
        <div className="max-w-3xl mx-auto text-center">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-[11px] font-semibold tracking-wide uppercase ${syne}`} style={{ background: "rgba(232,255,71,0.2)", color: "var(--ink)" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent)" }} />
            India&apos;s job-readiness platform
          </div>

          <h1 className={`${syne} font-extrabold leading-[1.1] tracking-tight mb-4`} style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", color: "var(--ink)" }}>
            Your Career Starts Here.
          </h1>

          <p className="text-base md:text-lg max-w-xl mx-auto mb-8 leading-relaxed" style={{ color: "var(--muted)" }}>
            Tell us your dream company and role — we&apos;ll show you the path to get hired with AI-powered guidance.
          </p>

          {/* Chat Bar */}
          <form onSubmit={handleChatSubmit} className="max-w-xl mx-auto mb-4">
            <div className="flex items-center gap-2 rounded-2xl border bg-white p-2 shadow-lg shadow-black/5 transition-shadow focus-within:shadow-xl focus-within:shadow-black/10" style={{ borderColor: "var(--border)" }}>
              <span className="pl-3 text-lg">🔍</span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="I want to join Google as a Software Engineer..."
                className="flex-1 py-3 px-2 text-sm outline-none bg-transparent"
                style={{ color: "var(--ink)" }}
              />
              <button
                type="submit"
                className={`${syne} shrink-0 rounded-xl px-5 py-3 text-sm font-bold transition-all hover:opacity-90`}
                style={{ background: "var(--ink)", color: "var(--accent)" }}
              >
                Get My Roadmap →
              </button>
            </div>
          </form>

          <div className="text-xs" style={{ color: "var(--muted)" }}>
            {session ? (
              <span>Powered by AI · Personalised for you</span>
            ) : (
              <span>Free to start · No credit card · <Link href="/auth/login" className="underline" style={{ color: "var(--ink)" }}>Already have an account?</Link></span>
            )}
          </div>
        </div>
      </section>

      {/* ═══ COMPANY LOGOS ═══ */}
      <section className="px-4 pb-12">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-[11px] font-medium mb-4 tracking-wide uppercase" style={{ color: "var(--muted)" }}>
            Trusted by students targeting
          </p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
            {logoCompanies.map((name) => (
              <span key={name} className={`${syne} text-sm font-bold opacity-30 hover:opacity-60 transition-opacity`} style={{ color: "var(--ink)" }}>
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section className="px-4 pb-16">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-3">
          {[
            { num: "15+", label: "Companies Mapped", sub: "With interview questions & skill maps" },
            { num: "100+", label: "Interview Questions", sub: "Curated by industry & difficulty" },
            { num: "6", label: "Role Dashboards", sub: "Student, HR, Mentor, Admin & more" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border bg-white p-5 md:p-6 text-center" style={{ borderColor: "var(--border)" }}>
              <div className={`${syne} text-2xl md:text-3xl font-extrabold mb-1`} style={{ color: "var(--ink)" }}>{s.num}</div>
              <div className="text-xs font-medium mb-0.5" style={{ color: "var(--ink)" }}>{s.label}</div>
              <div className="text-[10px] hidden md:block" style={{ color: "var(--muted)" }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FEATURES GRID ═══ */}
      <section className="px-4 py-16" style={{ background: "white" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className={`${syne} font-extrabold text-xl md:text-2xl mb-2`} style={{ color: "var(--ink)" }}>
              Everything You Need to Get Hired
            </h2>
            <p className="text-sm" style={{ color: "var(--muted)" }}>Full-stack career readiness platform for Indian graduates</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {features.map((f) => (
              <Link
                key={f.title}
                href={f.href}
                className="rounded-2xl border p-5 text-center transition-all hover:-translate-y-0.5 hover:shadow-md no-underline group"
                style={{ borderColor: "var(--border)", background: "var(--surface)" }}
              >
                <div className="text-2xl mb-2">{f.icon}</div>
                <div className={`${syne} text-xs font-bold mb-1 group-hover:underline`} style={{ color: "var(--ink)" }}>{f.title}</div>
                <div className="text-[10px] leading-relaxed" style={{ color: "var(--muted)" }}>{f.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="px-4 py-16" style={{ background: "var(--surface)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className={`${syne} font-extrabold text-xl md:text-2xl mb-2`} style={{ color: "var(--ink)" }}>
              How SkillMap Works
            </h2>
            <p className="text-sm" style={{ color: "var(--muted)" }}>From confused to hired — in four simple steps</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {howItWorks.map((s) => (
              <div key={s.step} className="rounded-2xl border bg-white p-6 relative" style={{ borderColor: "var(--border)" }}>
                <div className={`${syne} text-4xl font-extrabold absolute top-4 right-4 opacity-[0.06]`}>{s.step}</div>
                <div className="text-2xl mb-3">{s.icon}</div>
                <h3 className={`${syne} text-sm font-bold mb-1.5`} style={{ color: "var(--ink)" }}>{s.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ DIFFERENTIATORS ═══ */}
      <section className="px-4 py-16" style={{ background: "white" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className={`${syne} font-extrabold text-xl md:text-2xl mb-2`} style={{ color: "var(--ink)" }}>
              What Makes SkillMap Different
            </h2>
            <p className="text-sm" style={{ color: "var(--muted)" }}>Not a job board. A complete career readiness engine.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {differentiators.map((d) => (
              <div key={d.title} className="rounded-2xl border p-6 transition-all hover:shadow-md" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                <div className="text-2xl mb-3">{d.icon}</div>
                <h3 className={`${syne} text-sm font-bold mb-1.5`} style={{ color: "var(--ink)" }}>{d.title}</h3>
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
            <h2 className={`${syne} font-extrabold text-xl md:text-2xl mb-2`} style={{ color: "var(--ink)" }}>
              Real Results. Real People.
            </h2>
            <p className="text-sm" style={{ color: "var(--muted)" }}>Fresh graduates who went from confused to hired using SkillMap</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reviews.map((r) => (
              <div key={r.name} className="rounded-2xl border bg-white p-6 transition-all hover:-translate-y-0.5 hover:shadow-md" style={{ borderColor: "var(--border)" }}>
                <div className="text-sm mb-1 tracking-wider" style={{ color: "#f59e0b" }}>★★★★★</div>
                <p className="text-sm leading-relaxed mb-4 italic" style={{ color: "var(--ink)" }}>&ldquo;{r.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${syne} font-bold text-xs text-white shrink-0`} style={{ background: r.color }}>
                    {r.name.split(" ").map((w) => w[0]).join("")}
                  </div>
                  <div>
                    <div className={`${syne} text-xs font-bold`} style={{ color: "var(--ink)" }}>{r.name}</div>
                    <div className="text-[10px]" style={{ color: "var(--muted)" }}>{r.role} · {r.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="px-4 py-16" style={{ background: "white" }}>
        <div className="max-w-2xl mx-auto">
          <h2 className={`${syne} font-extrabold text-xl md:text-2xl text-center mb-8`} style={{ color: "var(--ink)" }}>
            Frequently Asked Questions
          </h2>

          <div className="space-y-2">
            {faqItems.map((item, i) => (
              <div key={i} className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex justify-between items-center p-4 text-left bg-transparent border-none cursor-pointer"
                >
                  <span className={`${syne} text-sm font-bold pr-4`} style={{ color: "var(--ink)" }}>{item.q}</span>
                  <span className="text-lg shrink-0 transition-transform duration-300" style={{ color: "var(--muted)", transform: openFaq === i ? "rotate(45deg)" : "none" }}>+</span>
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="px-4 py-20" style={{ background: "var(--ink)" }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className={`${syne} font-extrabold text-xl md:text-2xl text-white mb-3`}>
            Your Dream Company is Hiring Right Now.
          </h2>
          <p className="text-sm mb-8" style={{ color: "rgba(255,255,255,0.5)" }}>
            Tell us where you want to be — we&apos;ll show you how to get there.
          </p>

          <form onSubmit={handleChatSubmit} className="max-w-lg mx-auto mb-4">
            <div className="flex items-center gap-2 rounded-2xl p-2" style={{ background: "rgba(255,255,255,0.1)" }}>
              <span className="pl-3 text-lg">🔍</span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="I want to join Amazon as a Data Analyst..."
                className="flex-1 py-3 px-2 text-sm outline-none bg-transparent text-white placeholder:text-white/40"
              />
              <button
                type="submit"
                className={`${syne} shrink-0 rounded-xl px-5 py-3 text-sm font-bold transition-all hover:opacity-90`}
                style={{ background: "var(--accent)", color: "var(--ink)" }}
              >
                Start Free →
              </button>
            </div>
          </form>

          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            Free to start · No credit card · Takes 3 minutes
          </p>
        </div>
      </section>
    </div>
  );
}
