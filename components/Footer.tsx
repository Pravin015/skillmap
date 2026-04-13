"use client";

import Link from "next/link";

const syne = "font-[family-name:var(--font-syne)]";

const footerLinks = [
  {
    title: "Platform",
    links: [
      { href: "/jobs", label: "Jobs" },
      { href: "/competitions", label: "Competitions" },
      { href: "/events", label: "Events" },
      { href: "/blog", label: "Blog" },
      { href: "/companies", label: "Companies" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  {
    title: "Prepare",
    links: [
      { href: "/chat", label: "AI Advisor" },
      { href: "/mock-interview", label: "Mock Interviews" },
      { href: "/offer-verify", label: "Verify Offer Letter" },
      { href: "/dashboard", label: "Dashboard" },
    ],
  },
  {
    title: "For You",
    links: [
      { href: "/for-companies", label: "For Companies" },
      { href: "/for-mentors", label: "For Mentors" },
      { href: "/for-institutions", label: "For Institutions" },
      { href: "/forms/hire-from-us", label: "Hire From Us" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
      { href: "/refund-policy", label: "Refund Policy" },
      { href: "/shipping-policy", label: "Shipping Policy" },
    ],
  },
];

export default function Footer() {
  return (
    <footer style={{ background: "var(--ink)" }}>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className={`${syne} text-lg font-extrabold text-white no-underline flex items-center gap-2 mb-3`}>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold" style={{ background: "var(--primary)", color: "white" }}>S</span>
              SkillMap
            </Link>
            <p className="text-xs leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>
              India&apos;s job-readiness platform. AI-powered career guidance for fresh graduates.
            </p>
            <a href="mailto:support@ashpranix.in" className="text-xs no-underline" style={{ color: "var(--primary)" }}>
              support@ashpranix.in
            </a>
          </div>

          {/* Link columns */}
          {footerLinks.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
                {col.title}
              </h4>
              <ul className="space-y-2 list-none p-0 m-0">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-xs no-underline transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.6)" }}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>&copy; 2026 SkillMap. Built for India&apos;s next generation.</p>
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>Payments secured by Razorpay</p>
        </div>
      </div>
    </footer>
  );
}
