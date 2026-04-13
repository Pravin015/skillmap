"use client";
import Link from "next/link";
const heading = "font-[family-name:var(--font-heading)]";

const cols = [
  { title: "PLATFORM", links: [{ href: "/jobs", label: "Jobs" }, { href: "/competitions", label: "Competitions" }, { href: "/events", label: "Events" }, { href: "/blog", label: "Blog" }, { href: "/companies", label: "Companies" }, { href: "/pricing", label: "Pricing" }] },
  { title: "PREPARE", links: [{ href: "/chat", label: "AI Advisor" }, { href: "/mock-interview", label: "Mock Interviews" }, { href: "/offer-verify", label: "Verify Offer Letter" }, { href: "/dashboard", label: "Dashboard" }] },
  { title: "FOR YOU", links: [{ href: "/for-companies", label: "For Companies" }, { href: "/for-mentors", label: "For Mentors" }, { href: "/for-institutions", label: "For Institutions" }, { href: "/forms/hire-from-us", label: "Hire From Us" }] },
  { title: "LEGAL", links: [{ href: "/privacy", label: "Privacy Policy" }, { href: "/terms", label: "Terms of Service" }, { href: "/refund-policy", label: "Refund Policy" }, { href: "/shipping-policy", label: "Shipping Policy" }] },
];

export default function Footer() {
  return (
    <footer style={{ background: "#060F0F", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="mx-auto max-w-6xl px-4" style={{ paddingTop: "4rem", paddingBottom: "2rem" }}>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className={`${heading} text-lg font-bold text-white no-underline flex items-center gap-2 mb-3`}>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold" style={{ background: "#0ABFBC", color: "#fff" }}>S</span>
              SkillMap
            </Link>
            <p style={{ color: "#4A6363", fontSize: "0.875rem", lineHeight: 1.7, marginTop: "0.75rem" }}>
              India&apos;s job-readiness platform. AI-powered career guidance for fresh graduates.
            </p>
            <a href="mailto:support@ashpranix.in" className="block mt-4 no-underline" style={{ color: "#0ABFBC", fontSize: "0.85rem" }}>
              support@ashpranix.in
            </a>
          </div>
          {/* Link columns */}
          {cols.map((col) => (
            <div key={col.title}>
              <h4 className={heading} style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.1em", color: "#8FA8A8", textTransform: "uppercase" as const, marginBottom: "1rem" }}>{col.title}</h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {col.links.map((link) => (
                  <li key={link.href} style={{ lineHeight: 2.2 }}>
                    <Link href={link.href} className="no-underline transition-colors hover:text-white" style={{ color: "#4A6363", fontSize: "0.875rem" }}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {/* Divider */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "2rem 0" }} />
        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p style={{ color: "#4A6363", fontSize: "0.8rem" }}>&copy; 2026 SkillMap. Built for India&apos;s next generation.</p>
          <p style={{ color: "#4A6363", fontSize: "0.8rem" }}>Payments secured by Razorpay</p>
        </div>
      </div>
    </footer>
  );
}
