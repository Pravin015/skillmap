"use client";
// AstraaHire homepage — Prakae-style light theme.
// Hero · feature pills · OS preview · stats · feature cards · integrations · reviews · CTA card.

import Link from "next/link";

const features = [
  {
    title: "Skill match score",
    desc: "AI scans your profile against every job's actual hiring criteria — see exactly where you stand and what's missing, in seconds.",
    accent: "linear-gradient(135deg, #FCA5A5, #FBCFE8)",
  },
  {
    title: "Mock interviews",
    desc: "Practice for 15+ companies. Real-time scoring, voice feedback, and a personalised improvement plan after every session.",
    accent: "linear-gradient(135deg, #BFDBFE, #DDD6FE)",
  },
  {
    title: "Offer verification",
    desc: "Upload any offer letter. We check 20 fraud signals — trust score in 30 seconds, before you accept.",
    accent: "linear-gradient(135deg, #FBCFE8, #FECACA)",
  },
];

const stats = [
  { n: "98%", label: "Match accuracy", desc: "Verified across 12,000+ student placements" },
  { n: "15+", label: "Company prep tracks", desc: "TCS · Google · Amazon · Razorpay · KPMG and more" },
  { n: "3×", label: "Faster offers", desc: "Average time-to-offer vs unguided peers" },
];

const integrations = [
  { name: "LinkedIn", letter: "in", color: "#0A66C2" },
  { name: "Razorpay", letter: "R", color: "#072654" },
  { name: "Naukri", letter: "N", color: "#FF7555" },
  { name: "GitHub", letter: "G", color: "#0F0E14" },
  { name: "Adzuna", letter: "A", color: "#7C3AED" },
  { name: "AWS", letter: "AWS", color: "#FF9900" },
];

const reviews = [
  { quote: "Told me I was missing CEH for TCS Cybersecurity. Got it in 5 weeks. Got the call in week 6.", name: "Rahul Kumar", role: "B.Tech CSE, 2025" },
  { quote: "Nobody told me KPMG looks for ISO 27001 knowledge. The roadmap was so specific — I knew exactly what to do.", name: "Priya Sharma", role: "MBA Finance, 2025" },
  { quote: "The AI advisor felt like talking to a senior who actually knew what they were talking about. Cracked Infosys first attempt.", name: "Sneha Joshi", role: "B.Tech IT, 2025" },
  { quote: "I used the offer verifier on what turned out to be a fake job scam. Saved my first paycheck. Wild.", name: "Arjun Mehta", role: "MCA, 2025" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--surface)" }}>
      {/* ═══════════════════════════════ HERO ═══════════════════════════════ */}
      <section className="blob-bg pt-12 pb-20 px-4">
        <div className="max-w-5xl mx-auto text-center relative">
          <div className="section-eyebrow mx-auto">Stay ahead in your career</div>

          <h1 className="font-semibold mb-5" style={{ color: "var(--ink)" }}>
            Career intelligence for<br />India&apos;s freshers
          </h1>

          <p className="text-base max-w-xl mx-auto mb-8" style={{ color: "var(--muted)" }}>
            AI-powered job matching, company-specific prep, mock interviews, and offer verification —
            everything you need to land your first job, in one platform.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
            <Link href="/auth/signup" className="btn-primary">Request a demo</Link>
            <Link href="/dashboard" className="btn-outline">14-day free trial</Link>
          </div>

          {/* Floating cards */}
          <div className="relative max-w-3xl mx-auto h-72 hidden md:block">
            {/* Center violet orb */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 rounded-full flex items-center justify-center shadow-2xl"
                 style={{ background: "radial-gradient(circle at 30% 30%, #A78BFA 0%, #7C3AED 60%, #5B21B6 100%)" }}>
              <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-white whitespace-nowrap" style={{ color: "var(--ink)" }}>
                <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle" style={{ background: "var(--success)" }} />
                AstraaHire
              </span>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>

            {/* Left card — profile complete */}
            <div className="absolute left-0 top-8 bg-white rounded-2xl p-3 shadow-xl border w-52" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#FEE2E2" }}>
                  <span style={{ color: "#DC2626" }}>✓</span>
                </div>
                <div className="text-left">
                  <p className="text-[10px]" style={{ color: "var(--muted)" }}>Profile complete</p>
                  <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>Active</p>
                </div>
              </div>
            </div>

            <div className="absolute left-4 bottom-8 bg-white rounded-2xl p-3 shadow-xl border w-52" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#FEF3C7" }}>
                  <span style={{ color: "#D97706" }}>📌</span>
                </div>
                <div className="text-left flex-1">
                  <p className="text-[10px]" style={{ color: "var(--muted)" }}>Applications</p>
                  <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>1240 / mo</p>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: "var(--accent-3)", color: "#065F46" }}>9.2</span>
              </div>
            </div>

            {/* Right card — score chart */}
            <div className="absolute right-0 top-6 bg-white rounded-2xl p-3 shadow-xl border w-56" style={{ borderColor: "var(--border)" }}>
              <p className="text-[10px] mb-1" style={{ color: "var(--muted)" }}>Match accuracy</p>
              <p className="text-sm font-semibold mb-2" style={{ color: "var(--ink)" }}>
                98% <span className="text-[10px]" style={{ color: "var(--success)" }}>+12.4%</span>
              </p>
              <svg viewBox="0 0 100 30" className="w-full h-8">
                <polyline fill="none" stroke="#7C3AED" strokeWidth="1.8" points="0,22 12,18 24,20 36,12 48,15 60,8 72,10 84,4 100,7" />
              </svg>
            </div>

            <div className="absolute right-4 bottom-6 bg-white rounded-2xl p-3 shadow-xl border w-56" style={{ borderColor: "var(--border)" }}>
              <p className="text-[10px] mb-1" style={{ color: "var(--muted)" }}>Coverage</p>
              <p className="text-sm font-semibold mb-2" style={{ color: "var(--ink)" }}>56.0%</p>
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface-alt)" }}>
                <div className="h-full rounded-full" style={{ width: "56%", background: "var(--primary)" }} />
              </div>
              <p className="text-[10px] mt-1.5" style={{ color: "var(--muted)" }}>Acquired band</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════ OS PREVIEW ═══════════════════════════════ */}
      <section className="px-4 pb-20">
        <div className="max-w-5xl mx-auto text-center mb-8">
          <div className="section-eyebrow mx-auto">See it in action</div>
          <h2 className="font-semibold mb-3" style={{ color: "var(--ink)" }}>The career command center, in real time</h2>
          <p className="text-sm max-w-xl mx-auto" style={{ color: "var(--muted)" }}>
            Roadmaps, applications, mocks, and verifications — all in one view, with AI-mapped guidance.
          </p>
        </div>

        <div className="max-w-5xl mx-auto rounded-3xl border bg-white p-2 md:p-3 shadow-2xl" style={{ borderColor: "var(--border)" }}>
          <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface)" }}>
            {/* Mock window chrome */}
            <div className="flex items-center gap-1.5 px-3 py-2 border-b" style={{ borderColor: "var(--border)" }}>
              <span className="w-2.5 h-2.5 rounded-full bg-rose-300" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-300" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-300" />
            </div>
            {/* Mock dashboard */}
            <div className="grid grid-cols-12 gap-3 p-3">
              <div className="col-span-3 space-y-1">
                {["Overview", "Roadmap", "Jobs", "Applications", "Mock Interview", "Mentors", "Courses", "Offer Check", "Settings"].map((it, i) => (
                  <div key={it} className={`px-3 py-1.5 rounded-lg text-[11px] ${i === 0 ? "" : "opacity-60"}`} style={{ background: i === 0 ? "var(--primary-light)" : "transparent", color: i === 0 ? "var(--primary)" : "var(--muted)" }}>{it}</div>
                ))}
              </div>
              <div className="col-span-9 space-y-2">
                <p className="text-xs font-semibold" style={{ color: "var(--ink)" }}>Career command center</p>
                <div className="grid grid-cols-3 gap-2">
                  {["Skills mastered", "Applications", "Interviews"].map((label, i) => (
                    <div key={label} className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                      <p className="text-[9px]" style={{ color: "var(--muted)" }}>{label}</p>
                      <p className="text-base font-semibold mt-0.5" style={{ color: "var(--ink)" }}>{[24, 12, 6][i]}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)", background: "linear-gradient(135deg, #FEE2E2 0%, transparent 60%)" }}>
                  <p className="text-[10px] font-semibold mb-1" style={{ color: "var(--ink)" }}>Recent runs</p>
                  <div className="space-y-1.5">
                    {[
                      { c: "Razorpay · SDE I", s: "Cleared screen", t: "2h ago", g: "#10B981" },
                      { c: "TCS · Cybersecurity", s: "Mock 4/4", t: "yesterday", g: "#7C3AED" },
                      { c: "KPMG · Risk Analyst", s: "Profile match 92%", t: "2d ago", g: "#F59E0B" },
                    ].map((r) => (
                      <div key={r.c} className="flex items-center justify-between text-[10px]">
                        <span style={{ color: "var(--ink)" }}>{r.c}</span>
                        <span className="font-semibold" style={{ color: r.g }}>{r.s}</span>
                        <span style={{ color: "var(--muted)" }}>{r.t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-center mt-5" style={{ color: "var(--muted)" }}>
          Super-fast inbuilt — live alerts from a real student in their AstraaHire dashboard.
        </p>
      </section>

      {/* ═══════════════════════════════ TRUSTED BY ═══════════════════════════════ */}
      <section className="px-4 pb-16">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs mb-6" style={{ color: "var(--muted)" }}>
            <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle" style={{ background: "var(--success)" }} />
            Trusted by industry leaders
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 opacity-50">
            {["MERIDIAN", "AURORA", "SOLERIS", "NORTHCO", "OBSIDIAN"].map((c) => (
              <span key={c} className="text-xs tracking-[0.18em]" style={{ color: "var(--ink-soft)" }}>{c}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════ FEATURE CARDS ═══════════════════════════════ */}
      <section className="px-4 pb-20">
        <div className="max-w-5xl mx-auto text-center mb-10">
          <div className="section-eyebrow mx-auto">More features</div>
          <h2 className="font-semibold" style={{ color: "var(--ink)" }}>Managing your career has never been easier</h2>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.title} className="card text-left">
              <div className="rounded-2xl mb-5 h-32 flex items-center justify-center" style={{ background: f.accent }}>
                <div className="w-12 h-12 rounded-full bg-white/70 backdrop-blur-sm" />
              </div>
              <h3 className="font-semibold mb-1.5" style={{ color: "var(--ink)" }}>{f.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{f.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href="/dashboard" className="btn-dark">Explore all</Link>
        </div>
      </section>

      {/* ═══════════════════════════════ STATS — DARK CARD ═══════════════════════════════ */}
      <section className="px-4 pb-20">
        <div className="max-w-5xl mx-auto text-center mb-8">
          <div className="section-eyebrow mx-auto">Accuracy in mind</div>
          <h2 className="font-semibold" style={{ color: "var(--ink)" }}>Unmatched career performance</h2>
          <p className="text-sm max-w-xl mx-auto mt-3" style={{ color: "var(--muted)" }}>
            Built for students with high confidentiality. Information stays yours and personal user data is never shared above your own.
          </p>
        </div>

        <div className="card-dark max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center md:text-left">
                <div className="w-10 h-10 rounded-xl mb-3 mx-auto md:mx-0 flex items-center justify-center text-base" style={{ background: "rgba(255,255,255,0.06)" }}>
                  {s.label.includes("Match") ? "🎯" : s.label.includes("Company") ? "🏢" : "⚡"}
                </div>
                <p className="text-3xl font-semibold mb-1" style={{ color: "white" }}>{s.n}</p>
                <p className="text-sm font-medium mb-1" style={{ color: "white" }}>{s.label}</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════ ENTERPRISE FEATURES ═══════════════════════════════ */}
      <section className="px-4 pb-20">
        <div className="max-w-5xl mx-auto text-center mb-10">
          <div className="section-eyebrow mx-auto">Solution</div>
          <h2 className="font-semibold" style={{ color: "var(--ink)" }}>Enterprise-grade career intelligence</h2>
        </div>

        <div className="max-w-5xl mx-auto space-y-5">
          {/* Row 1 — vendor intelligence-style */}
          <div className="card grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div>
              <h3 className="font-semibold mb-2" style={{ color: "var(--ink)" }}>Skill intelligence</h3>
              <p className="text-xs leading-relaxed mb-4" style={{ color: "var(--muted)" }}>
                Continuously catalogue every skill in your profile. Get a 360° view of how you stack up against
                each company&apos;s historical hiring criteria — and exactly what to learn next.
              </p>
              <Link href="/dashboard" className="btn-dark" style={{ padding: "0.55rem 1.2rem", fontSize: "0.8rem" }}>Read more</Link>
            </div>
            <div className="rounded-2xl p-5" style={{ background: "var(--surface-dark)" }}>
              <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.6)" }}>Thousands</p>
              <p className="text-2xl font-semibold mb-3" style={{ color: "white" }}>5<span className="text-xs ml-1 font-normal">th</span> percentile</p>
              <svg viewBox="0 0 100 30" className="w-full h-12">
                <polyline fill="none" stroke="#A78BFA" strokeWidth="1.5" points="0,22 14,20 28,17 42,18 56,12 70,9 85,5 100,3" />
              </svg>
            </div>
          </div>

          {/* Row 2 — threat detection-style */}
          <div className="card grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg, #FEF3C7, #FED7AA)" }}>
              <p className="text-[10px] mb-1" style={{ color: "var(--muted)" }}>Roadmaps generated</p>
              <p className="text-3xl font-semibold mb-3" style={{ color: "var(--ink)" }}>54,179</p>
              <div className="flex items-end gap-1 h-12">
                {[40, 65, 50, 80, 55, 90, 70].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: "var(--primary)" }} />
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2" style={{ color: "var(--ink)" }}>AI mock interviews</h3>
              <p className="text-xs leading-relaxed mb-4" style={{ color: "var(--muted)" }}>
                Multi-modal interview detection on the complete spectrum based AT-TASKS. Coverage: speaker isolation,
                latency, tonal cues, and on-time alerts so you can react in seconds.
              </p>
              <Link href="/mock-interview" className="btn-dark" style={{ padding: "0.55rem 1.2rem", fontSize: "0.8rem" }}>Read more</Link>
            </div>
          </div>

          {/* Row 3 — compliance-style */}
          <div className="card grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div>
              <h3 className="font-semibold mb-2" style={{ color: "var(--ink)" }}>Offer verification</h3>
              <p className="text-xs leading-relaxed mb-4" style={{ color: "var(--muted)" }}>
                Continuously evaluate your job offers across 20 fraud signals and produce signed evidence packets for
                auditors in one click.
              </p>
              <Link href="/offer-verify" className="btn-dark" style={{ padding: "0.55rem 1.2rem", fontSize: "0.8rem" }}>Read more</Link>
            </div>
            <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg, #EDE9FE, #DDD6FE)" }}>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-3xl font-semibold" style={{ color: "var(--ink)" }}>₹682.5</span>
                <span className="text-xs font-semibold" style={{ color: "var(--success)" }}>+9%</span>
              </div>
              <svg viewBox="0 0 100 30" className="w-full h-10">
                <polyline fill="none" stroke="#7C3AED" strokeWidth="1.5" points="0,25 12,22 24,18 36,15 48,17 60,12 72,8 84,10 100,4" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════ INTEGRATIONS ═══════════════════════════════ */}
      <section className="px-4 pb-20">
        <div className="max-w-5xl mx-auto text-center mb-10">
          <div className="section-eyebrow mx-auto">Integrations</div>
          <h2 className="font-semibold" style={{ color: "var(--ink)" }}>Link up with your favourite tools</h2>
          <p className="text-sm max-w-xl mx-auto mt-3" style={{ color: "var(--muted)" }}>
            We pull in jobs, profiles, and skills from the tools you already use — sync via APIs in one click.
          </p>
        </div>

        <div className="max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-3">
          {integrations.map((it) => (
            <div key={it.name} className="card-soft flex items-center gap-3">
              <span className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: it.color }}>
                {it.letter}
              </span>
              <span className="text-sm font-medium" style={{ color: "var(--ink)" }}>{it.name}</span>
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full" style={{ background: "var(--accent-3)", color: "#065F46" }}>Live</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════ REVIEWS ═══════════════════════════════ */}
      <section className="px-4 pb-20">
        <div className="max-w-5xl mx-auto text-center mb-10">
          <div className="section-eyebrow mx-auto">Reviews</div>
          <h2 className="font-semibold" style={{ color: "var(--ink)" }}>Hear from our customers about their experiences with us</h2>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reviews.map((r) => (
            <div key={r.name} className="card-soft">
              <div className="flex gap-0.5 mb-3" style={{ color: "#F59E0B" }}>
                {"★★★★★".split("").map((s, i) => <span key={i}>{s}</span>)}
              </div>
              <p className="text-xs leading-relaxed mb-4" style={{ color: "var(--ink-soft)" }}>&ldquo;{r.quote}&rdquo;</p>
              <div className="flex items-center gap-2 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold text-white" style={{ background: "var(--primary)" }}>{r.name[0]}</span>
                <div>
                  <p className="text-xs font-semibold" style={{ color: "var(--ink)" }}>{r.name}</p>
                  <p className="text-[10px]" style={{ color: "var(--muted)" }}>{r.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════ CTA DARK CARD ═══════════════════════════════ */}
      <section className="px-4 pb-20">
        <div className="card-dark max-w-5xl mx-auto text-center" style={{ padding: "60px 20px" }}>
          <div className="section-eyebrow mx-auto" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}>Get started</div>
          <h2 className="font-semibold mb-4" style={{ color: "white" }}>Get started with India&apos;s leading career intelligence</h2>
          <p className="text-sm max-w-md mx-auto mb-8" style={{ color: "rgba(255,255,255,0.6)" }}>
            Join thousands of students already using AstraaHire. A platform built for your growth.
          </p>

          <form className="max-w-md mx-auto flex gap-2 p-1.5 bg-white rounded-full">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-2 text-sm bg-transparent outline-none"
              style={{ color: "var(--ink)" }}
            />
            <Link href="/auth/signup" className="btn-primary" style={{ padding: "0.55rem 1.2rem", fontSize: "0.85rem" }}>Start now</Link>
          </form>
        </div>
      </section>
    </div>
  );
}
