"use client";
import Link from "next/link";
import { useState } from "react";
const heading = "font-[family-name:var(--font-heading)]";

const steps = [
  { id: "login", num: "01", title: "Login as HR", desc: "HR accounts are created by your company admin — no self-signup.", actions: [{ label: "Login", href: "/auth/login?role=HR", primary: true }],
    features: ["Select 'HR' tab on login page", "Use email + temporary password provided by company admin", "First login → prompted to change password", "Redirected to /hr-dashboard after login"],
    testChecklist: ["Select HR tab → enter credentials → login", "If first time → change password page should appear", "After login → HR Dashboard should load", "Header should show 'HR Panel' nav link + HR badge"] },

  { id: "overview", num: "02", title: "HR Dashboard Overview", desc: "See your hiring stats and pipeline at a glance.", actions: [{ label: "HR Dashboard", href: "/hr-dashboard", primary: true }],
    features: ["Applications Received — real count from DB", "Active Job Posts — your posted jobs count", "Candidates Shortlisted — sum of screening+interview+assessment+offer", "Hiring Pipeline — 7-stage live counts (Applied → Hired/Rejected)", "Quick Actions — Create job, Search, View applications"],
    testChecklist: ["Dashboard loads → stats cards show real numbers", "Pipeline shows correct stage counts", "Click a stat card → navigates to relevant tab"] },

  { id: "create-job", num: "03", title: "Create Job Opening", desc: "Post a new job with all details. It goes live immediately.", actions: [{ label: "Create Job", href: "/hr-dashboard", primary: true }],
    features: ["Title, location, work mode (On-site/Remote/Hybrid)", "Salary range (LPA), experience level (Fresher to 30 years)", "Urgency, job type (Full-time/Part-time/Contract/Internship)", "Domain, department, required skills", "Attach Lab Assessment — select from published MCQ templates", "Job description, perks, deadline, number of openings", "Company name auto-filled from your profile"],
    testChecklist: ["Go to Create Job tab → fill all fields", "Select a lab if available → note the lab info", "Click 'Post Job Opening' → success message", "Go to My Job Posts → new job should appear", "Visit /jobs → your job should be visible"] },

  { id: "my-posts", num: "04", title: "Manage Job Posts", desc: "View, close, reopen, or delete your job listings.", actions: [{ label: "My Job Posts", href: "/hr-dashboard", primary: true }],
    features: ["List of all your posted jobs with application count", "Status badge (Active/Closed)", "Close/Reopen toggle button", "View → opens job detail page", "Delete with confirmation", "Application count updates in real-time"],
    testChecklist: ["My Job Posts tab → your jobs should appear", "Click Close → status changes to CLOSED", "Click Reopen → status changes to ACTIVE", "Delete a job → removed from list"] },

  { id: "applications", num: "05", title: "Review Applications", desc: "See who applied, their skill match, and manage their status.", actions: [{ label: "Applications", href: "/hr-dashboard", primary: true }],
    features: ["All applications with candidate name, job, score match %", "Score color: green (90%+), yellow (70-89%), orange (50-69%), red (<50%)", "Status filter tabs: All, Applied, Screening, Interview, etc.", "Inline status dropdown — change from Applied → Interview → Offer", "View Profile button → opens candidate profile in new tab", "Profile shows resume (view/download), skills, experience, certifications"],
    testChecklist: ["Applications tab → shows received applications", "Score match % visible for each candidate", "Change status → dropdown works → status updates", "Click 'View Profile ↗' → profile opens in new tab", "Candidate should see status change notification"] },

  { id: "search", num: "06", title: "Search Candidates", desc: "Find candidates by name, email, skills, college, or domain.", actions: [{ label: "Search", href: "/hr-dashboard", primary: true }],
    features: ["Search bar: name, email, skills, college, company", "Filter by domain and experience level", "Results show profile score, skills, experience badge", "View button → candidate profile in new tab"],
    testChecklist: ["Type a skill (e.g. 'Python') → click Search", "Results should show matching candidates", "Filter by domain → results narrow", "Click View → profile page opens"] },

  { id: "jd-match", num: "07", title: "AI JD Matching", desc: "Paste a job description — AI finds the best matching candidates.", actions: [{ label: "AI JD Match", href: "/hr-dashboard", primary: true }],
    features: ["Paste full job description text", "Claude AI analyzes JD vs all candidates in DB", "Returns top 10 matches with AI Match % and reason", "Select multiple candidates with checkboxes", "Select all / deselect all toggle", "Bulk invite: pick a job, add message, send invites", "Fallback to keyword matching if AI unavailable"],
    testChecklist: ["Go to AI JD Match tab → paste a job description", "Click 'Find matching candidates' → AI processes", "Results show with match %, reason, skills", "Select candidates → invite panel appears at bottom", "Pick a job, add message → click Send", "Check Invite tab → sent invites should appear"] },

  { id: "invite", num: "08", title: "Sent Invitations", desc: "Track invites sent to candidates.", actions: [{ label: "Invites", href: "/hr-dashboard", primary: true }],
    features: ["List of all sent invites with status badges", "Status: Sent, Viewed, Accepted, Declined, Expired", "Candidate name, email, job title, date", "Message preview"],
    testChecklist: ["Invite tab → shows sent invitations", "Status badges visible for each"] },

  { id: "hackathon", num: "09", title: "Create Hackathon / Quiz", desc: "Design hiring challenges with optional lab assessments.", actions: [{ label: "Hackathon", href: "/hr-dashboard", primary: true }],
    features: ["Toggle between Hackathon and Quiz creation", "Title, domain, dates, max participants, difficulty", "Prize/reward, duration", "Attach Lab Assessment (MCQ) if available", "Description with rules and criteria"],
    testChecklist: ["Toggle between Hackathon and Quiz", "Fill form fields → lab selector should show published labs", "Create button works (currently placeholder save)"] },

  { id: "connect", num: "10", title: "Connect with Candidates", desc: "View profiles and contact candidates directly.", actions: [{ label: "Search", href: "/hr-dashboard", primary: false }],
    features: ["On candidate profile: 'Connect now' button (HR/Admin only)", "Click → reveals email (mailto) and phone (tel)", "Profile view tracked in DB", "Admin can see how many profiles each HR viewed"],
    testChecklist: ["Visit a student profile → 'Connect now' card visible", "Click → email and phone revealed", "Links should be clickable (mailto/tel)"] },
];

export default function HRGuidePage() {
  const [openStep, setOpenStep] = useState<string | null>("login");
  return (
    <div className="min-h-[calc(100vh-4rem)]" style={{ background: "var(--surface)" }}>
      <section className="py-12 px-4 md:px-8" style={{ background: "var(--ink)" }}>
        <div className="max-w-4xl mx-auto">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-xs font-bold tracking-[0.1em] uppercase ${heading}`} style={{ background: "rgba(6,182,212,0.1)", color: "#06b6d4", border: "1px solid rgba(6,182,212,0.2)" }}>👥 HR Guide</div>
          <h1 className={`${heading} font-bold text-3xl md:text-4xl text-white mb-3`}>HR / Recruiter Guide</h1>
          <p className="text-base" style={{ color: "rgba(255,255,255,0.5)" }}>Step-by-step walkthrough for HR users. Note: HR accounts are created by company admins — no self-signup.</p>
        </div>
      </section>
      <section className="py-8 px-4 md:px-8"><div className="max-w-4xl mx-auto space-y-4">
        {steps.map((step) => { const isOpen = openStep === step.id; return (
          <div key={step.id} className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: isOpen ? "var(--ink)" : "var(--border)" }}>
            <button onClick={() => setOpenStep(isOpen ? null : step.id)} className="w-full flex items-center gap-4 p-5 text-left">
              <span className={`${heading} text-3xl font-bold shrink-0`} style={{ color: isOpen ? "#06b6d4" : "var(--border)", background: isOpen ? "var(--ink)" : "transparent", padding: isOpen ? "4px 12px" : "0", borderRadius: "12px" }}>{step.num}</span>
              <div className="flex-1"><h3 className={`${heading} font-bold text-base`}>{step.title}</h3><p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{step.desc}</p></div>
              <svg className={`w-5 h-5 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "var(--muted)" }}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {isOpen && (
              <div className="px-5 pb-5 border-t pt-4" style={{ borderColor: "var(--border)" }}>
                <div className="flex gap-2 flex-wrap mb-5">{step.actions.map((a) => (<Link key={a.href} href={a.href} target="_blank" className={`px-4 py-2 rounded-xl ${heading} font-bold text-xs no-underline`} style={{ background: a.primary ? "var(--ink)" : "white", color: a.primary ? "#06b6d4" : "var(--ink)", border: a.primary ? "none" : "1px solid var(--border)" }}>{a.label} ↗</Link>))}</div>
                <div className="mb-5"><h4 className={`${heading} font-bold text-sm mb-2`}>Features:</h4><div className="space-y-1.5">{step.features.map((f, i) => (<div key={i} className="flex gap-2 text-sm"><span style={{ color: "#06b6d4", background: "var(--ink)", width: "18px", height: "18px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, flexShrink: 0, marginTop: "2px" }}>✓</span><span style={{ color: "var(--muted)" }}>{f}</span></div>))}</div></div>
                <div className="rounded-xl p-4 border" style={{ borderColor: "rgba(6,182,212,0.2)", background: "rgba(6,182,212,0.03)" }}><h4 className={`${heading} font-bold text-sm mb-2`}>🧪 Test:</h4><div className="space-y-1.5">{step.testChecklist.map((t, i) => (<label key={i} className="flex gap-2 text-sm cursor-pointer items-start"><input type="checkbox" className="mt-1 accent-[var(--ink)]" /><span style={{ color: "var(--muted)" }}>{t}</span></label>))}</div></div>
              </div>
            )}
          </div>
        ); })}
      </div></section>
    </div>
  );
}
