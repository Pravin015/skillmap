"use client";

import Link from "next/link";

const heading = "font-[family-name:var(--font-heading)]";

const benefits = [
  { title: "Set Your Own Rates", desc: "Charge Rs.300-2,000 per session. You decide your pricing for 1-on-1 and group sessions." },
  { title: "Volunteer Mode", desc: "Not about the money? Switch to volunteer mode and mentor students for free. Build your reputation." },
  { title: "Host Events", desc: "Create workshops, webinars, and career guidance events. Free or paid with Razorpay integration." },
  { title: "Write & Publish", desc: "Share career tips via the blog. Your articles reach thousands of students preparing for interviews." },
  { title: "Verified Badge", desc: "Get verified by admin after review. Verified mentors appear higher in search and get more bookings." },
  { title: "Full Dashboard", desc: "Track your sessions, earnings, ratings, and student feedback. Manage availability and session requests." },
];

const earningTiers = [
  { level: "Starter", sessions: "2-4/week", rate: "Rs.300-500", monthly: "Rs.2,400-8,000", exp: "0-2 years" },
  { level: "Expert", sessions: "4-8/week", rate: "Rs.500-1,000", monthly: "Rs.8,000-32,000", exp: "3-5 years" },
  { level: "Senior", sessions: "6-12/week", rate: "Rs.1,000-2,000", monthly: "Rs.24,000-96,000", exp: "5+ years" },
];

const steps = [
  { num: "01", title: "Apply as Mentor", desc: "Fill out the mentor onboarding form with your experience, expertise, and LinkedIn profile." },
  { num: "02", title: "Get Verified", desc: "Admin reviews your application. Verified mentors get a badge and appear in student searches." },
  { num: "03", title: "Set Availability & Rates", desc: "Configure your session rates, availability, and whether you offer free or paid sessions." },
  { num: "04", title: "Start Mentoring", desc: "Students book sessions. You accept, share Zoom links, conduct sessions, and get rated." },
];

export default function ForMentorsPage() {
  return (
    <div style={{ background: "var(--surface)" }}>
      {/* Hero */}
      <section className="px-4 pt-24 pb-16 md:pt-32 md:pb-20 text-center" style={{ background: "var(--ink)" }}>
        <div className="max-w-3xl mx-auto">
          <div className="section-eyebrow justify-center" style={{ color: "var(--primary)" }}>For Industry Mentors</div>
          <h1 className={`${heading} font-extrabold text-2xl md:text-4xl text-white mb-4 leading-tight`}>
            Share What You Know.<br />Get Paid. Or Give Back.
          </h1>
          <p className="text-sm md:text-base mb-8" style={{ color: "rgba(255,255,255,0.6)" }}>
            Guide India&apos;s next generation of professionals. Set your own rates, host events, and build your reputation.
          </p>
          <Link href="/forms/mentor-onboarding" className="btn-primary no-underline" style={{ padding: "12px 28px" }}>Apply as Mentor</Link>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="section-eyebrow justify-center">Why Mentor on SkillMap</div>
            <h2 className={`${heading} font-extrabold text-2xl md:text-3xl`} style={{ color: "var(--ink)" }}>Everything You Need to Mentor</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {benefits.map((b) => (
              <div key={b.title} className="card-elevated">
                <h3 className={`${heading} text-sm font-bold mb-2`} style={{ color: "var(--ink)" }}>{b.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Earning Potential */}
      <section className="px-4 py-16" style={{ background: "var(--surface-alt)" }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="section-eyebrow justify-center">Earning Potential</div>
            <h2 className={`${heading} font-extrabold text-2xl md:text-3xl`} style={{ color: "var(--ink)" }}>Your Knowledge Has Value</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {earningTiers.map((t) => (
              <div key={t.level} className="card-elevated text-center">
                <div className={`${heading} text-sm font-bold mb-1`} style={{ color: "var(--primary)" }}>{t.level}</div>
                <div className="text-[10px] mb-3" style={{ color: "var(--muted)" }}>{t.exp} experience</div>
                <div className={`${heading} text-xl font-extrabold mb-1`} style={{ color: "var(--ink)" }}>{t.rate}</div>
                <div className="text-xs" style={{ color: "var(--muted)" }}>per session · {t.sessions}</div>
                <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                  <div className={`${heading} text-lg font-bold`} style={{ color: "var(--success)" }}>{t.monthly}</div>
                  <div className="text-[10px]" style={{ color: "var(--muted)" }}>potential monthly</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="section-eyebrow justify-center">How it works</div>
            <h2 className={`${heading} font-extrabold text-2xl md:text-3xl`} style={{ color: "var(--ink)" }}>Start Mentoring in 4 Steps</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((s) => (
              <div key={s.num} className="card-elevated" style={{ padding: "28px 20px" }}>
                <div className={`${heading} text-xs font-bold mb-3 inline-block px-2 py-0.5 rounded`} style={{ background: "var(--primary-light)", color: "var(--primary)" }}>Step {s.num}</div>
                <h3 className={`${heading} text-sm font-bold mb-2`} style={{ color: "var(--ink)" }}>{s.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16" style={{ background: "var(--primary)" }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className={`${heading} font-extrabold text-xl md:text-2xl text-white mb-3`}>Ready to Make an Impact?</h2>
          <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.7)" }}>Join verified mentors helping students land their dream jobs.</p>
          <Link href="/forms/mentor-onboarding" className="inline-block rounded-xl px-8 py-3 text-sm font-semibold no-underline" style={{ background: "white", color: "var(--primary)" }}>
            Apply as Mentor — Free
          </Link>
        </div>
      </section>
    </div>
  );
}
