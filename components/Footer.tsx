"use client";
import Link from "next/link";

const cols = [
  { title: "Company", links: [
    { href: "/about", label: "About us" },
    { href: "/companies", label: "Customers" },
    { href: "/blog", label: "Press" },
    { href: "/forms?type=careers", label: "Careers" },
  ]},
  { title: "Platform", links: [
    { href: "/jobs", label: "Jobs" },
    { href: "/jobs/external", label: "Live Openings" },
    { href: "/courses", label: "Courses" },
    { href: "/mock-interview", label: "Mock Interviews" },
    { href: "/offer-verify", label: "Verify Offer" },
  ]},
  { title: "Resources", links: [
    { href: "/blog", label: "Blog" },
    { href: "/events", label: "Events" },
    { href: "/competitions", label: "Competitions" },
    { href: "/labs", label: "Labs" },
  ]},
  { title: "Legal", links: [
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
    { href: "/refund-policy", label: "Refunds" },
    { href: "/shipping-policy", label: "Shipping" },
  ]},
];

export default function Footer() {
  return (
    <footer style={{ background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
      <div className="mx-auto max-w-6xl px-4 pt-12 pb-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3 no-underline">
              <span className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-semibold text-xs" style={{ background: "var(--primary)" }}>A</span>
              <span className="font-semibold text-sm" style={{ color: "var(--ink)" }}>AstraaHire</span>
            </Link>
            <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
              India&apos;s AI-powered career intelligence platform — built for the next generation.
            </p>
            <a href="mailto:support@astraahire.com" className="block mt-3 text-xs no-underline" style={{ color: "var(--primary)" }}>
              support@astraahire.com
            </a>
          </div>

          {/* Link columns */}
          {cols.map((col) => (
            <div key={col.title}>
              <h4 className="text-[11px] font-semibold mb-3" style={{ color: "var(--muted-2)", letterSpacing: "0.04em" }}>{col.title}</h4>
              <ul className="space-y-2 m-0 p-0">
                {col.links.map((link) => (
                  <li key={link.href} className="list-none">
                    <Link href={link.href} className="text-xs no-underline transition-colors" style={{ color: "var(--ink-soft)" }}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom strip */}
        <div className="pt-5 border-t flex flex-col sm:flex-row items-center justify-between gap-2" style={{ borderColor: "var(--border)" }}>
          <p className="text-[11px]" style={{ color: "var(--muted)" }}>&copy; 2026 AstraaHire. Built for India&apos;s next generation.</p>
          <p className="text-[11px]" style={{ color: "var(--muted)" }}>Payments secured by Razorpay</p>
        </div>
      </div>
    </footer>
  );
}
