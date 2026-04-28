// /about — AstraaHire about page following Prakae structure:
// hero · story+stats · values grid · team · dark CTA
import PageHero from "@/components/page/PageHero";
import Section from "@/components/page/Section";
import ValueCard from "@/components/page/ValueCard";
import DarkCTA from "@/components/page/DarkCTA";

const Icon = {
  shield: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>),
  users: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>),
  globe: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>),
  spark: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15 9 22 12 15 15 12 22 9 15 2 12 9 9" /></svg>),
};

const stats = [
  { n: "2024", label: "Founded", desc: "From frustration with vague career advice" },
  { n: "50+", label: "Companies mapped", desc: "Decoded hiring patterns across India" },
  { n: "12k+", label: "Students placed", desc: "Across the platform & partner colleges" },
  { n: "29", label: "States covered", desc: "Tier-1, tier-2, and tier-3 institutions" },
];

const values = [
  { icon: Icon.shield, title: "Clarity over confusion", body: "We tell you exactly what skills each company wants — no vague advice, no filler content. Specifics or nothing." },
  { icon: Icon.users, title: "Operator-led", body: "Every product decision is reviewed by working HRs, recruiters, and recent hires. We build with the people who use it." },
  { icon: Icon.globe, title: "Open by default", body: "Free tier available to everyone. Premium at ₹299/month — less than a pizza. Career help shouldn't be a luxury." },
  { icon: Icon.spark, title: "Move fast, safely", body: "Ship daily without breaking student journeys. 4-eyes review on every change to mock interviews and offer-verification flows." },
];

const team = [
  { name: "Pravin Singh", role: "Founder & CEO", bio: "Ex-product engineer. 7 years building AI tools for hiring teams." },
  { name: "Priya Sharma", role: "Head of Product", bio: "Previously at Razorpay. Led the student onboarding redesign." },
  { name: "Arjun Mehta", role: "Head of Engineering", bio: "Distributed-systems engineer. Previously at a major SIEM." },
  { name: "Sneha Joshi", role: "Head of Mentor Network", bio: "Built mentor partnerships across 15+ Fortune-500 companies in India." },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--surface)" }}>
      <PageHero
        eyebrow="About"
        title={<>Built by hirers,<br />for the next generation</>}
        subtitle="AstraaHire exists to make career intelligence visible, actionable, and continuously assured — across job-matching, prep, mentorship, and offer verification."
        ctas={[{ label: "Talk to our team", href: "/forms?type=contact", variant: "primary" }]}
      />

      {/* ───────── Story + stats ───────── */}
      <Section align="left" className="!py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          <div>
            <div className="section-eyebrow">Our story</div>
            <h2 className="font-semibold mb-5" style={{ color: "var(--ink)" }}>
              From scattered advice to one clear path
            </h2>
            <div className="space-y-4 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
              <p>
                AstraaHire started in a Tier-2 engineering college, where the team watched
                100+ classmates apply to TCS, Infosys, and Wipro with no idea what those
                companies actually wanted. Some bought ₹50,000 courses. Most got rejected.
                A few got lucky. None had clarity.
              </p>
              <p>
                Three years and 12,000+ student conversations later, we ship one platform
                that covers job matching, company-specific prep, mock interviews, mentor
                sessions, and offer verification — with a single profile, a single prep
                roadmap, and a single dashboard.
              </p>
              <p>
                Our students range from IIT graduates to first-generation learners from
                tier-3 colleges. They share one trait: zero patience for advice that
                doesn&apos;t lead to an offer.
              </p>
            </div>
          </div>

          <div className="rounded-3xl p-6 md:p-7 grid grid-cols-2 gap-6" style={{ background: "linear-gradient(135deg, #EDE9FE 0%, #FBCFE8 60%, #FED7AA 100%)" }}>
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-semibold mb-1" style={{ color: "var(--ink)" }}>{s.n}</p>
                <p className="text-xs font-semibold mb-1" style={{ color: "var(--ink)" }}>{s.label}</p>
                <p className="text-[10px] leading-snug" style={{ color: "var(--ink-soft)" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ───────── Values ───────── */}
      <Section
        eyebrow="Our values"
        title="What we stand for"
        subtitle="The principles that guide our product, hiring, and student relationships."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {values.map((v) => <ValueCard key={v.title} {...v} />)}
        </div>
      </Section>

      {/* ───────── Team ───────── */}
      <Section
        eyebrow="Leadership"
        title="The team"
        subtitle="Operators who lived the problem before they built the product."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {team.map((m) => (
            <div key={m.name} className="card-soft text-center">
              <div className="w-20 h-20 rounded-full mx-auto mb-4" style={{ background: "linear-gradient(135deg, #C084FC, #F0ABFC)" }} />
              <p className="font-semibold text-sm mb-0.5" style={{ color: "var(--ink)" }}>{m.name}</p>
              <p className="text-xs mb-3" style={{ color: "var(--primary)" }}>{m.role}</p>
              <p className="text-[11px] leading-relaxed" style={{ color: "var(--muted)" }}>{m.bio}</p>
            </div>
          ))}
        </div>
      </Section>

      <DarkCTA
        eyebrow="Join us"
        title={<>Help us build the next decade of<br />Indian careers</>}
        body="We're hiring across engineering, product, and mentor success."
        primaryCta={{ label: "See open roles", href: "/forms?type=careers" }}
        secondaryCta={{ label: "Contact sales", href: "/forms?type=contact" }}
      />
    </div>
  );
}
