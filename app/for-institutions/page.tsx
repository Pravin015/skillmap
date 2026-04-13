"use client";
import Link from "next/link";
const heading = "font-[family-name:var(--font-heading)]";

const benefits = [
  { title: "Bulk Student Management", desc: "Onboard students in batches. Track each student's profile completion, skills, and placement status." },
  { title: "Placement Tracking", desc: "See which students are placed, at which companies, and at what CTC. Real-time placement analytics." },
  { title: "Company Access", desc: "Browse all registered companies, view their open roles, and connect your students with the right employers." },
  { title: "AI + Mentor Access", desc: "Students get free AI career advising and can book mentor sessions — included with institution enrollment." },
  { title: "Lab Assessments", desc: "Students take proctored lab assessments for job applications. Track scores and pass rates institution-wide." },
  { title: "Verified Status", desc: "Verified institutions get priority listing and trust badges. Manual verification ensures quality." },
];

const steps = [
  { num: "01", title: "Submit Onboarding Form", desc: "Fill out the institution onboarding form with your college details and official email." },
  { num: "02", title: "Get Verified", desc: "Admin manually verifies your institution. Official email required for verification." },
  { num: "03", title: "Add Students", desc: "Bulk onboard students. They get accounts with access to jobs, AI advisor, and mentor sessions." },
  { num: "04", title: "Track & Report", desc: "Monitor student activity, placement rates, and generate reports for your placement cell." },
];

export default function ForInstitutionsPage() {
  return (
    <div style={{ background: "var(--surface)" }}>
      {/* Hero */}
      <section className="px-4 pt-24 pb-16 md:pt-32 md:pb-20 text-center" style={{ background: "var(--ink)" }}>
        <div className="max-w-3xl mx-auto">
          <div className="section-eyebrow justify-center" style={{ color: "var(--primary)" }}>For Colleges & Institutions</div>
          <h1 className={`${heading} font-extrabold text-2xl md:text-4xl text-white mb-4 leading-tight`}>
            Empower Your Students.<br />Track Their Journey.
          </h1>
          <p className="text-sm md:text-base mb-8" style={{ color: "rgba(255,255,255,0.6)" }}>
            Manage placements, track student progress, and give your students access to AI-powered career tools.
          </p>
          <Link href="/forms/institution-onboarding" className="btn-primary no-underline" style={{ padding: "12px 28px" }}>Register Your Institution</Link>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="section-eyebrow justify-center">What You Get</div>
            <h2 className={`${heading} font-extrabold text-2xl md:text-3xl`} style={{ color: "var(--ink)" }}>Complete Placement Management</h2>
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

      {/* How It Works */}
      <section className="px-4 py-16" style={{ background: "var(--surface-alt)" }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="section-eyebrow justify-center">How it works</div>
            <h2 className={`${heading} font-extrabold text-2xl md:text-3xl`} style={{ color: "var(--ink)" }}>Get Started in 4 Steps</h2>
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

      {/* Info */}
      <section className="px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="card-elevated" style={{ borderColor: "var(--primary)", borderLeft: "3px solid var(--primary)" }}>
            <p className="text-sm" style={{ color: "var(--ink-light)" }}>
              Manual verification required · Official institution email needed · Free to get started
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16" style={{ background: "var(--primary)" }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className={`${heading} font-extrabold text-xl md:text-2xl text-white mb-3`}>Ready to Transform Placements?</h2>
          <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.7)" }}>Join institutions using SkillMap for student career readiness.</p>
          <Link href="/forms/institution-onboarding" className="inline-block rounded-xl px-8 py-3 text-sm font-semibold no-underline" style={{ background: "white", color: "var(--primary)" }}>
            Register Institution — Free
          </Link>
        </div>
      </section>
    </div>
  );
}
