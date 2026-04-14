"use client";
import Link from "next/link";
import { useState } from "react";
const heading = "font-[family-name:var(--font-heading)]";

const steps = [
  { id: "onboard", num: "01", title: "Become a Mentor", desc: "Submit onboarding form or get added by admin.", actions: [{ label: "Mentor Onboarding", href: "/forms/mentor-onboarding", primary: true }, { label: "For Mentors Page", href: "/for-mentors" }],
    features: ["Submit mentor onboarding form with official company email (no Gmail/Yahoo)", "Specify: company, role, experience, domain, compensation (Paid/Volunteer)", "Admin reviews form → creates MENTOR account (auto-verified)", "Or admin manually adds you from Admin Panel → Add User → MENTOR", "You receive temp password → change on first login"],
    testChecklist: ["Fill /forms/mentor-onboarding → submit → success message", "Admin panel → Forms → mentor onboarding should appear", "Admin clicks 'Create Account' → mentor account created", "Login with credentials → change password → mentor dashboard"] },

  { id: "login", num: "02", title: "Login & Dashboard", desc: "Access your mentor dashboard to manage sessions and events.", actions: [{ label: "Login as Mentor", href: "/auth/login?role=MENTOR", primary: true }, { label: "Mentor Dashboard", href: "/mentor-dashboard" }],
    features: ["Select 'Mentor' tab on login page", "First login → change password page", "Redirected to /mentor-dashboard", "'Mentor Panel' link visible in header navbar", "Overview: pending requests, upcoming sessions, completed, events count"],
    testChecklist: ["Login with MENTOR role → correct dashboard loads", "Header shows 'Mentor Panel' link with amber badge", "Overview stats show real numbers"] },

  { id: "edit-profile", num: "03", title: "Set Up Your Profile", desc: "Configure your rates, expertise, and availability.", actions: [{ label: "Edit Profile", href: "/profile/edit", primary: true }, { label: "Account Settings", href: "/settings" }],
    features: ["Headline (e.g. 'Senior Cybersecurity Analyst at TCS')", "Current company and role", "Years of experience, college", "Areas of expertise (comma separated tags)", "Topics I can help with", "Compensation: Paid or Volunteer", "1-on-1 rate (₹ per session) — if paid", "Group session rate — if paid", "Weekly availability", "LinkedIn URL", "Profile photo with crop tool", "Bio text"],
    testChecklist: ["Visit /profile/edit → mentor-specific fields visible", "Fill company, role, experience, expertise", "Set compensation to PAID → rate fields appear", "Enter 1-on-1 rate (e.g. 500) and group rate (e.g. 300)", "Click Save → page scrolls to top with green confirmation", "Visit your public mentor profile → rates should show", "Schedule Call button should show 'Pay ₹500 & Request'"] },

  { id: "sessions", num: "04", title: "Manage Session Requests", desc: "Accept, decline, or complete mentorship sessions.", actions: [{ label: "Sessions Tab", href: "/mentor-dashboard", primary: true }],
    features: ["See all session requests from students", "Each request: student name, type (1-on-1/Group), date, price, message", "Accept → paste Zoom/Meet link → student gets notification with link", "Decline → with optional reason → student notified", "Mark Complete → your stats update (sessions +1, mentees +1)", "Student can rate you 1-5 stars after completion", "Average rating auto-calculated and shown on profile", "Time slot conflict prevention — no double booking"],
    testChecklist: ["Student books a session from your profile page", "Sessions tab → new request appears as REQUESTED", "Enter Zoom link → click Accept → status changes", "Student dashboard → My Mentorship → session shows ACCEPTED with Join link", "After meeting → click Mark Complete", "Student rates → your avg rating updates"] },

  { id: "events", num: "05", title: "Create & Manage Events", desc: "Host career guidance sessions, workshops, and webinars.", actions: [{ label: "Create Event", href: "/events/create", primary: true }, { label: "My Events", href: "/mentor-dashboard" }],
    features: ["Create event: title, description, agenda, benefits", "Date/time, duration, event type (Virtual/Physical/Hybrid)", "Pricing: Free or Paid (with price in ₹)", "Capacity: min and max participants", "Zoom/Meet link (hidden for paid events until payment)", "Cover image upload with preview", "Auto-approved if you're verified, pending if not", "Attendees popup: see who registered, paid/unpaid, remove button", "Students get notified when you create events"],
    testChecklist: ["Create an event → should auto-approve (verified mentor)", "Event appears in /events listing", "Student registers → count updates", "Click 'Attendees' button → popup shows attendee table", "Remove a participant → they're removed from list"] },

  { id: "public-profile", num: "06", title: "Your Public Profile", desc: "Students see this page when browsing mentors.", actions: [{ label: "View Mentors", href: "/for-mentors" }],
    features: ["Header: photo, name, verified badge, company, pricing", "Stats: years exp, mentees helped, sessions, rating, companies count", "Schedule Call CTA with 1-on-1 and group pricing", "Bio, current role, college, expertise tags, topics", "Companies worked with", "Achievements with images", "LinkedIn link"],
    testChecklist: ["Visit /mentor/[your-number] → profile loads", "Photo visible (if uploaded)", "Pricing shows correct rates", "'Schedule Call' opens booking form with correct prices"] },

  { id: "earnings", num: "07", title: "Earnings & Payments", desc: "Track payments for paid sessions and events.", actions: [{ label: "Pricing Page", href: "/for-mentors#earning" }],
    features: ["Paid sessions: students pay via Razorpay before booking", "Payment ID stored with each session record", "Revenue visible per session in dashboard", "Volunteer sessions: no payment required", "Event revenue: paid event registrations tracked"],
    testChecklist: ["Set rates in profile → student books paid session", "Razorpay checkout should open for student", "After payment → session created with paymentId", "Session shows as paid in your dashboard"] },
];

export default function MentorGuidePage() {
  const [openStep, setOpenStep] = useState<string | null>("onboard");
  return (
    <div className="min-h-[calc(100vh-4rem)]" style={{ background: "var(--surface)" }}>
      <section className="py-12 px-4 md:px-8" style={{ background: "var(--ink)" }}>
        <div className="max-w-4xl mx-auto">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-xs font-bold tracking-[0.1em] uppercase ${heading}`} style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>🧑‍🏫 Mentor Guide</div>
          <h1 className={`${heading} font-bold text-3xl md:text-4xl text-white mb-3`}>Mentor Guide</h1>
          <p className="text-base" style={{ color: "rgba(255,255,255,0.5)" }}>Step-by-step guide for mentors — set up your profile, manage sessions, create events, and earn.</p>
        </div>
      </section>
      <section className="py-8 px-4 md:px-8"><div className="max-w-4xl mx-auto space-y-4">
        {steps.map((step) => { const isOpen = openStep === step.id; return (
          <div key={step.id} className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: isOpen ? "var(--ink)" : "var(--border)" }}>
            <button onClick={() => setOpenStep(isOpen ? null : step.id)} className="w-full flex items-center gap-4 p-5 text-left">
              <span className={`${heading} text-3xl font-bold shrink-0`} style={{ color: isOpen ? "#f59e0b" : "var(--border)", background: isOpen ? "var(--ink)" : "transparent", padding: isOpen ? "4px 12px" : "0", borderRadius: "12px" }}>{step.num}</span>
              <div className="flex-1"><h3 className={`${heading} font-bold text-base`}>{step.title}</h3><p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{step.desc}</p></div>
              <svg className={`w-5 h-5 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "var(--muted)" }}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {isOpen && (
              <div className="px-5 pb-5 border-t pt-4" style={{ borderColor: "var(--border)" }}>
                <div className="flex gap-2 flex-wrap mb-5">{step.actions.map((a) => (<Link key={a.href} href={a.href} target="_blank" className={`px-4 py-2 rounded-xl ${heading} font-bold text-xs no-underline`} style={{ background: a.primary ? "var(--ink)" : "white", color: a.primary ? "#f59e0b" : "var(--ink)", border: a.primary ? "none" : "1px solid var(--border)" }}>{a.label} ↗</Link>))}</div>
                <div className="mb-5"><h4 className={`${heading} font-bold text-sm mb-2`}>Features:</h4><div className="space-y-1.5">{step.features.map((f, i) => (<div key={i} className="flex gap-2 text-sm"><span style={{ color: "#f59e0b", background: "var(--ink)", width: "18px", height: "18px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, flexShrink: 0, marginTop: "2px" }}>✓</span><span style={{ color: "var(--muted)" }}>{f}</span></div>))}</div></div>
                <div className="rounded-xl p-4 border" style={{ borderColor: "rgba(245,158,11,0.2)", background: "rgba(245,158,11,0.03)" }}><h4 className={`${heading} font-bold text-sm mb-2`}>🧪 Test:</h4><div className="space-y-1.5">{step.testChecklist.map((t, i) => (<label key={i} className="flex gap-2 text-sm cursor-pointer items-start"><input type="checkbox" className="mt-1 accent-[var(--ink)]" /><span style={{ color: "var(--muted)" }}>{t}</span></label>))}</div></div>
              </div>
            )}
          </div>
        ); })}
      </div></section>
    </div>
  );
}
