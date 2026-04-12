"use client";
import Link from "next/link";
const syne = "font-[family-name:var(--font-syne)]";

const benefits = [
  { icon: "🎓", title: "Bulk student management", desc: "Add and manage hundreds of students from one dashboard. Track their profiles, applications, and placement status in real-time." },
  { icon: "📊", title: "Placement analytics", desc: "See placement rates, domain distribution, top hiring companies, and student performance — all in one dashboard." },
  { icon: "🏢", title: "Direct company connections", desc: "Browse and connect with companies hiring on SkillMap. Build relationships with HR teams for campus drives." },
  { icon: "🤖", title: "AI-powered prep for students", desc: "Every enrolled student gets access to AI career advisor, skill gap analysis, and personalised roadmaps." },
  { icon: "💰", title: "Earning opportunities", desc: "Earn revenue when your students get placed through SkillMap. Details of the referral program will be shared during onboarding." },
  { icon: "🛡️", title: "Verified institution status", desc: "Official email verification ensures trust. Companies see your institution as a verified talent source." },
];

const steps = [
  { num: "01", title: "Submit onboarding form", desc: "Fill out the institution onboarding form with your official details. No public signup — we verify every institution manually." },
  { num: "02", title: "Get verified by our team", desc: "We verify your institution through official email domain. Activation within 2-3 business days." },
  { num: "03", title: "Add your students", desc: "Bulk-add students from your dashboard. Each gets a SkillMap account linked to your institution." },
  { num: "04", title: "Track & earn", desc: "Monitor placements, track student progress, connect with companies, and earn referral revenue." },
];

export default function ForInstitutionsPage() {
  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden py-24 md:py-32 px-6 md:px-12" style={{ background: "var(--ink)" }}>
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[120px] opacity-10" style={{ background: "#8b5cf6" }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-[100px] opacity-10" style={{ background: "var(--accent)" }} />
        <div className="relative max-w-[1100px] mx-auto">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-xs font-bold tracking-[0.1em] uppercase ${syne}`} style={{ background: "rgba(232,255,71,0.1)", color: "var(--accent)", border: "1px solid rgba(232,255,71,0.2)" }}>
            <span className="text-base">🏫</span> For Colleges & Institutions
          </div>
          <h1 className={`${syne} font-extrabold text-white leading-[1] tracking-[-0.03em] mb-6`} style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}>
            Empower your students.<br /><span style={{ color: "var(--accent)" }}>Track their journey.</span>
          </h1>
          <p className="text-lg font-light max-w-[560px] leading-[1.7] mb-10" style={{ color: "rgba(255,255,255,0.5)" }}>
            Give your students a competitive edge with AI-powered career prep, skill mapping, and direct company connections — all managed from your institution dashboard.
          </p>
          <div className="flex gap-4 flex-wrap">
            <Link href="/forms/institution-onboarding" className={`inline-flex items-center gap-2 px-8 py-4 rounded-2xl ${syne} font-bold text-base no-underline transition-transform hover:-translate-y-0.5`} style={{ background: "var(--accent)", color: "var(--ink)" }}>Request onboarding →</Link>
            <a href="#benefits" className={`inline-flex items-center gap-2 px-8 py-4 rounded-2xl ${syne} font-semibold text-base no-underline border-[1.5px] transition-colors hover:border-[var(--accent)]`} style={{ borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)" }}>See benefits</a>
          </div>
          <div className="mt-8 rounded-xl p-3 inline-block border text-sm" style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}>
            No public signup · Manual onboarding only · Verified institutions
          </div>
        </div>
      </section>

      <section id="benefits" className="py-24 px-6 md:px-12" style={{ background: "var(--surface)" }}>
        <div className="max-w-[1100px] mx-auto">
          <span className={`${syne} text-[0.7rem] font-bold tracking-[0.15em] uppercase block mb-4`} style={{ color: "var(--muted)" }}>Why partner with SkillMap</span>
          <h2 className={`${syne} font-extrabold tracking-[-0.02em] mb-12`} style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>Everything your placement cell needs.<br />In one platform.</h2>
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

      <section className="py-24 px-6 md:px-12 bg-white">
        <div className="max-w-[1100px] mx-auto">
          <span className={`${syne} text-[0.7rem] font-bold tracking-[0.15em] uppercase block mb-4`} style={{ color: "var(--muted)" }}>How it works</span>
          <h2 className={`${syne} font-extrabold tracking-[-0.02em] mb-12`} style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>From onboarding to placements.<br />In 4 steps.</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s) => (
              <div key={s.num}><div className={`${syne} text-5xl font-extrabold mb-4 opacity-[0.06]`}>{s.num}</div><h3 className={`${syne} font-bold text-base mb-2`}>{s.title}</h3><p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{s.desc}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 md:px-12 text-center relative overflow-hidden" style={{ background: "var(--ink2)" }}>
        <div className="absolute w-[400px] h-[400px] rounded-full blur-[100px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10" style={{ background: "var(--accent)" }} />
        <div className="relative max-w-[600px] mx-auto">
          <h2 className={`${syne} font-extrabold text-white tracking-[-0.03em] mb-4`} style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>Your students deserve <span style={{ color: "var(--accent)" }}>better placement support.</span></h2>
          <p className="text-base mb-8" style={{ color: "rgba(255,255,255,0.5)" }}>Join SkillMap and give them the tools to land their dream jobs.</p>
          <Link href="/forms/institution-onboarding" className={`inline-flex items-center gap-2 px-8 py-4 rounded-2xl ${syne} font-bold text-base no-underline cta-btn-main`} style={{ background: "var(--accent)", color: "var(--ink)" }}>Request onboarding →</Link>
          <p className="mt-4 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Manual verification · Official email required · Free to get started</p>
        </div>
      </section>
    </div>
  );
}
