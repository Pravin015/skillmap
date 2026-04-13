"use client";
import Link from "next/link";
import { useState } from "react";
const heading = "font-[family-name:var(--font-heading)]";

const steps = [
  { id: "onboard", num: "01", title: "Company Onboarding", desc: "Register your company on SkillMap. Manual verification required.", actions: [{ label: "Onboarding Form", href: "/forms/company-onboarding", primary: true }, { label: "Sign Up as ORG", href: "/auth/signup?role=ORG" }],
    features: ["Submit onboarding form with official email (no Gmail/Yahoo)", "Admin reviews and creates your account", "Or sign up directly as ORG with organisation name", "Verification through official email domain", "Account activated within 2-3 business days"],
    testChecklist: ["Fill /forms/company-onboarding → submit → success message", "Check admin panel → form submission should appear", "Admin clicks 'Create Account' → ORG account created", "Login with provided credentials → company dashboard loads"] },

  { id: "login", num: "02", title: "Login & Dashboard", desc: "Access your company dashboard to manage HR and hiring.", actions: [{ label: "Login", href: "/auth/login?role=ORG", primary: true }, { label: "Dashboard", href: "/company-dashboard" }],
    features: ["Select 'Organisation' tab on login", "First login → change password prompt", "Company Dashboard with overview, stats, quick actions", "Hiring funnel (Applied → Screened → Interview → Offer → Hired)", "Recent activity feed"],
    testChecklist: ["Login as ORG → redirected to /company-dashboard", "Overview shows stats cards", "Hiring funnel shows pipeline stages"] },

  { id: "add-hr", num: "03", title: "Add HR Accounts", desc: "Create HR accounts for your team. Only you can add them.", actions: [{ label: "Manage HR", href: "/company-dashboard", primary: true }],
    features: ["Add HR: name, email, phone → auto-generated temp password", "Temp password shown ONCE — copy and share securely", "HR gets 'mustChangePassword' flag → prompted on first login", "HR account linked to your organisation automatically", "HR receives notification email on account creation"],
    testChecklist: ["Go to Manage HR tab → click '+ Add HR'", "Fill name + email → click 'Create HR Account'", "Temp password displayed → copy it", "HR logs in with temp password → change password page", "HR dashboard loads after password change"] },

  { id: "manage-hr", num: "04", title: "Manage HR Team", desc: "Delete HR accounts, reset passwords, track activity.", actions: [{ label: "Manage HR", href: "/company-dashboard", primary: true }],
    features: ["List of all HRs with name, email, join date", "Reset Password → generates new temp password (shown once)", "Delete HR → removes account with confirmation", "Company gets notification on HR add/remove"],
    testChecklist: ["HR list shows all created HRs", "Click 'Reset Pwd' → new password generated", "Click 'Delete' → confirm → HR removed from list"] },

  { id: "hr-tracker", num: "05", title: "HR Performance Tracker", desc: "Track each HR's activity and job posts.", actions: [{ label: "HR Tracker", href: "/company-dashboard", primary: true }],
    features: ["Per-HR performance cards", "Metrics: Job Posts, Applications, Interviews, Offers, Hired", "Recent job posts from each HR"],
    testChecklist: ["HR Tracker tab → shows HR cards", "Metrics update as HR posts jobs and receives applications"] },

  { id: "analytics", num: "06", title: "Hiring Analytics", desc: "Data-driven insights into your hiring performance.", actions: [{ label: "Analytics", href: "/company-dashboard", primary: true }],
    features: ["Avg Time to Hire, Offer Acceptance Rate, Cost per Hire", "Hiring Trend chart placeholder", "Source of Hires breakdown", "Hiring by Domain (Software, Cyber, Cloud, Data, Consulting)", "Candidate Quality Score (applicant vs hired avg)"],
    testChecklist: ["Analytics tab → stat cards load", "Active HR count should be correct", "Domain breakdown shows categories"] },

  { id: "settings", num: "07", title: "Company Settings", desc: "Manage organisation profile and notifications.", actions: [{ label: "Settings", href: "/company-dashboard", primary: true }],
    features: ["Organisation profile card with verified badge", "Notification preferences: new apps, HR alerts, hackathon results, weekly digest", "Toggle notifications on/off"],
    testChecklist: ["Settings tab → org name and badge visible", "Toggle notification checkboxes"] },
];

export default function CompanyGuidePage() {
  const [openStep, setOpenStep] = useState<string | null>("onboard");
  return (
    <div className="min-h-[calc(100vh-4rem)]" style={{ background: "var(--surface)" }}>
      <section className="py-12 px-4 md:px-8" style={{ background: "var(--ink)" }}>
        <div className="max-w-4xl mx-auto">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-xs font-bold tracking-[0.1em] uppercase ${heading}`} style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}>🏢 Company Guide</div>
          <h1 className={`${heading} font-bold text-3xl md:text-4xl text-white mb-3`}>Company / Organisation Guide</h1>
          <p className="text-base" style={{ color: "rgba(255,255,255,0.5)" }}>Step-by-step guide for managing your company on SkillMap — add HRs, track hiring, view analytics.</p>
        </div>
      </section>
      <section className="py-8 px-4 md:px-8"><div className="max-w-4xl mx-auto space-y-4">
        {steps.map((step) => { const isOpen = openStep === step.id; return (
          <div key={step.id} className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: isOpen ? "var(--ink)" : "var(--border)" }}>
            <button onClick={() => setOpenStep(isOpen ? null : step.id)} className="w-full flex items-center gap-4 p-5 text-left">
              <span className={`${heading} text-3xl font-bold shrink-0`} style={{ color: isOpen ? "#22c55e" : "var(--border)", background: isOpen ? "var(--ink)" : "transparent", padding: isOpen ? "4px 12px" : "0", borderRadius: "12px" }}>{step.num}</span>
              <div className="flex-1"><h3 className={`${heading} font-bold text-base`}>{step.title}</h3><p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{step.desc}</p></div>
              <svg className={`w-5 h-5 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "var(--muted)" }}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {isOpen && (
              <div className="px-5 pb-5 border-t pt-4" style={{ borderColor: "var(--border)" }}>
                <div className="flex gap-2 flex-wrap mb-5">{step.actions.map((a) => (<Link key={a.href} href={a.href} target="_blank" className={`px-4 py-2 rounded-xl ${heading} font-bold text-xs no-underline`} style={{ background: a.primary ? "var(--ink)" : "white", color: a.primary ? "#22c55e" : "var(--ink)", border: a.primary ? "none" : "1px solid var(--border)" }}>{a.label} ↗</Link>))}</div>
                <div className="mb-5"><h4 className={`${heading} font-bold text-sm mb-2`}>Features:</h4><div className="space-y-1.5">{step.features.map((f, i) => (<div key={i} className="flex gap-2 text-sm"><span style={{ color: "#22c55e", background: "var(--ink)", width: "18px", height: "18px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, flexShrink: 0, marginTop: "2px" }}>✓</span><span style={{ color: "var(--muted)" }}>{f}</span></div>))}</div></div>
                <div className="rounded-xl p-4 border" style={{ borderColor: "rgba(34,197,94,0.2)", background: "rgba(34,197,94,0.03)" }}><h4 className={`${heading} font-bold text-sm mb-2`}>🧪 Test:</h4><div className="space-y-1.5">{step.testChecklist.map((t, i) => (<label key={i} className="flex gap-2 text-sm cursor-pointer items-start"><input type="checkbox" className="mt-1 accent-[var(--ink)]" /><span style={{ color: "var(--muted)" }}>{t}</span></label>))}</div></div>
              </div>
            )}
          </div>
        ); })}
      </div></section>
    </div>
  );
}
