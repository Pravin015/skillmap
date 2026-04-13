"use client";

import Link from "next/link";

const heading = "font-[family-name:var(--font-heading)]";

const benefits = [
  { title: "AI-Powered JD Matching", desc: "Paste a job description — AI finds the best-matching candidates from our database with match percentages." },
  { title: "Proctored Lab Assessments", desc: "Attach timed MCQ assessments to job postings. Fullscreen proctoring, tab-switch detection, webcam verification." },
  { title: "Candidate Pipeline (Kanban)", desc: "Visual pipeline: Applied → Screening → Interview → Offer → Hired. Drag-and-drop with notes per candidate." },
  { title: "Hiring Challenges", desc: "Host hackathons, coding challenges, and quizzes. Students compete, you hire the top performers directly." },
  { title: "Company Profile Page", desc: "Branded public page with your logo, culture, open roles. Students follow your company for job alerts." },
  { title: "Multi-HR Management", desc: "Add multiple HR accounts. Each HR posts jobs, tracks applications. Company admin sees all data across HRs." },
];

const steps = [
  { num: "01", title: "Register Your Company", desc: "Create an ORG account. Set up your company profile with branding and culture info." },
  { num: "02", title: "Add Your HR Team", desc: "Invite HR team members. Each gets their own dashboard with job posting and candidate management." },
  { num: "03", title: "Post Jobs & Challenges", desc: "Post job openings with optional lab assessments. Create hiring challenges to find top talent." },
  { num: "04", title: "Hire Top Candidates", desc: "Review AI-matched candidates, use the pipeline to track progress, and close hires faster." },
];

export default function ForCompaniesPage() {
  return (
    <div style={{ background: "var(--surface)" }}>
      {/* Hero */}
      <section className="px-4 pt-24 pb-16 md:pt-32 md:pb-20 text-center" style={{ background: "var(--ink)" }}>
        <div className="max-w-3xl mx-auto">
          <div className="section-eyebrow justify-center" style={{ color: "var(--primary)" }}>For Companies & HR Teams</div>
          <h1 className={`${heading} font-extrabold text-2xl md:text-4xl text-white mb-4 leading-tight`}>
            Hire Job-Ready Talent.<br />Not Just Resumes.
          </h1>
          <p className="text-sm md:text-base mb-8" style={{ color: "rgba(255,255,255,0.6)" }}>
            AI-powered candidate matching, proctored assessments, and hiring challenges — all in one platform.
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/auth/signup?role=ORG" className="btn-primary no-underline" style={{ padding: "12px 28px" }}>Register Your Company</Link>
            <Link href="/forms/hire-from-us" className="btn-outline no-underline" style={{ borderColor: "rgba(255,255,255,0.2)", color: "white", padding: "12px 28px" }}>Hire From Us</Link>
          </div>
        </div>
      </section>

      {/* Company Logos */}
      <section className="px-4 py-8 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-x-10 gap-y-3">
          {["TCS", "Infosys", "Wipro", "KPMG", "Deloitte", "Google", "Flipkart", "Razorpay"].map((c) => (
            <span key={c} className={`${heading} text-sm font-bold`} style={{ color: "var(--border)" }}>{c}</span>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="section-eyebrow justify-center">What You Get</div>
            <h2 className={`${heading} font-extrabold text-2xl md:text-3xl`} style={{ color: "var(--ink)" }}>End-to-End Hiring Platform</h2>
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
            <h2 className={`${heading} font-extrabold text-2xl md:text-3xl`} style={{ color: "var(--ink)" }}>Start Hiring in 4 Steps</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((s) => (
              <div key={s.num} className="card-elevated relative" style={{ padding: "28px 20px" }}>
                <div className={`${heading} text-xs font-bold mb-3 inline-block px-2 py-0.5 rounded`} style={{ background: "var(--primary-light)", color: "var(--primary)" }}>Step {s.num}</div>
                <h3 className={`${heading} text-sm font-bold mb-2`} style={{ color: "var(--ink)" }}>{s.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className={`${heading} font-extrabold text-2xl md:text-3xl`} style={{ color: "var(--ink)" }}>Simple Pricing</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: "Starter", price: "Free", desc: "For small teams getting started", features: ["5 job posts/month", "Basic candidate search", "Application tracking", "Email notifications"], cta: "Get Started", href: "/auth/signup?role=ORG" },
              { name: "Growth", price: "Rs.4,999/mo", desc: "For growing companies", features: ["Unlimited job posts", "AI JD matching", "Proctored assessments", "Hiring challenges", "Candidate pipeline", "Priority support"], cta: "Start Trial", href: "/auth/signup?role=ORG", featured: true },
              { name: "Enterprise", price: "Custom", desc: "For large organisations", features: ["Everything in Growth", "Dedicated account manager", "Custom integrations", "SLA guarantee", "White-label option", "API access"], cta: "Contact Us", href: "/forms/hire-from-us" },
            ].map((plan) => (
              <div key={plan.name} className={`card-elevated ${plan.featured ? "ring-2" : ""}`} style={{ ...(plan.featured ? { borderColor: "var(--primary)", boxShadow: "0 0 0 2px var(--primary-light)" } : {}) }}>
                {plan.featured && <div className="text-[10px] font-bold text-center mb-3 px-2 py-1 rounded-full mx-auto w-fit" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>Most Popular</div>}
                <div className={`${heading} text-lg font-bold mb-1`} style={{ color: "var(--ink)" }}>{plan.name}</div>
                <div className={`${heading} text-2xl font-extrabold mb-1`} style={{ color: "var(--primary)" }}>{plan.price}</div>
                <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>{plan.desc}</p>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => <li key={f} className="flex items-start gap-2 text-xs" style={{ color: "var(--ink-light)" }}><span style={{ color: "var(--primary)" }}>✓</span> {f}</li>)}
                </ul>
                <Link href={plan.href} className={`block text-center rounded-xl py-2.5 text-sm font-semibold no-underline ${plan.featured ? "btn-primary" : "btn-outline"}`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16" style={{ background: "var(--primary)" }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className={`${heading} font-extrabold text-xl md:text-2xl text-white mb-3`}>Ready to Hire Smarter?</h2>
          <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.7)" }}>Join companies using SkillMap to find job-ready talent.</p>
          <Link href="/auth/signup?role=ORG" className="inline-block rounded-xl px-8 py-3 text-sm font-semibold no-underline" style={{ background: "white", color: "var(--primary)" }}>
            Register Your Company — Free
          </Link>
        </div>
      </section>
    </div>
  );
}
