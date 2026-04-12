"use client";

import Link from "next/link";

const syne = "font-[family-name:var(--font-syne)]";

const benefits = [
  { icon: "💰", title: "Set your own rates", desc: "Configure separate rates for 1-on-1 and group sessions. Students pay via Razorpay before booking — you get paid reliably. Set ₹300–₹2,000+ per session." },
  { icon: "🤝", title: "Or volunteer for free", desc: "Choose volunteer mode — students book without payment. Build your reputation, get featured on the platform, and earn a verified mentor badge." },
  { icon: "🎤", title: "Host events & workshops", desc: "Create free or paid events with cover images, agendas, and Zoom links. Manage attendees, remove participants, and track registrations from your dashboard." },
  { icon: "📝", title: "Write blog posts", desc: "Share your expertise through blog articles. Add cover images, YouTube embeds, and tags. Published after admin approval — builds your authority." },
  { icon: "⭐", title: "Ratings & verified status", desc: "Students rate sessions 1-5 stars with reviews. Your average rating shows on your profile. Verified badge from official email — builds trust instantly." },
  { icon: "📊", title: "Full mentor dashboard", desc: "See pending requests, upcoming sessions, completed count. Accept with Zoom link, decline with reason, mark complete. All in one place." },
];

const earningBreakdown = [
  { tier: "Starter", rate: "₹300–500", desc: "per 30-min session", who: "2–5 years experience" },
  { tier: "Expert", rate: "₹500–1,000", desc: "per 30-min session", who: "5–10 years experience" },
  { tier: "Senior", rate: "₹1,000–2,000", desc: "per 30-min session", who: "10+ years, MAANG/Big4" },
];

const howItWorks = [
  { num: "01", title: "Apply to become a mentor", desc: "Fill out the mentor onboarding form with your official company email, experience, and areas of expertise." },
  { num: "02", title: "Get verified", desc: "Our team verifies your profile through your company email domain. You get a verified mentor badge within 48 hours." },
  { num: "03", title: "Set your availability", desc: "Choose paid or volunteer. Set your weekly hours. We match you with students who need exactly what you know." },
  { num: "04", title: "Start mentoring & earning", desc: "Take sessions, share your experience, and help students land their dream jobs. Get paid per session or build your volunteer profile." },
];

const testimonials = [
  { name: "Anil Verma", role: "Senior Analyst, TCS", quote: "I started mentoring 2 hours a week. Now I do 5 sessions a week and earn ₹20K+ a month. But honestly, seeing mentees get placed is the real reward.", initials: "AV", color: "#00b9f2" },
  { name: "Meera Iyer", role: "Cyber Risk Manager, KPMG", quote: "I volunteer because someone guided me when I was starting out. SkillMap makes it easy — they handle scheduling, I just show up and share what I know.", initials: "MI", color: "#00338d" },
  { name: "Rajesh Nair", role: "Data & AI Lead, Deloitte", quote: "I've done 200+ sessions. The platform is simple, students come prepared, and I get to stay sharp by explaining concepts. Win-win.", initials: "RN", color: "#86bc25" },
];

const faq = [
  { q: "Do I need to be from a big company?", a: "No. We accept mentors from companies of all sizes. What matters is relevant experience and the ability to guide students effectively. We verify through your official email." },
  { q: "How much time do I need to commit?", a: "As little as 1-2 hours per week. You control your schedule entirely. There's no minimum commitment." },
  { q: "How do I get paid?", a: "Paid mentors receive payment directly to their bank account on a monthly cycle. We handle billing, scheduling, and student matching — you just mentor." },
  { q: "Can I switch between paid and volunteer?", a: "Yes, you can change your preference at any time from your mentor dashboard." },
  { q: "What if a student doesn't show up?", a: "Students are charged a no-show fee. You're still compensated for your blocked time if a student cancels within 2 hours of the session." },
];

export default function ForMentorsPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden py-24 md:py-32 px-6 md:px-12" style={{ background: "var(--ink)" }}>
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] rounded-full blur-[120px] opacity-10" style={{ background: "#f59e0b" }} />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full blur-[100px] opacity-10" style={{ background: "var(--accent)" }} />
        <div className="relative max-w-[1100px] mx-auto">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-xs font-bold tracking-[0.1em] uppercase ${syne}`} style={{ background: "rgba(232,255,71,0.1)", color: "var(--accent)", border: "1px solid rgba(232,255,71,0.2)" }}>
            <span className="text-base">🧑‍🏫</span> For Industry Mentors
          </div>
          <h1 className={`${syne} font-extrabold text-white leading-[1] tracking-[-0.03em] mb-6`} style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}>
            Share what you know.<br />
            <span style={{ color: "var(--accent)" }}>Get paid. Or give back.</span>
          </h1>
          <p className="text-lg font-light max-w-[560px] leading-[1.7] mb-10" style={{ color: "rgba(255,255,255,0.5)" }}>
            You&apos;ve cracked the code to getting hired at top companies. Now help the next generation do the same — on your schedule, your terms.
          </p>
          <div className="flex gap-4 flex-wrap">
            <Link href="/forms/mentor-onboarding" className={`inline-flex items-center gap-2 px-8 py-4 rounded-2xl ${syne} font-bold text-base no-underline transition-transform hover:-translate-y-0.5`} style={{ background: "var(--accent)", color: "var(--ink)" }}>
              Become a mentor →
            </Link>
            <a href="#earning" className={`inline-flex items-center gap-2 px-8 py-4 rounded-2xl ${syne} font-semibold text-base no-underline border-[1.5px] transition-colors hover:border-[var(--accent)]`} style={{ borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)" }}>
              See earning potential
            </a>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 px-6 md:px-12" style={{ background: "var(--surface)" }}>
        <div className="max-w-[1100px] mx-auto">
          <span className={`${syne} text-xs font-bold tracking-[0.15em] uppercase block mb-4`} style={{ color: "var(--muted)" }}>Why mentor on SkillMap</span>
          <h2 className={`${syne} font-extrabold tracking-[-0.02em] mb-12`} style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            More than just mentoring.<br />A platform built for you.
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

      {/* Earning breakdown */}
      <section id="earning" className="py-24 px-6 md:px-12 bg-white">
        <div className="max-w-[1100px] mx-auto">
          <span className={`${syne} text-xs font-bold tracking-[0.15em] uppercase block mb-4`} style={{ color: "var(--muted)" }}>Earning potential</span>
          <h2 className={`${syne} font-extrabold tracking-[-0.02em] mb-4`} style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            Your knowledge has value.<br />We make sure you&apos;re compensated.
          </h2>
          <p className="text-base mb-12 max-w-[560px]" style={{ color: "var(--muted)" }}>
            Rates are based on your experience level and expertise. Top mentors on our platform earn ₹40,000–₹80,000+ per month mentoring part-time.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {earningBreakdown.map((e) => (
              <div key={e.tier} className="rounded-2xl border p-6" style={{ borderColor: "var(--border)" }}>
                <div className={`${syne} text-xs font-bold tracking-[0.1em] uppercase mb-4`} style={{ color: "var(--muted)" }}>{e.tier}</div>
                <div className={`${syne} text-3xl font-extrabold mb-1`} style={{ color: "var(--ink)" }}>{e.rate}</div>
                <div className="text-sm" style={{ color: "var(--muted)" }}>{e.desc}</div>
                <div className="mt-4 text-xs px-3 py-1.5 rounded-full inline-block border" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>{e.who}</div>
              </div>
            ))}
          </div>

          {/* Earning calculator */}
          <div className="rounded-2xl p-8" style={{ background: "var(--ink)" }}>
            <h3 className={`${syne} font-bold text-white text-lg mb-2`}>Quick math</h3>
            <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>Even 5 sessions a week at ₹500 = ₹10,000/month. 10 sessions a week at ₹1,000 = ₹40,000/month. All from home, on your schedule.</p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { sessions: "5/week", rate: "₹500", total: "₹10,000/mo" },
                { sessions: "8/week", rate: "₹750", total: "₹24,000/mo" },
                { sessions: "10/week", rate: "₹1,000", total: "₹40,000/mo" },
              ].map((e) => (
                <div key={e.sessions} className="rounded-xl p-4 text-center" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <div className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>{e.sessions} × {e.rate}</div>
                  <div className={`${syne} text-xl font-extrabold`} style={{ color: "var(--accent)" }}>{e.total}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 md:px-12" style={{ background: "var(--surface)" }}>
        <div className="max-w-[1100px] mx-auto">
          <span className={`${syne} text-xs font-bold tracking-[0.15em] uppercase block mb-4`} style={{ color: "var(--muted)" }}>How it works</span>
          <h2 className={`${syne} font-extrabold tracking-[-0.02em] mb-12`} style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            Start mentoring<br />in 4 simple steps.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((s) => (
              <div key={s.num}>
                <div className={`${syne} text-5xl font-extrabold mb-4 opacity-[0.06]`}>{s.num}</div>
                <h3 className={`${syne} font-bold text-base mb-2`}>{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 md:px-12 bg-white">
        <div className="max-w-[1100px] mx-auto">
          <span className={`${syne} text-xs font-bold tracking-[0.15em] uppercase block mb-4`} style={{ color: "var(--muted)" }}>From our mentors</span>
          <h2 className={`${syne} font-extrabold tracking-[-0.02em] mb-12`} style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            They mentor. They earn.<br />They make a difference.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-2xl border p-6" style={{ borderColor: "var(--border)" }}>
                <p className="text-sm leading-relaxed italic mb-6" style={{ color: "var(--ink)" }}>&quot;{t.quote}&quot;</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${syne} font-bold text-xs text-white`} style={{ background: t.color }}>{t.initials}</div>
                  <div>
                    <div className={`${syne} font-bold text-sm`}>{t.name}</div>
                    <div className="text-xs" style={{ color: "var(--muted)" }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6 md:px-12" style={{ background: "var(--surface)" }}>
        <div className="max-w-[720px] mx-auto">
          <h2 className={`${syne} font-extrabold tracking-[-0.02em] mb-12`} style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            Common questions.
          </h2>
          <div className="space-y-0">
            {faq.map((f, i) => (
              <details key={i} className="border-b group" style={{ borderColor: "var(--border)" }}>
                <summary className={`flex justify-between items-center py-5 cursor-pointer ${syne} font-bold text-base list-none`} style={{ color: "var(--ink)" }}>
                  {f.q}
                  <span className="text-xl shrink-0 ml-4 transition-transform group-open:rotate-45" style={{ color: "var(--muted)" }}>+</span>
                </summary>
                <p className="pb-5 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 md:px-12 text-center relative overflow-hidden" style={{ background: "var(--ink2)" }}>
        <div className="absolute w-[400px] h-[400px] rounded-full blur-[100px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10" style={{ background: "var(--accent)" }} />
        <div className="relative max-w-[600px] mx-auto">
          <h2 className={`${syne} font-extrabold text-white tracking-[-0.03em] mb-4`} style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
            Your experience is <span style={{ color: "var(--accent)" }}>someone&apos;s roadmap.</span>
          </h2>
          <p className="text-base mb-8" style={{ color: "rgba(255,255,255,0.5)" }}>Join 100+ mentors helping India&apos;s next generation land their dream jobs.</p>
          <Link href="/forms/mentor-onboarding" className={`inline-flex items-center gap-2 px-8 py-4 rounded-2xl ${syne} font-bold text-base no-underline cta-btn-main`} style={{ background: "var(--accent)", color: "var(--ink)" }}>
            Become a mentor →
          </Link>
          <p className="mt-4 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Free to join · Official email required · Verified in 48 hours</p>
        </div>
      </section>
    </div>
  );
}
