// /for-companies — pitch page for HR/Org accounts. Prakae light theme.
import PageHero from "@/components/page/PageHero";
import Section from "@/components/page/Section";
import ValueCard from "@/components/page/ValueCard";
import DarkCTA from "@/components/page/DarkCTA";

const Icon = {
  target: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>),
  shield: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>),
  bolt: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>),
  trophy: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 010-5H6" /><path d="M18 9h1.5a2.5 2.5 0 000-5H18" /><path d="M4 22h16" /><path d="M18 2H6v7a6 6 0 0012 0V2z" /></svg>),
};

const features = [
  { icon: Icon.target, title: "AI candidate matching", body: "Skill-match scoring against your exact JD. See top fits in 30 seconds — no scrolling through 1,000 resumes." },
  { icon: Icon.shield, title: "Proctored assessments", body: "Fullscreen enforcement, tab-switch detection, webcam verification — included free on every job posting." },
  { icon: Icon.bolt, title: "Hackathon hiring", body: "Run coding contests or case challenges. Hire from leaderboard. Pre-vetted, demonstrated skill." },
  { icon: Icon.trophy, title: "Offer letter signing", body: "Generate, sign, and send offers with verified e-signature. Tracks acceptance, integrates with your HRMS." },
];

const stats = [
  { n: "10M+", label: "Graduates entering market", desc: "Every year in India" },
  { n: "55%", label: "Are underprepared", desc: "Industry consensus from 2024 surveys" },
  { n: "₹0", label: "To register", desc: "No setup fee, no minimum commitment" },
];

const testimonials = [
  { quote: "Cut our screening time from 8 days to 2. We hire 3× the candidates with the same recruiter team.", name: "Rashmi K.", role: "Head of Talent, fintech (Series C)" },
  { quote: "The proctored labs catch what resumes hide. Our offer-acceptance rate climbed from 64 → 89%.", name: "Vikram S.", role: "Engineering Manager, SaaS startup" },
];

export default function ForCompaniesPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--surface)" }}>
      <PageHero
        eyebrow="For companies & HR teams"
        title={<>Hire job-ready talent.<br />Not just resumes.</>}
        subtitle="AI-powered candidate matching, proctored assessments, and hiring challenges — all in one platform. Find candidates who can actually do the job."
        ctas={[
          { label: "Register your company — free", href: "/auth/signup?role=ORG", variant: "primary" },
          { label: "Talk to sales", href: "/contact", variant: "outline" },
        ]}
      />

      {/* Stats */}
      <Section className="!pt-4 !pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-3xl mx-auto">
          {stats.map((s) => (
            <div key={s.label} className="card-soft text-center">
              <p className="text-3xl font-semibold mb-1" style={{ color: "var(--ink)" }}>{s.n}</p>
              <p className="text-xs font-semibold mb-1" style={{ color: "var(--ink)" }}>{s.label}</p>
              <p className="text-[10px]" style={{ color: "var(--muted)" }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Features */}
      <Section
        eyebrow="What you get"
        title="End-to-end hiring"
        subtitle="From job post to offer letter — one platform, one team, one workflow."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {features.map((f) => <ValueCard key={f.title} {...f} />)}
        </div>
      </Section>

      {/* Testimonials */}
      <Section
        eyebrow="Trusted by hiring teams"
        title="What recruiters say"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {testimonials.map((t) => (
            <div key={t.name} className="card-soft">
              <div className="flex gap-0.5 mb-3" style={{ color: "#F59E0B" }}>
                {"★★★★★".split("").map((s, i) => <span key={i}>{s}</span>)}
              </div>
              <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--ink-soft)" }}>&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white" style={{ background: "var(--primary)" }}>{t.name[0]}</span>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--ink)" }}>{t.name}</p>
                  <p className="text-[11px]" style={{ color: "var(--muted)" }}>{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <DarkCTA
        title={<>Ready to hire smarter?</>}
        body="Free to register. Pay only for premium features when you're ready."
        primaryCta={{ label: "Register your company", href: "/auth/signup?role=ORG" }}
        secondaryCta={{ label: "Book a demo", href: "/contact" }}
      />
    </div>
  );
}
