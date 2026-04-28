"use client";

import Link from "next/link";
import { useState } from "react";

const heading = "font-[family-name:var(--font-heading)]";

interface Step {
  id: string;
  num: string;
  title: string;
  desc: string;
  actions: { label: string; href: string; primary?: boolean }[];
  features: string[];
  testChecklist: string[];
}

const steps: Step[] = [
  {
    id: "signup",
    num: "01",
    title: "Sign Up & Verify Email",
    desc: "Create your AstraaHire account with email OTP verification.",
    actions: [
      { label: "Sign Up", href: "/auth/signup?role=STUDENT", primary: true },
    ],
    features: [
      "Enter name, email, phone (mandatory), password",
      "6-digit OTP sent to your email via Resend",
      "Enter OTP to verify → green 'Email verified' badge",
      "Click 'Create account' to proceed to Step 2",
    ],
    testChecklist: [
      "Fill all fields → click 'Send verification code'",
      "Check email for OTP (check spam if not in inbox)",
      "Enter OTP → click 'Verify & continue'",
      "Click 'Create account' → should proceed to profile creation",
    ],
  },
  {
    id: "profile",
    num: "02",
    title: "Complete Your Profile",
    desc: "Fill in your academic details, skills, and upload a profile photo. This is Step 2 of signup.",
    actions: [
      { label: "Edit Profile", href: "/profile/edit", primary: true },
      { label: "Account Settings", href: "/settings" },
    ],
    features: [
      "Upload profile photo with crop/zoom adjustment",
      "College name, degree, graduation year",
      "Experience level (Fresher/Experienced)",
      "Field of interest (determines job recommendations)",
      "Skills (comma separated — used for job matching)",
      "Bio, LinkedIn, GitHub links",
      "Academic score (CGPA/Percentage)",
      "Salary expectations and availability",
      "Work experience (if experienced)",
      "Certifications with issuer and date",
    ],
    testChecklist: [
      "Upload a photo → crop modal should open → adjust → save",
      "Fill all required fields → click 'Save Profile'",
      "Page should scroll to top with green 'Profile saved!' message",
      "Check /profile/[your-ID] to see public profile",
      "Profile Score on dashboard should update based on completeness",
    ],
  },
  {
    id: "dashboard",
    num: "03",
    title: "Your Dashboard",
    desc: "The central hub for all your career activities.",
    actions: [
      { label: "Go to Dashboard", href: "/dashboard", primary: true },
    ],
    features: [
      "AI Mentor card — link to AI career advisor chat",
      "Profile Score — circular ring showing completeness (0-100)",
      "Real Mentors — verified mentors from top companies with 'Book' button",
      "Current Openings — jobs matching your domain + dream companies",
      "Companies Applied — real-time status tracking (Applied → Interview → Offer)",
      "Profile Views — count of HR/recruiters who viewed your profile",
      "My Mentorship — booked sessions with join link and rating",
      "Upcoming Events — next 3 events with register link",
      "Recommended Courses — domain-specific courses (YouTube, Coursera, etc.)",
      "Labs & Interview Prep — coming soon preview",
    ],
    testChecklist: [
      "Dashboard loads without errors",
      "Profile Score shows real percentage based on your profile",
      "Events section shows upcoming events (or empty state)",
      "Courses section shows courses for your domain",
      "Mentor list shows verified mentors (or empty state)",
    ],
  },
  {
    id: "jobs",
    num: "04",
    title: "Browse & Apply for Jobs",
    desc: "Find jobs that match your skills and apply with one click.",
    actions: [
      { label: "Browse Jobs", href: "/jobs", primary: true },
    ],
    features: [
      "Jobs auto-filtered by your domain interest",
      "Filter by: domain, work mode, experience, salary, location",
      "'filtered by your interest: [domain]' indicator shown",
      "Click any job → full detail page with description, skills, salary",
      "Apply Now → cover note form → auto skill-match score calculated",
      "If job has lab attached → redirected to timed MCQ assessment",
      "Lab: 10 MCQs, countdown timer, auto-submit on expiry",
      "Application tracked in dashboard with live status updates",
      "Share button copies job URL",
      "AI Prep Plan link for interview preparation",
    ],
    testChecklist: [
      "Visit /jobs → should auto-filter to your domain",
      "Change filter to 'All' → should show all jobs",
      "Click a job → detail page loads with all info",
      "Click 'Apply Now' → enter cover note → submit",
      "If lab required → start lab → answer MCQs → submit",
      "Check dashboard → application should appear in 'Applied' section",
      "HR should see your application with score match %",
    ],
  },
  {
    id: "ai-chat",
    num: "05",
    title: "AI Career Advisor",
    desc: "Get personalised career guidance from AI that knows your profile.",
    actions: [
      { label: "Chat with AI", href: "/chat", primary: true },
    ],
    features: [
      "AI knows your profile, domain, skills, dream companies",
      "Ask about career paths, skill gaps, interview prep",
      "Get week-by-week preparation roadmaps",
      "Free resource recommendations (YouTube, Coursera, etc.)",
      "Honest timelines for becoming job-ready",
      "Quick prompts: 'What should I focus on first?', etc.",
      "Streaming responses powered by Claude AI",
    ],
    testChecklist: [
      "Visit /chat → quick prompts should be visible",
      "Click a quick prompt → AI should stream a response",
      "Type a custom question → AI should respond with context",
      "Response should reference your actual domain/companies",
    ],
  },
  {
    id: "mentors",
    num: "06",
    title: "Book Mentor Sessions",
    desc: "Connect 1-on-1 or in groups with verified industry professionals.",
    actions: [
      { label: "Browse Mentors", href: "/for-mentors" },
    ],
    features: [
      "View verified mentor profiles with company, experience, rating",
      "Book 1-on-1 or group sessions",
      "Free mentors → direct request",
      "Paid mentors → Razorpay payment → then request",
      "Time slot conflict prevention (no double-booking)",
      "Mentor accepts → you get notification with join link",
      "After session → rate 1-5 stars + write review",
      "All sessions visible in Dashboard → My Mentorship tab",
    ],
    testChecklist: [
      "Visit a mentor profile page",
      "Click 'Schedule Call' → booking form opens",
      "Select date/time, session type, message → submit",
      "If paid → Razorpay should open → complete payment",
      "Check Dashboard → My Mentorship → session should appear as 'REQUESTED'",
      "Mentor accepts → status changes to 'ACCEPTED' + join link visible",
    ],
  },
  {
    id: "events",
    num: "07",
    title: "Join Events",
    desc: "Attend career guidance sessions, workshops, and webinars.",
    actions: [
      { label: "Browse Events", href: "/events", primary: true },
    ],
    features: [
      "Browse upcoming events with cover images",
      "Filter: All / Free / Paid",
      "Event detail: agenda, benefits, date/time, capacity, host profile",
      "Free events → instant registration + join link revealed",
      "Paid events → Razorpay payment → join link after payment",
      "Spots remaining counter",
      "Events show in dashboard widget",
    ],
    testChecklist: [
      "Visit /events → events should load (or empty state)",
      "Click an event → detail page with full info",
      "Click 'Join for free' (or pay) → should register",
      "Join link should be visible after registration",
      "Check dashboard → Events section should update",
    ],
  },
  {
    id: "notifications",
    num: "08",
    title: "Notifications & Email Alerts",
    desc: "Stay updated on applications, invites, and opportunities.",
    actions: [
      { label: "View Notifications", href: "/notifications", primary: true },
    ],
    features: [
      "Bell icon in header with unread count badge",
      "Click bell → dropdown with latest 8 notifications",
      "'Mark all read' button",
      "Full /notifications page with all history",
      "Email notifications for: application status, invites, events, etc.",
      "Click notification to mark as read",
    ],
    testChecklist: [
      "Bell icon visible in header",
      "Apply for a job → notification should appear",
      "HR changes your application status → notification + email",
      "Visit /notifications → full list should load",
    ],
  },
  {
    id: "settings",
    num: "09",
    title: "Account Settings",
    desc: "Manage your profile, photo, password, and contact info.",
    actions: [
      { label: "Settings", href: "/settings", primary: true },
    ],
    features: [
      "Upload/change profile photo with crop tool",
      "Edit name and phone",
      "Email shown (read-only, contact support to change)",
      "Change password (requires current password)",
      "Accessible from header dropdown → 'Account Settings'",
    ],
    testChecklist: [
      "Visit /settings → your info should load",
      "Upload a new photo → cropper opens → save",
      "Change name → save → green confirmation",
      "Change password → enter current + new → save",
    ],
  },
  {
    id: "companies",
    num: "10",
    title: "Browse Companies",
    desc: "Explore company skill maps, domains, and interview processes.",
    actions: [
      { label: "Browse Companies", href: "/companies", primary: true },
    ],
    features: [
      "Grid of 50+ mapped companies",
      "Click to expand → see all domains, skills, interview process",
      "Fresher-friendly badge",
      "Average salary package per role",
      "Skill pills showing required competencies",
    ],
    testChecklist: [
      "Visit /companies → company cards should load",
      "Click a company → accordion expands with domain details",
      "Skills, interview process, and salary visible",
    ],
  },
];

export default function StudentGuidePage() {
  const [openStep, setOpenStep] = useState<string | null>("signup");

  return (
    <div className="min-h-[calc(100vh-4rem)]" style={{ background: "var(--surface)" }}>
      {/* Header */}
      <section className="py-12 px-4 md:px-8" style={{ background: "var(--ink)" }}>
        <div className="max-w-4xl mx-auto">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-xs font-bold tracking-[0.1em] uppercase ${heading}`} style={{ background: "var(--primary-light)", color: "var(--primary)", border: "1px solid rgba(124,58,237,0.2)" }}>
            🎓 Student Guide
          </div>
          <h1 className={`${heading} font-bold text-3xl md:text-4xl text-white mb-3`}>Student Onboarding Guide</h1>
          <p className="text-base" style={{ color: "rgba(255,255,255,0.5)" }}>Step-by-step walkthrough of everything you can do on AstraaHire. Follow along to test each feature.</p>
        </div>
      </section>

      {/* Steps */}
      <section className="py-8 px-4 md:px-8">
        <div className="max-w-4xl mx-auto space-y-4">
          {steps.map((step) => {
            const isOpen = openStep === step.id;
            return (
              <div key={step.id} className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: isOpen ? "var(--ink)" : "var(--border)" }}>
                <button onClick={() => setOpenStep(isOpen ? null : step.id)} className="w-full flex items-center gap-4 p-5 text-left">
                  <span className={`${heading} text-3xl font-bold shrink-0`} style={{ color: isOpen ? "var(--primary)" : "var(--border)", background: isOpen ? "var(--ink)" : "transparent", padding: isOpen ? "4px 12px" : "0", borderRadius: "12px" }}>{step.num}</span>
                  <div className="flex-1">
                    <h3 className={`${heading} font-bold text-base`} style={{ color: "var(--ink)" }}>{step.title}</h3>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{step.desc}</p>
                  </div>
                  <svg className={`w-5 h-5 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "var(--muted)" }}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 border-t pt-4" style={{ borderColor: "var(--border)" }}>
                    {/* Action buttons */}
                    <div className="flex gap-2 flex-wrap mb-5">
                      {step.actions.map((a) => (
                        <Link key={a.href} href={a.href} target="_blank" className={`px-4 py-2 rounded-xl ${heading} font-bold text-xs no-underline transition-transform hover:-translate-y-0.5`} style={{ background: a.primary ? "var(--ink)" : "white", color: a.primary ? "var(--primary)" : "var(--ink)", border: a.primary ? "none" : "1px solid var(--border)" }}>
                          {a.label} ↗
                        </Link>
                      ))}
                    </div>

                    {/* Features */}
                    <div className="mb-5">
                      <h4 className={`${heading} font-bold text-sm mb-2`}>What you can do:</h4>
                      <div className="space-y-1.5">
                        {step.features.map((f, i) => (
                          <div key={i} className="flex gap-2 text-sm">
                            <span style={{ color: "var(--primary)", background: "var(--ink)", width: "18px", height: "18px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, flexShrink: 0, marginTop: "2px" }}>✓</span>
                            <span style={{ color: "var(--muted)" }}>{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Test checklist */}
                    <div className="rounded-xl p-4 border" style={{ borderColor: "rgba(124,58,237,0.2)", background: "rgba(124,58,237,0.03)" }}>
                      <h4 className={`${heading} font-bold text-sm mb-2`}>🧪 Test checklist:</h4>
                      <div className="space-y-1.5">
                        {step.testChecklist.map((t, i) => (
                          <label key={i} className="flex gap-2 text-sm cursor-pointer items-start">
                            <input type="checkbox" className="mt-1 accent-[var(--ink)]" />
                            <span style={{ color: "var(--muted)" }}>{t}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Quick links */}
      <section className="py-8 px-4 md:px-8 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-4xl mx-auto">
          <h2 className={`${heading} font-bold text-lg mb-4`}>Quick Links</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Sign Up", href: "/auth/signup?role=STUDENT", icon: "📝" },
              { label: "Login", href: "/auth/login", icon: "🔑" },
              { label: "Dashboard", href: "/dashboard", icon: "📊" },
              { label: "Jobs", href: "/jobs", icon: "💼" },
              { label: "Events", href: "/events", icon: "🎤" },
              { label: "AI Chat", href: "/chat", icon: "✦" },
              { label: "Companies", href: "/companies", icon: "🏢" },
              { label: "Settings", href: "/settings", icon: "⚙️" },
              { label: "Notifications", href: "/notifications", icon: "🔔" },
              { label: "Profile Edit", href: "/profile/edit", icon: "👤" },
              { label: "Pricing", href: "/pricing", icon: "💳" },
              { label: "Contact Us", href: "/forms/contact", icon: "✉️" },
            ].map((l) => (
              <Link key={l.href} href={l.href} target="_blank" className="flex items-center gap-2 p-3 rounded-xl border no-underline transition-all hover:-translate-y-0.5 hover:shadow-md" style={{ borderColor: "var(--border)", color: "var(--ink)" }}>
                <span className="text-lg">{l.icon}</span>
                <span className={`${heading} font-bold text-xs`}>{l.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
