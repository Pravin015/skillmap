// /for-institutions — pitch page for colleges & universities. Prakae light theme.
import PageHero from "@/components/page/PageHero";
import Section from "@/components/page/Section";
import ValueCard from "@/components/page/ValueCard";
import DarkCTA from "@/components/page/DarkCTA";

const Icon = {
  graduation: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>),
  chart: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></svg>),
  shield: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>),
  spark: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15 9 22 12 15 15 12 22 9 15 2 12 9 9" /></svg>),
};

const features = [
  { icon: Icon.graduation, title: "Bulk student onboarding", body: "Upload your full batch in one CSV. Auto-create accounts, assign skill assessments, and track placement progress in one dashboard." },
  { icon: Icon.chart, title: "Placement analytics", body: "Live placement % by department, top employers, average package, skill gaps. Export to PDF for NAAC/NIRF audits." },
  { icon: Icon.shield, title: "Proctored exams", body: "Run college-level placement screening with fullscreen + webcam proctoring. NIRF-grade exam integrity, included free." },
  { icon: Icon.spark, title: "Employer connect", body: "Your students appear in our employer search filtered by your college. Pre-vetted candidates flow straight to your placement cell." },
];

export default function ForInstitutionsPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--surface)" }}>
      <PageHero
        eyebrow="For colleges & institutions"
        title={<>Place every student.<br />Track every outcome.</>}
        subtitle="A modern placement cell platform. Bulk-onboard your batch, run proctored assessments, and connect students to verified employers — all from one dashboard."
        ctas={[
          { label: "Partner with us", href: "/forms/institution-onboarding", variant: "primary" },
          { label: "Book a demo", href: "/contact", variant: "outline" },
        ]}
      />

      <Section
        eyebrow="What's included"
        title="Built for placement cells"
        subtitle="Everything T&P offices wish they had — without the IT migration."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {features.map((f) => <ValueCard key={f.title} {...f} />)}
        </div>
      </Section>

      <Section eyebrow="Outcomes" title="What partner colleges report">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {[
            { n: "+38%", label: "Placement rate uplift", desc: "Year-over-year average across 14 partner colleges" },
            { n: "−65%", label: "Coordinator hours", desc: "Saved per placement season vs spreadsheets" },
            { n: "12 days", label: "Avg time-to-onboard", desc: "Full batch in our platform, ready to apply" },
          ].map((s) => (
            <div key={s.label} className="card-soft text-center">
              <p className="text-3xl font-semibold mb-1" style={{ color: "var(--primary)" }}>{s.n}</p>
              <p className="text-xs font-semibold mb-1" style={{ color: "var(--ink)" }}>{s.label}</p>
              <p className="text-[10px]" style={{ color: "var(--muted)" }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <DarkCTA
        title={<>Ready to modernise your placement cell?</>}
        body="Partner pricing for tier-1, tier-2, and tier-3 institutions — talk to us about your batch size."
        primaryCta={{ label: "Partner with us", href: "/forms/institution-onboarding" }}
        secondaryCta={{ label: "Book a demo", href: "/contact" }}
      />
    </div>
  );
}
