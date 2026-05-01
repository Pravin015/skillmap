// /for-mentors — pitch page for industry mentors. Prakae light theme.
import PageHero from "@/components/page/PageHero";
import Section from "@/components/page/Section";
import ValueCard from "@/components/page/ValueCard";
import DarkCTA from "@/components/page/DarkCTA";

const Icon = {
  cash: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>),
  clock: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>),
  brand: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15 9 22 12 15 15 12 22 9 15 2 12 9 9" /></svg>),
  users: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>),
};

const benefits = [
  { icon: Icon.cash, title: "Earn ₹500 – ₹2,000 per session", body: "You set your rate. Set your availability. Get paid via UPI within 48h of a completed session. We take a flat 15% — no hidden cuts." },
  { icon: Icon.clock, title: "Mentor on your schedule", body: "Block 4 hours a week or 4 hours a month — whatever works. Reschedule anytime. Students see only your open slots." },
  { icon: Icon.brand, title: "Build your personal brand", body: "Verified mentor badge, public profile, and shareable session reviews. Many of our mentors get hired at Fortune-500 companies after going public on AstraaHire." },
  { icon: Icon.users, title: "Help genuine talent", body: "Our mentees are first-gen learners, tier-3 graduates, and women returning to tech. You'll change real lives, not coach influencers." },
];

const steps = [
  { n: "01", title: "Apply", body: "5-minute application. Tell us your experience, target topics, and 3 LinkedIn references." },
  { n: "02", title: "Verify", body: "We verify your employment, run a 20-minute screening call, and review one mock session." },
  { n: "03", title: "Onboard", body: "Set your rate, calendar, and topics. Get a verified profile + first session bookings within a week." },
  { n: "04", title: "Mentor", body: "Run sessions on AstraaHire. Get paid weekly. Track impact in your dashboard." },
];

export default function ForMentorsPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--surface)" }}>
      <PageHero
        eyebrow="For industry mentors"
        title={<>Earn while shaping<br />India&apos;s next generation</>}
        subtitle="Share your hard-won industry experience. Get paid in INR. Help fresh graduates land their first real job — on a platform that filters out tire-kickers."
        ctas={[
          { label: "Apply to mentor", href: "/forms/mentor-onboarding", variant: "primary" },
          { label: "See how it works", href: "#how", variant: "outline" },
        ]}
      />

      <Section eyebrow="Why mentor with us" title="Built for working professionals">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {benefits.map((b) => <ValueCard key={b.title} {...b} />)}
        </div>
      </Section>

      <section id="how" className="px-4 py-16 md:py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="section-eyebrow mx-auto">How it works</div>
            <h2 className="font-semibold" style={{ color: "var(--ink)" }}>From application to first session in 7 days</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {steps.map((s) => (
              <div key={s.n} className="card-soft">
                <p className="text-xs font-semibold mb-3" style={{ color: "var(--primary)" }}>{s.n}</p>
                <h3 className="font-semibold text-base mb-2" style={{ color: "var(--ink)" }}>{s.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Earnings example */}
      <Section eyebrow="Realistic earnings" title="Example mentor — 4 hours / week">
        <div className="card max-w-2xl mx-auto">
          <div className="grid grid-cols-2 gap-y-4 text-sm">
            <span style={{ color: "var(--muted)" }}>Sessions per week (1h each)</span>
            <span className="text-right font-semibold" style={{ color: "var(--ink)" }}>4</span>
            <span style={{ color: "var(--muted)" }}>Rate per session</span>
            <span className="text-right font-semibold" style={{ color: "var(--ink)" }}>₹1,200</span>
            <span style={{ color: "var(--muted)" }}>Gross / week</span>
            <span className="text-right font-semibold" style={{ color: "var(--ink)" }}>₹4,800</span>
            <span style={{ color: "var(--muted)" }}>AstraaHire fee (15%)</span>
            <span className="text-right" style={{ color: "var(--muted)" }}>−₹720</span>
            <span className="font-semibold" style={{ color: "var(--ink)" }}>Take-home / month</span>
            <span className="text-right text-xl font-semibold" style={{ color: "var(--primary)" }}>₹16,320</span>
          </div>
        </div>
      </Section>

      <DarkCTA
        eyebrow="Join 200+ mentors"
        title={<>Ready to share what you know?</>}
        body="Application takes 5 minutes. We get back within 48 hours."
        primaryCta={{ label: "Apply to mentor", href: "/forms/mentor-onboarding" }}
        secondaryCta={{ label: "Contact us", href: "/contact" }}
      />
    </div>
  );
}
