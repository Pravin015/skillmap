"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/* ─── DATA ─── */
const tickerCompanies = ["Google", "TCS", "KPMG", "Deloitte", "Infosys", "Wipro", "Microsoft", "Amazon", "Accenture", "EY", "PwC", "Cognizant"];

const problemCards = [
  { num: "40%", title: "Graduate unemployment", desc: "Under-25 graduates in India. Not from lack of talent — from lack of direction. (Azim Premji University, 2026)" },
  { num: "55%", title: "Skill mismatch", desc: "Of fresh graduates are considered unemployable by industry — not because they failed, but because no one told them what to learn." },
  { num: "0", title: "Clear roadmaps", desc: "Job boards show you openings. Nobody tells you what you're missing, how long it takes to fix it, or where to start." },
  { num: "10M+", title: "New graduates yearly", desc: "Every year, millions of smart young Indians enter the job market confused, unprepared, and without guidance." },
];

const steps = [
  { num: "01", icon: "🎯", title: "Pick your dream companies", desc: "Select up to 5 companies you want to work at — Google, TCS, KPMG, Deloitte, or any of our 50+ mapped companies.", tag: "2 minutes" },
  { num: "02", icon: "🔍", title: "Choose your domain", desc: "Cybersecurity, Cloud, Data Analytics, Software Dev, Consulting — tell us where your interest lies.", tag: "30 seconds" },
  { num: "03", icon: "⚡", title: "See live matches", desc: "We instantly surface which of your dream companies are actively hiring in your domain, with exact skill requirements.", tag: "Instant" },
  { num: "04", icon: "🗺️", title: "Get your roadmap", desc: "Our AI builds a personalised week-by-week prep plan — courses, certifications, practice resources — to make you application-ready.", tag: "AI-powered" },
];

const companyCards = [
  { logo: "G", bg: "#4285f4", name: "Google", type: "Big Tech · Software / Cloud", skills: ["DSA & Algorithms", "System Design", "Python / Java", "LeetCode 200+"], badge: "25–40 LPA" },
  { logo: "TC", bg: "#00b9f2", name: "TCS", type: "IT Services · Fresher-friendly", skills: ["Java / Python", "SQL", "Agile basics", "CEH (Cyber)"], badge: "3.5–5 LPA" },
  { logo: "K", bg: "#00338d", name: "KPMG", type: "Consulting · Cyber / Data", skills: ["ISO 27001", "Risk frameworks", "Excel advanced", "Power BI"], badge: "5–8 LPA" },
  { logo: "D", bg: "#86bc25", name: "Deloitte", type: "Consulting · Cyber / Data / AI", skills: ["Penetration testing", "OWASP", "Python", "Case interviews"], badge: "6–9 LPA" },
  { logo: "I", bg: "#007cc3", name: "Infosys", type: "IT Services · Fresher-friendly", skills: ["Java", "OOPS concepts", "AWS basics", "HackWithInfy prep"], badge: "3.6–5 LPA" },
  { logo: "W", bg: "#9b59b6", name: "Wipro", type: "IT Services · Fresher-friendly", skills: ["Python / Java", "Data structures", "NLTH test prep", "Communication"], badge: "3.5–4.5 LPA" },
];

const solutionFeatures = [
  { title: "Live job matching", desc: "Only see roles at your dream companies that are actually open right now — no noise, no irrelevant listings." },
  { title: "Exact skill gap analysis", desc: "We compare what the role needs vs what you likely have and show the precise gap — not vague advice." },
  { title: "AI-generated prep plan", desc: "Week-by-week actions: what to learn, where to learn it, and when to apply. Built specifically for you." },
  { title: "Interview process decoded", desc: "Know exactly what TCS, KPMG, Google's hiring process looks like — rounds, format, what they test." },
];

const reviews = [
  { company: "TCS", quote: "I had been applying randomly for 4 months and got nothing. SkillMap told me I was missing CEH certification for TCS Cybersecurity. I got it in 5 weeks. Got the call in week 6. I'm joining TCS next month.", name: "Rahul Kumar", role: "B.Tech CSE, 2025 · Pune", initials: "RK", color: "#00b9f2" },
  { company: "KPMG", quote: "Nobody told me KPMG looks for ISO 27001 knowledge and Excel skills, not just a degree. SkillMap's roadmap was so specific — I knew exactly what to do every single week. Placed at KPMG at 6 LPA.", name: "Priya Sharma", role: "MBA Finance, 2025 · Mumbai", initials: "PS", color: "#00338d" },
  { company: "Deloitte", quote: "I was about to give up and settle for a random BPO job. SkillMap showed me Deloitte had a Data & AI analyst opening. 7 weeks of focused prep later — I cleared all 3 rounds. Still can't believe it.", name: "Arjun Mehta", role: "B.Sc Statistics, 2024 · Bangalore", initials: "AM", color: "#86bc25" },
  { company: "Infosys", quote: "The AI advisor felt like talking to a senior who actually knew what they were talking about. It told me to focus on HackWithInfy prep and Java fundamentals. Cracked Infosys in my first attempt.", name: "Sneha Joshi", role: "B.Tech IT, 2025 · Hyderabad", initials: "SJ", color: "#007cc3" },
  { company: "Wipro", quote: "My college placement cell gave us nothing useful. SkillMap gave me a complete 8-week plan for Wipro's NLTH test. I knew exactly what to expect. Got placed in 2 months of using this platform.", name: "Vikram Rao", role: "B.E Mechanical, 2024 · Chennai", initials: "VR", color: "#9b59b6" },
  { company: "Google", quote: "I always thought Google was impossible for someone from a tier-2 college. SkillMap showed me the exact DSA topics and LeetCode patterns Google tests. 6 months of honest prep. I got the offer. Dreams do come true.", name: "Nisha Kulkarni", role: "B.Tech CSE, 2024 · Nagpur", initials: "NK", color: "#4285f4" },
];

const faqItems = [
  { q: "Is SkillMap only for engineering graduates?", a: "Not at all. We cover paths for B.Com, BBA, B.Sc, BA, MBA, MCA and more. KPMG, Deloitte, EY and many others actively hire from non-engineering backgrounds for consulting, data, and finance roles. We have skill maps for all of them." },
  { q: "How current are the job listings?", a: "We refresh job listings weekly from official company career pages and trusted job APIs. Each listing shows when it was posted and the application deadline so you always know how fresh it is." },
  { q: "How does the AI know what skills I need?", a: "We've built a detailed database of skill requirements for each company and role — sourced from job descriptions, interview reports, and hiring pattern research. The AI cross-references this with your background to identify the exact gap." },
  { q: "How long does it realistically take to get hired?", a: "It depends on your current skill level and the target role. For fresher-friendly companies like TCS and Wipro, a focused 4–8 week prep is often enough. For Google or Deloitte, expect 3–6 months of serious preparation. We give you an honest timeline — not false promises." },
  { q: "Are the courses and resources free?", a: "We prioritise free resources — YouTube channels, official documentation, free Coursera audits, and open-source practice platforms. We only recommend paid certifications (like CEH or AWS) when they're genuinely required by the company you're targeting." },
  { q: "What if none of my dream companies are hiring?", a: "We'll show you the closest alternatives — companies with similar culture, pay, and skill requirements that are actively hiring. You still get the prep plan so you're ready the moment your dream company opens up. We also send you alerts when they do." },
];

/* ─── COMPONENT ─── */
export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const revealRefs = useRef<HTMLElement[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        });
      },
      { threshold: 0.1 }
    );
    revealRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  function addRevealRef(el: HTMLElement | null) {
    if (el && !revealRefs.current.includes(el)) revealRefs.current.push(el);
  }

  const syne = "font-[family-name:var(--font-syne)]";

  return (
    <div className="flex flex-col">
      {/* ═══ HERO ═══ */}
      <section className="min-h-screen flex flex-col justify-center px-6 md:px-12 pt-32 pb-20 relative overflow-hidden" style={{ background: "var(--surface)" }}>
        <div className="hero-grid-bg absolute inset-0" />
        <div className="absolute rounded-full blur-[80px] opacity-25 animate-blob-float w-[500px] h-[500px] -top-[100px] -right-[100px]" style={{ background: "var(--accent)" }} />
        <div className="absolute rounded-full blur-[80px] opacity-25 animate-blob-float [animation-delay:3s] w-[400px] h-[400px] -bottom-[50px] -left-[100px]" style={{ background: "var(--accent2)" }} />
        <div className="absolute rounded-full blur-[80px] opacity-25 animate-blob-float [animation-delay:6s] w-[300px] h-[300px] top-[40%] left-[40%]" style={{ background: "var(--accent3)" }} />

        <div className="relative max-w-[1100px] mx-auto w-full">
          {/* Eyebrow */}
          <div className={`animate-fade-up inline-flex items-center gap-2.5 px-4 py-2 rounded-full mb-8 text-xs font-bold tracking-[0.1em] uppercase ${syne}`} style={{ background: "var(--ink)", color: "var(--accent)" }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ background: "var(--accent)" }} />
            India&apos;s first job-readiness engine
          </div>

          {/* Headline */}
          <h1 className={`animate-fade-up-1 ${syne} font-extrabold leading-[0.95] tracking-[-0.03em] mb-6`} style={{ fontSize: "clamp(3rem, 7vw, 6.5rem)" }}>
            Know exactly<br />
            <span className="bg-gradient-to-br from-[#e8ff47] to-[#b8ff00] bg-clip-text" style={{ WebkitTextFillColor: "transparent" }}>what it takes</span><br />
            <span className="headline-stroked block">to get hired.</span>
          </h1>

          {/* Sub */}
          <p className="animate-fade-up-2 text-lg font-light max-w-[560px] leading-[1.7] mb-12" style={{ color: "var(--muted)" }}>
            Tell us your <strong className="font-medium" style={{ color: "var(--ink)" }}>dream companies</strong> and <strong className="font-medium" style={{ color: "var(--ink)" }}>domain interest</strong>. We&apos;ll show you which ones are hiring right now, what skills you&apos;re missing, and give you a <strong className="font-medium" style={{ color: "var(--ink)" }}>week-by-week roadmap</strong> to get there.
          </p>

          {/* Audience buttons */}
          <div className="animate-fade-up-3 mb-4">
            <p className={`${syne} text-xs font-bold tracking-[0.1em] uppercase mb-4`} style={{ color: "var(--muted)" }}>I am a</p>
            <div className="flex gap-3 flex-wrap">
              <Link href="/auth/signup?role=STUDENT" className={`btn-primary-landing group inline-flex items-center gap-3 px-7 py-4 rounded-2xl text-[0.95rem] font-bold ${syne} no-underline`} style={{ background: "var(--ink)", color: "var(--accent)" }}>
                <span className="text-xl">🎓</span>
                <div className="text-left">
                  <div>Student / Aspirant</div>
                  <div className="text-[0.65rem] font-normal opacity-60">Get hired at dream companies</div>
                </div>
                <span className="ml-1 opacity-50 group-hover:opacity-100 transition-opacity">→</span>
              </Link>
              <Link href="/for-companies" className={`audience-btn group inline-flex items-center gap-3 px-7 py-4 rounded-2xl text-[0.95rem] font-bold ${syne} no-underline border-[1.5px] transition-all`} style={{ borderColor: "var(--border)", color: "var(--ink)" }}>
                <span className="text-xl">🏢</span>
                <div className="text-left">
                  <div className="audience-btn-title transition-colors">Company / HR</div>
                  <div className="text-[0.65rem] font-normal audience-btn-sub transition-colors" style={{ color: "var(--muted)" }}>Hire job-ready talent</div>
                </div>
                <span className="ml-1 opacity-30 group-hover:opacity-100 transition-opacity audience-btn-arrow">→</span>
              </Link>
              <Link href="/for-mentors" className={`audience-btn group inline-flex items-center gap-3 px-7 py-4 rounded-2xl text-[0.95rem] font-bold ${syne} no-underline border-[1.5px] transition-all`} style={{ borderColor: "var(--border)", color: "var(--ink)" }}>
                <span className="text-xl">🧑‍🏫</span>
                <div className="text-left">
                  <div className="audience-btn-title transition-colors">Mentor</div>
                  <div className="text-[0.65rem] font-normal audience-btn-sub transition-colors" style={{ color: "var(--muted)" }}>Guide & earn</div>
                </div>
                <span className="ml-1 opacity-30 group-hover:opacity-100 transition-opacity audience-btn-arrow">→</span>
              </Link>
              <Link href="/for-institutions" className={`audience-btn group inline-flex items-center gap-3 px-7 py-4 rounded-2xl text-[0.95rem] font-bold ${syne} no-underline border-[1.5px] transition-all`} style={{ borderColor: "var(--border)", color: "var(--ink)" }}>
                <span className="text-xl">🏫</span>
                <div className="text-left">
                  <div className="audience-btn-title transition-colors">Institution</div>
                  <div className="text-[0.65rem] font-normal audience-btn-sub transition-colors" style={{ color: "var(--muted)" }}>Manage placements</div>
                </div>
                <span className="ml-1 opacity-30 group-hover:opacity-100 transition-opacity audience-btn-arrow">→</span>
              </Link>
            </div>
          </div>

          {/* Secondary CTA */}
          <div className="animate-fade-up-3">
            <a href="#how" className={`inline-flex items-center gap-2 text-sm font-medium ${syne} no-underline transition-colors hover:opacity-70`} style={{ color: "var(--muted)" }}>
              See how it works ↓
            </a>
          </div>

          {/* Stats */}
          <div className="animate-fade-up-4 flex gap-12 mt-16 pt-12 flex-wrap" style={{ borderTop: "1px solid var(--border)" }}>
            {[
              ["50+", "Top companies mapped"],
              ["200+", "Role-specific skill paths"],
              ["10M+", "Graduates need this now"],
              ["Free", "To get started today"],
            ].map(([num, label]) => (
              <div key={label}>
                <div className={`${syne} text-4xl font-extrabold leading-none`}>{num}</div>
                <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TICKER ═══ */}
      <div className="overflow-hidden whitespace-nowrap py-2.5" style={{ background: "var(--accent)" }}>
        <div className="inline-flex gap-12 animate-ticker">
          {[...tickerCompanies, ...tickerCompanies].map((c, i) => (
            <span key={i} className={`${syne} font-bold text-xs tracking-[0.05em] uppercase flex items-center gap-3`} style={{ color: "var(--ink)" }}>
              {c} <span className="opacity-40">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* ═══ PROBLEM ═══ */}
      <section className="py-28 px-6 md:px-12 relative overflow-hidden" style={{ background: "var(--ink)", color: "white" }}>
        <div className="problem-noise absolute inset-0 opacity-[0.04]" />
        <div className="relative max-w-[1100px] mx-auto">
          <span className={`${syne} text-[0.7rem] font-bold tracking-[0.15em] uppercase block mb-6`} style={{ color: "var(--accent)" }}>The problem we&apos;re solving</span>
          <h2 className={`${syne} font-extrabold leading-[1.05] tracking-[-0.02em] max-w-[700px] mb-8`} style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}>
            40% of Indian graduates are unemployed.<br />
            Not because they&apos;re <em className="not-italic" style={{ color: "var(--accent)" }}>untalented</em>.<br />
            Because no one showed them <em className="not-italic" style={{ color: "var(--accent)" }}>the path</em>.
          </h2>
          <p className="text-lg font-light max-w-[560px] leading-[1.8] mb-16" style={{ color: "rgba(255,255,255,0.65)" }}>
            Every year, 10 million graduates leave college with degrees but no direction. They don&apos;t know what skills companies actually want, which companies are hiring, or how to bridge the gap. They send hundreds of applications into the void and hear nothing back.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {problemCards.map((card) => (
              <div key={card.title} ref={addRevealRef} className="scroll-reveal rounded-2xl p-7 border transition-colors hover:bg-[rgba(255,255,255,0.08)] hover:border-[rgba(232,255,71,0.3)]" style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}>
                <div className={`${syne} text-[2.5rem] font-extrabold leading-none mb-3`} style={{ color: "var(--accent)" }}>{card.num}</div>
                <div className={`${syne} font-bold text-base mb-2`}>{card.title}</div>
                <div className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>{card.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how" className="py-28 px-6 md:px-12" style={{ background: "var(--surface)" }}>
        <div className="max-w-[1100px] mx-auto">
          <div className="mb-16">
            <span className={`${syne} text-[0.7rem] font-bold tracking-[0.15em] uppercase block mb-6 opacity-50`} style={{ color: "var(--ink)" }}>How SkillMap works</span>
            <h2 className={`${syne} font-extrabold tracking-[-0.02em] leading-[1.1]`} style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>From lost to hired.<br />In four steps.</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[2px]" style={{ background: "var(--border)" }}>
            {steps.map((step) => (
              <div key={step.num} ref={addRevealRef} className="scroll-reveal p-10 transition-colors hover:bg-white" style={{ background: "var(--surface)" }}>
                <div className={`${syne} text-6xl font-extrabold leading-none mb-6 opacity-[0.06]`}>{step.num}</div>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 text-xl" style={{ background: "var(--ink)" }}>{step.icon}</div>
                <h3 className={`${syne} font-bold text-[1.05rem] mb-2.5`}>{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{step.desc}</p>
                <span className={`${syne} inline-block mt-4 text-[0.65rem] font-extrabold tracking-[0.08em] uppercase px-2 py-0.5 rounded`} style={{ background: "var(--accent)", color: "var(--ink)" }}>{step.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ COMPANIES ═══ */}
      <section id="companies" className="py-28 px-6 md:px-12" style={{ background: "var(--ink2)", color: "white" }}>
        <div className="max-w-[1100px] mx-auto">
          <span className={`${syne} text-[0.7rem] font-bold tracking-[0.15em] uppercase block mb-6`} style={{ color: "var(--accent)" }}>Companies we&apos;ve mapped</span>
          <h2 className={`${syne} font-extrabold tracking-[-0.02em] mb-4`} style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>Every top company.<br />Every skill. Decoded.</h2>
          <p className="text-base max-w-[500px] leading-[1.7] mb-12" style={{ color: "rgba(255,255,255,0.5)" }}>We&apos;ve done the research so you don&apos;t have to. Here&apos;s what it takes to get hired at India&apos;s most sought-after companies.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {companyCards.map((co) => (
              <div key={co.name} ref={addRevealRef} className="scroll-reveal co-card-overlay relative rounded-2xl p-6 cursor-pointer transition-all hover:-translate-y-1 hover:border-[rgba(232,255,71,0.4)] overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="relative flex items-center gap-4 mb-5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${syne} font-extrabold text-lg shrink-0`} style={{ background: co.bg, color: "white" }}>{co.logo}</div>
                  <div>
                    <div className={`${syne} font-bold text-[1.05rem]`}>{co.name}</div>
                    <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{co.type}</div>
                  </div>
                </div>
                <div className="relative flex flex-wrap gap-1.5">
                  {co.skills.map((s) => (
                    <span key={s} className="text-[0.7rem] px-2.5 py-0.5 rounded-full border" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", borderColor: "rgba(255,255,255,0.1)" }}>{s}</span>
                  ))}
                </div>
                <div className={`relative inline-block mt-4 ${syne} text-[0.65rem] font-bold tracking-[0.05em] uppercase px-2 py-0.5 rounded`} style={{ background: "var(--accent)", color: "var(--ink)" }}>{co.badge}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SOLUTION ═══ */}
      <section className="py-28 px-6 md:px-12 overflow-hidden bg-white">
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <span className={`${syne} text-[0.7rem] font-bold tracking-[0.15em] uppercase block mb-4 opacity-40`}>The SkillMap difference</span>
            <h2 className={`${syne} font-extrabold tracking-[-0.02em] leading-[1.1] mb-5`} style={{ fontSize: "clamp(2rem, 3.5vw, 2.8rem)" }}>
              Not a job board.<br />A <span className="rounded-md px-1.5" style={{ color: "var(--accent)", background: "var(--ink)" }}>readiness</span> engine.
            </h2>
            <p className="text-base leading-[1.8] mb-8" style={{ color: "var(--muted)" }}>
              Naukri shows you 500 jobs. You don&apos;t know which to apply for or if you&apos;re even ready. SkillMap shows you 5 perfect-fit roles, tells you exactly what&apos;s missing, and builds your plan to get there.
            </p>
            <div className="flex flex-col gap-4">
              {solutionFeatures.map((f) => (
                <div key={f.title} className="flex gap-4 items-start">
                  <div className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: "var(--ink)" }} />
                  <div>
                    <div className={`${syne} font-bold text-[0.95rem] mb-0.5`}>{f.title}</div>
                    <div className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Chat visual */}
          <div className="rounded-3xl p-8" style={{ background: "var(--ink)" }}>
            <div className="rounded-2xl p-5 text-sm" style={{ background: "#111" }}>
              <div className={`${syne} text-[0.7rem] tracking-[0.05em] uppercase mb-4`} style={{ color: "rgba(255,255,255,0.3)" }}>AI Advisor — SkillMap</div>
              <div className="flex gap-2.5 mb-3 flex-row-reverse">
                <div className="w-6 h-6 rounded-full shrink-0 mt-0.5 flex items-center justify-center text-[0.6rem] font-bold" style={{ background: "rgba(255,255,255,0.15)", color: "white" }}>R</div>
                <div className="rounded-[12px_4px_12px_12px] px-3.5 py-2.5 leading-relaxed max-w-[75%] font-medium text-xs" style={{ background: "var(--accent)", color: "var(--ink)" }}>I&apos;m a CS grad interested in cybersecurity. Dream companies: TCS, KPMG, Deloitte.</div>
              </div>
              <div className="flex gap-2.5 mb-3">
                <div className={`w-6 h-6 rounded-full shrink-0 mt-0.5 flex items-center justify-center text-[0.6rem] font-bold ${syne}`} style={{ background: "var(--accent)", color: "var(--ink)" }}>S</div>
                <div className="rounded-[4px_12px_12px_12px] px-3.5 py-2.5 leading-relaxed max-w-[85%] text-xs" style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.8)" }}>Found 3 live openings matching your profile. Here&apos;s your situation:</div>
              </div>
              <div className="mt-4 rounded-xl p-4 border" style={{ background: "rgba(232,255,71,0.1)", borderColor: "rgba(232,255,71,0.3)" }}>
                <div className={`${syne} font-bold text-xs mb-2.5`} style={{ color: "var(--accent)" }}>✦ Top match right now</div>
                <div className="flex justify-between text-[0.75rem] mb-1" style={{ color: "rgba(255,255,255,0.6)" }}>
                  <span>TCS — Cybersecurity Analyst L1</span>
                  <span className={`${syne} text-[0.65rem] font-bold px-2 py-0.5 rounded`} style={{ background: "var(--accent)", color: "var(--ink)" }}>Apply by 30 Apr</span>
                </div>
                <div className="flex justify-between text-[0.75rem]" style={{ color: "rgba(255,255,255,0.6)" }}>
                  <span>Gap: CEH cert + Python scripting</span>
                  <span style={{ color: "var(--accent)" }}>6 weeks to ready</span>
                </div>
              </div>
              <div className="flex gap-2.5 mt-3">
                <div className={`w-6 h-6 rounded-full shrink-0 mt-0.5 flex items-center justify-center text-[0.6rem] font-bold ${syne}`} style={{ background: "var(--accent)", color: "var(--ink)" }}>S</div>
                <div className="rounded-[4px_12px_12px_12px] px-3.5 py-2.5 leading-relaxed max-w-[85%] text-xs" style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.8)" }}>Week 1–2: CompTIA Sec+ (free on YouTube). Week 3–4: Python for Security on Coursera. Week 5–6: Mock interviews. Apply by Apr 25th. You&apos;ve got this. 🎯</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ REVIEWS ═══ */}
      <section id="reviews" className="py-28 px-6 md:px-12" style={{ background: "var(--surface)" }}>
        <div className="max-w-[1100px] mx-auto">
          <span className={`${syne} text-[0.7rem] font-bold tracking-[0.15em] uppercase block mb-4 opacity-40`}>What students are saying</span>
          <h2 className={`${syne} font-extrabold tracking-[-0.02em] mb-3`} style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>Real results.<br />Real people.</h2>
          <p className="max-w-[500px] leading-[1.7] mb-12" style={{ color: "var(--muted)" }}>Fresh graduates across India who went from confused to hired — using SkillMap.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((r) => (
              <div key={r.name} ref={addRevealRef} className="scroll-reveal relative bg-white border rounded-[20px] p-8 transition-all hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(10,10,15,0.08)]" style={{ borderColor: "var(--border)" }}>
                <div className={`absolute top-6 right-6 ${syne} text-[0.7rem] font-bold tracking-[0.05em]`} style={{ color: "var(--muted)" }}>{r.company}</div>
                <div className="text-base mb-4 tracking-wider" style={{ color: "#f59e0b" }}>★★★★★</div>
                <p className="text-base leading-[1.7] mb-6 italic">{r.quote}</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${syne} font-extrabold text-sm text-white shrink-0`} style={{ background: r.color }}>{r.initials}</div>
                  <div>
                    <div className={`${syne} font-bold text-[0.9rem]`}>{r.name}</div>
                    <div className="text-sm" style={{ color: "var(--muted)" }}>{r.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section id="pricing" className="py-28 px-6 md:px-12" style={{ background: "var(--ink)", color: "white" }}>
        <div className="max-w-[1100px] mx-auto">
          <span className={`${syne} text-[0.7rem] font-bold tracking-[0.15em] uppercase block mb-6`} style={{ color: "var(--accent)" }}>Simple pricing</span>
          <h2 className={`${syne} font-extrabold tracking-[-0.02em] mb-3`} style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>Start free.<br />Upgrade when ready.</h2>
          <p className="max-w-[500px] leading-[1.7] mb-14" style={{ color: "rgba(255,255,255,0.5)" }}>No hidden fees. No confusing tiers. Just the tools you need to get hired.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[900px]">
            {/* Free */}
            <div ref={addRevealRef} className="scroll-reveal rounded-[20px] p-8 border transition-colors" style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}>
              <span className={`${syne} text-[0.7rem] font-extrabold tracking-[0.1em] uppercase block mb-6`} style={{ color: "rgba(255,255,255,0.4)" }}>Free forever</span>
              <div className={`${syne} text-5xl font-extrabold leading-none mb-1`}>₹0<span className="text-sm font-light opacity-50">/mo</span></div>
              <div className={`${syne} font-bold text-lg mt-5 mb-4`}>Explorer</div>
              <ul className="flex flex-col gap-2.5 mb-8 text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>
                {["Browse 50+ company skill maps", "See live job openings", "1 domain + 3 company matches", "Basic AI chat (10 messages/day)", "Interview process overview"].map((f) => (
                  <li key={f} className="flex gap-2 items-start"><span className="opacity-50 shrink-0 mt-px">→</span>{f}</li>
                ))}
              </ul>
              <Link href="/auth/signup?role=STUDENT" className={`block w-full text-center py-3.5 rounded-full ${syne} font-bold text-sm transition-transform hover:-translate-y-0.5`} style={{ background: "rgba(255,255,255,0.1)", color: "white" }}>Get started free</Link>
            </div>
            {/* Featured */}
            <div ref={addRevealRef} className="scroll-reveal rounded-[20px] p-8 border" style={{ background: "var(--accent)", borderColor: "var(--accent)", color: "var(--ink)" }}>
              <span className={`${syne} text-[0.7rem] font-extrabold tracking-[0.1em] uppercase block mb-6 opacity-50`}>Most popular</span>
              <div className={`${syne} text-5xl font-extrabold leading-none mb-1`}>₹299<span className="text-sm font-light opacity-50">/mo</span></div>
              <div className={`${syne} font-bold text-lg mt-5 mb-4`}>Career Ready</div>
              <ul className="flex flex-col gap-2.5 mb-8 text-sm opacity-80">
                {["Everything in Explorer", "Unlimited AI mentor conversations", "Full skill gap analysis", "Week-by-week prep roadmap", "Job alerts for your matches", "Progress tracking dashboard", "Priority support"].map((f) => (
                  <li key={f} className="flex gap-2 items-start"><span className="opacity-50 shrink-0 mt-px">→</span>{f}</li>
                ))}
              </ul>
              <Link href="/auth/signup?role=STUDENT" className={`block w-full text-center py-3.5 rounded-full ${syne} font-bold text-sm transition-transform hover:-translate-y-0.5`} style={{ background: "var(--ink)", color: "var(--accent)" }}>Start 7-day free trial</Link>
            </div>
            {/* Institutions */}
            <div ref={addRevealRef} className="scroll-reveal rounded-[20px] p-8 border transition-colors" style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}>
              <span className={`${syne} text-[0.7rem] font-extrabold tracking-[0.1em] uppercase block mb-6`} style={{ color: "rgba(255,255,255,0.4)" }}>Institutions</span>
              <div className={`${syne} text-5xl font-extrabold leading-none mb-1`}>Custom</div>
              <div className={`${syne} font-bold text-lg mt-5 mb-4`}>College / Bootcamp</div>
              <ul className="flex flex-col gap-2.5 mb-8 text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>
                {["Bulk student access", "Placement cell dashboard", "Batch progress analytics", "Custom company targeting", "Dedicated account manager", "White-label option"].map((f) => (
                  <li key={f} className="flex gap-2 items-start"><span className="opacity-50 shrink-0 mt-px">→</span>{f}</li>
                ))}
              </ul>
              <Link href="/auth/login?role=ORG" className={`block w-full text-center py-3.5 rounded-full ${syne} font-bold text-sm transition-transform hover:-translate-y-0.5`} style={{ background: "rgba(255,255,255,0.1)", color: "white" }}>Contact us</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="py-28 px-6 md:px-12" style={{ background: "var(--surface)" }}>
        <div className="max-w-[1100px] mx-auto">
          <h2 className={`${syne} font-extrabold tracking-[-0.02em] mb-12`} style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>Questions we<br />hear a lot.</h2>
          <div className="max-w-[720px] flex flex-col">
            {faqItems.map((item, i) => (
              <div key={i} className={`border-b ${openFaq === i ? "faq-open" : ""}`} style={{ borderColor: "var(--border)" }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className={`w-full text-left flex justify-between items-center py-6 gap-4 ${syne} font-bold text-base cursor-pointer bg-transparent border-none`}
                  style={{ color: "var(--ink)" }}
                >
                  {item.q}
                  <span className="text-xl shrink-0 transition-transform duration-300 faq-icon-rotate" style={{ color: "var(--muted)" }}>+</span>
                </button>
                <div className="faq-answer text-[0.9rem] leading-[1.7]" style={{ color: "var(--muted)" }}>
                  {item.a}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section id="cta" className="py-32 px-6 md:px-12 text-center relative overflow-hidden" style={{ background: "var(--ink2)" }}>
        <div className="absolute w-[600px] h-[600px] rounded-full blur-[100px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ background: "var(--accent)", opacity: 0.07 }} />
        <h2 className={`relative ${syne} font-extrabold tracking-[-0.03em] text-white leading-none mb-6`} style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}>
          Your dream company<br />is <span style={{ color: "var(--accent)" }}>hiring right now.</span>
        </h2>
        <p className="relative text-lg mb-12" style={{ color: "rgba(255,255,255,0.5)" }}>Find out exactly what it takes — in under 3 minutes.</p>
        <div className="relative flex gap-4 justify-center flex-wrap">
          <Link href="/auth/signup?role=STUDENT" className={`cta-btn-main inline-flex items-center gap-2.5 px-10 py-4.5 rounded-full ${syne} font-extrabold text-base no-underline`} style={{ background: "var(--accent)", color: "var(--ink)" }}>
            Find my path →
          </Link>
        </div>
        <p className="relative mt-6 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Free to start · No credit card · Takes 3 minutes</p>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="py-12 px-6 md:px-12" style={{ background: "var(--ink)", color: "rgba(255,255,255,0.4)" }}>
        <div className="max-w-[1100px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between gap-10 mb-10">
            {/* Brand */}
            <div className="md:max-w-[250px]">
              <div className={`${syne} font-extrabold text-lg text-white mb-2`}>Skill<span style={{ color: "var(--accent)" }}>Map</span></div>
              <p className="text-xs leading-relaxed">India&apos;s first job-readiness engine. Know what it takes to get hired at your dream company.</p>
            </div>
            {/* Links */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
              <div>
                <div className={`${syne} font-bold text-xs text-white uppercase tracking-wider mb-3`}>Platform</div>
                <div className="flex flex-col gap-2">
                  <Link href="/jobs" className="no-underline transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.4)" }}>Jobs</Link>
                  <Link href="/companies" className="no-underline transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.4)" }}>Companies</Link>
                  <Link href="/pricing" className="no-underline transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.4)" }}>Pricing</Link>
                  <Link href="/for-companies" className="no-underline transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.4)" }}>For Companies</Link>
                  <Link href="/for-mentors" className="no-underline transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.4)" }}>For Mentors</Link>
                  <Link href="/for-institutions" className="no-underline transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.4)" }}>For Institutions</Link>
                </div>
              </div>
              <div>
                <div className={`${syne} font-bold text-xs text-white uppercase tracking-wider mb-3`}>Company</div>
                <div className="flex flex-col gap-2">
                  <Link href="/about" className="no-underline transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.4)" }}>About Us</Link>
                  <Link href="/forms/contact" className="no-underline transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.4)" }}>Contact</Link>
                  <Link href="/forms/partner" className="no-underline transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.4)" }}>Partner With Us</Link>
                  <Link href="/forms/hire-from-us" className="no-underline transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.4)" }}>Hire From Us</Link>
                </div>
              </div>
              <div>
                <div className={`${syne} font-bold text-xs text-white uppercase tracking-wider mb-3`}>Legal</div>
                <div className="flex flex-col gap-2">
                  <Link href="/privacy" className="no-underline transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.4)" }}>Privacy Policy</Link>
                  <Link href="/terms" className="no-underline transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.4)" }}>Terms & Conditions</Link>
                  <Link href="/refund-policy" className="no-underline transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.4)" }}>Refund Policy</Link>
                  <Link href="/shipping-policy" className="no-underline transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.4)" }}>Shipping Policy</Link>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <span>&copy; 2026 SkillMap. Built for India&apos;s next generation.</span>
            <span>Payments secured by Razorpay</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
