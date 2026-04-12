import Link from "next/link";

const syne = "font-[family-name:var(--font-syne)]";

export default function Footer() {
  return (
    <footer className="py-12 px-6 md:px-12" style={{ background: "var(--ink)", color: "rgba(255,255,255,0.4)" }}>
      <div className="max-w-[1100px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between gap-10 mb-10">
          {/* Brand */}
          <div className="md:max-w-[250px]">
            <Link href="/" className={`${syne} font-extrabold text-lg text-white no-underline`}>
              Skill<span style={{ color: "var(--accent)" }}>Map</span>
            </Link>
            <p className="text-xs leading-relaxed mt-2">
              India&apos;s first job-readiness engine. Know what it takes to get hired at your dream company.
            </p>
            <p className="text-xs mt-3">
              <strong style={{ color: "rgba(255,255,255,0.6)" }}>Email:</strong>{" "}
              <a href="mailto:support@ashpranix.in" className="no-underline hover:text-white transition-colors" style={{ color: "var(--accent)" }}>
                support@ashpranix.in
              </a>
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-sm">
            <div>
              <div className={`${syne} font-bold text-xs text-white uppercase tracking-wider mb-3`}>Platform</div>
              <div className="flex flex-col gap-2">
                <Link href="/jobs" className="no-underline transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.4)" }}>Jobs</Link>
                <Link href="/companies" className="no-underline transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.4)" }}>Companies</Link>
                <Link href="/pricing" className="no-underline transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.4)" }}>Pricing</Link>
                <Link href="/chat" className="no-underline transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.4)" }}>AI Advisor</Link>
                <Link href="/blog" className="no-underline transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.4)" }}>Blog</Link>
              </div>
            </div>
            <div>
              <div className={`${syne} font-bold text-xs text-white uppercase tracking-wider mb-3`}>For You</div>
              <div className="flex flex-col gap-2">
                <Link href="/for-companies" className="no-underline transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.4)" }}>For Companies</Link>
                <Link href="/for-mentors" className="no-underline transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.4)" }}>For Mentors</Link>
                <Link href="/for-institutions" className="no-underline transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.4)" }}>For Institutions</Link>
                <Link href="/forms/hire-from-us" className="no-underline transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.4)" }}>Hire From Us</Link>
              </div>
            </div>
            <div>
              <div className={`${syne} font-bold text-xs text-white uppercase tracking-wider mb-3`}>Company</div>
              <div className="flex flex-col gap-2">
                <Link href="/about" className="no-underline transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.4)" }}>About Us</Link>
                <Link href="/forms/contact" className="no-underline transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.4)" }}>Contact Us</Link>
                <Link href="/forms/partner" className="no-underline transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.4)" }}>Partner With Us</Link>
              </div>
            </div>
            <div>
              <div className={`${syne} font-bold text-xs text-white uppercase tracking-wider mb-3`}>Legal</div>
              <div className="flex flex-col gap-2">
                <Link href="/privacy" className="no-underline transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.4)" }}>Privacy Policy</Link>
                <Link href="/terms" className="no-underline transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.4)" }}>Terms & Conditions</Link>
                <Link href="/refund-policy" className="no-underline transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.4)" }}>Refund Policy</Link>
                <Link href="/shipping-policy" className="no-underline transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.4)" }}>Shipping Policy</Link>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <span>&copy; 2026 SkillMap. Built for India&apos;s next generation.</span>
          <span>Payments secured by Razorpay</span>
        </div>
      </div>
    </footer>
  );
}
