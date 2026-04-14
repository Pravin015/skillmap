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
              <svg width="24" height="24" viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill="#0ABFBC" fillRule="evenodd" d="M300 100 L495 490 L560 505 L420 530 L300 470 L180 530 L40 505 L105 490 Z M300 220 L205 430 L245 430 L300 335 L355 430 L395 430 Z"/>
              </svg>
              Astr<span style={{ color: "#0ABFBC" }}>aa</span>Hire
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
          <p style={{ color: "#4A6363", fontSize: "0.8rem" }}>&copy; 2026 AstraaHire. Built for India&apos;s next generation.</p>
          <p style={{ color: "#4A6363", fontSize: "0.8rem" }}>Payments secured by Razorpay</p>
        </div>
      </div>
    </footer>
  );
}
