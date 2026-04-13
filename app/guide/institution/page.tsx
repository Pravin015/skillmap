"use client";
import Link from "next/link";
import { useState } from "react";
const heading = "font-[family-name:var(--font-heading)]";

const steps = [
  { id: "onboard", num: "01", title: "Institution Onboarding", desc: "Register your college/university. Manual verification required.", actions: [{ label: "Onboarding Form", href: "/forms/institution-onboarding", primary: true }, { label: "For Institutions", href: "/for-institutions" }],
    features: ["Submit onboarding form with official institutional email", "Institution name, type (University/College/Bootcamp/Coaching)", "Website, location, total students, departments", "Contact person: name, designation, email, phone", "Placement details: current rate, top recruiters", "Admin reviews → creates INSTITUTION account", "Account activated after email domain verification"],
    testChecklist: ["Fill /forms/institution-onboarding → submit", "Check admin panel → form should appear", "Admin creates account → login credentials generated", "Login with credentials → institution dashboard loads"] },

  { id: "login", num: "02", title: "Login & Dashboard", desc: "Access your institution dashboard to manage students.", actions: [{ label: "Login", href: "/auth/login?role=INSTITUTION", primary: true }, { label: "Dashboard", href: "/institution-dashboard" }],
    features: ["Select 'Institution' tab on login page", "Redirected to /institution-dashboard", "'Institution' link in header navbar", "Overview: total students, active apps, placed, partner companies", "Quick actions: Add Student, My Students, Companies, Analytics", "Placement pipeline (Applied → Screened → Interview → Offer → Placed)"],
    testChecklist: ["Login as INSTITUTION → dashboard loads", "Header shows 'Institution' nav link", "Overview stats visible"] },

  { id: "add-student", num: "03", title: "Add Students", desc: "Create student accounts linked to your institution.", actions: [{ label: "Add Student", href: "/institution-dashboard", primary: true }],
    features: ["Add Student form: name, email, degree, graduation year", "Auto-generated temp password (shown once)", "Student profile auto-linked to your institution via institutionId", "College name auto-filled from your institution name", "Student gets profile number (SM26XXXXXX)", "Student receives account creation notification"],
    testChecklist: ["Go to Add Student tab → fill name + email", "Click Create → temp password shown", "Student logs in with temp password → change password", "Student dashboard loads with college name pre-filled", "My Students tab → new student appears in list"] },

  { id: "students", num: "04", title: "Manage Students", desc: "View, search, and manage your enrolled students.", actions: [{ label: "My Students", href: "/institution-dashboard", primary: true }],
    features: ["List all students with name, email, profile score, domain", "Application count per student", "Search by name or email", "View Profile → opens student's public profile", "Remove student (deletes their account)", "Students are scoped — you only see yours, not others"],
    testChecklist: ["My Students tab → list shows your students", "Search works by name and email", "Click 'View' → student profile opens", "Remove a student → they disappear from list"] },

  { id: "companies", num: "05", title: "Browse Companies", desc: "See all companies on SkillMap and connect.", actions: [{ label: "Companies", href: "/institution-dashboard", primary: true }],
    features: ["List of all registered companies on platform", "Shows HR count and job post count per company", "Search companies by name", "Connect button (placeholder for future integration)"],
    testChecklist: ["Companies tab → shows registered organisations", "Search filters companies", "HR and job counts visible"] },

  { id: "analytics", num: "06", title: "Analytics", desc: "Track placement rates and student performance.", actions: [{ label: "Analytics", href: "/institution-dashboard", primary: true }],
    features: ["Enrolled students count", "Placement rate (placeholder)", "Average profile score (placeholder)", "Domain distribution chart (placeholder)", "Placement trend (placeholder)", "Top hiring companies (placeholder)"],
    testChecklist: ["Analytics tab → enrolled count shows correct number", "Chart placeholders visible"] },

  { id: "settings", num: "07", title: "Settings", desc: "Manage institution profile and notifications.", actions: [{ label: "Settings", href: "/institution-dashboard", primary: true }],
    features: ["Institution profile with verified badge", "Notification preferences: student applications, placements, weekly report", "Profile editing coming soon (contact support)"],
    testChecklist: ["Settings tab → institution name and badge visible", "Notification toggles work"] },
];

export default function InstitutionGuidePage() {
  const [openStep, setOpenStep] = useState<string | null>("onboard");
  return (
    <div className="min-h-[calc(100vh-4rem)]" style={{ background: "var(--surface)" }}>
      <section className="py-12 px-4 md:px-8" style={{ background: "var(--ink)" }}>
        <div className="max-w-4xl mx-auto">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-xs font-bold tracking-[0.1em] uppercase ${heading}`} style={{ background: "rgba(168,85,247,0.1)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.2)" }}>🏫 Institution Guide</div>
          <h1 className={`${heading} font-bold text-3xl md:text-4xl text-white mb-3`}>Institution Guide</h1>
          <p className="text-base" style={{ color: "rgba(255,255,255,0.5)" }}>Step-by-step guide for colleges, universities, and training institutes — manage students and track placements.</p>
        </div>
      </section>
      <section className="py-8 px-4 md:px-8"><div className="max-w-4xl mx-auto space-y-4">
        {steps.map((step) => { const isOpen = openStep === step.id; return (
          <div key={step.id} className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: isOpen ? "var(--ink)" : "var(--border)" }}>
            <button onClick={() => setOpenStep(isOpen ? null : step.id)} className="w-full flex items-center gap-4 p-5 text-left">
              <span className={`${heading} text-3xl font-bold shrink-0`} style={{ color: isOpen ? "#a855f7" : "var(--border)", background: isOpen ? "var(--ink)" : "transparent", padding: isOpen ? "4px 12px" : "0", borderRadius: "12px" }}>{step.num}</span>
              <div className="flex-1"><h3 className={`${heading} font-bold text-base`}>{step.title}</h3><p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{step.desc}</p></div>
              <svg className={`w-5 h-5 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "var(--muted)" }}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {isOpen && (
              <div className="px-5 pb-5 border-t pt-4" style={{ borderColor: "var(--border)" }}>
                <div className="flex gap-2 flex-wrap mb-5">{step.actions.map((a) => (<Link key={a.href} href={a.href} target="_blank" className={`px-4 py-2 rounded-xl ${heading} font-bold text-xs no-underline`} style={{ background: a.primary ? "var(--ink)" : "white", color: a.primary ? "#a855f7" : "var(--ink)", border: a.primary ? "none" : "1px solid var(--border)" }}>{a.label} ↗</Link>))}</div>
                <div className="mb-5"><h4 className={`${heading} font-bold text-sm mb-2`}>Features:</h4><div className="space-y-1.5">{step.features.map((f, i) => (<div key={i} className="flex gap-2 text-sm"><span style={{ color: "#a855f7", background: "var(--ink)", width: "18px", height: "18px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, flexShrink: 0, marginTop: "2px" }}>✓</span><span style={{ color: "var(--muted)" }}>{f}</span></div>))}</div></div>
                <div className="rounded-xl p-4 border" style={{ borderColor: "rgba(168,85,247,0.2)", background: "rgba(168,85,247,0.03)" }}><h4 className={`${heading} font-bold text-sm mb-2`}>🧪 Test:</h4><div className="space-y-1.5">{step.testChecklist.map((t, i) => (<label key={i} className="flex gap-2 text-sm cursor-pointer items-start"><input type="checkbox" className="mt-1 accent-[var(--ink)]" /><span style={{ color: "var(--muted)" }}>{t}</span></label>))}</div></div>
              </div>
            )}
          </div>
        ); })}
      </div></section>
    </div>
  );
}
