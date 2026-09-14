import Link from "next/link";
import { Building2, Mail, MessageSquare, ShieldCheck } from "lucide-react";
import { pageMeta, organizationLd } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";
import { ButtonLink, Card } from "@/components/ui";

export const metadata = pageMeta({ title: "Contact CorpGurus", description: "Talk to the CorpGurus team about hiring corporate trainers, onboarding a training partner, API integration, billing or a grievance. Based in Bengaluru, India.", path: "/contact" });

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <JsonLd data={{ ...organizationLd(), contactPoint: [{ "@type": "ContactPoint", contactType: "customer support", email: "hello@corpgurus.com", areaServed: "IN", availableLanguage: ["English", "Hindi"] }] }} />
      <p className="mono text-[12px] uppercase tracking-[0.12em] text-cyan">Contact</p>
      <h1 className="mt-2 text-[34px] font-bold leading-tight md:text-[48px]">Need help? <span className="serif text-cyan">Get in touch.</span></h1>
      <p className="mt-3 max-w-2xl text-muted">We reply within one working day. For anything about an ongoing engagement, message the other party from the requirement page first; CorpGurus staff can see the thread if you escalate.</p>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <Card className="p-6"><Mail size={20} className="text-cyan" /><h2 className="mt-3 text-lg font-bold">General and support</h2><p className="mt-1 text-sm text-muted">Account, billing, verification, refunds, or anything else.</p><a href="mailto:hello@corpgurus.com" className="mt-3 inline-block font-semibold text-cyan hover:underline">hello@corpgurus.com</a></Card>
        <Card className="p-6"><Building2 size={20} className="text-violet" /><h2 className="mt-3 text-lg font-bold">Training partners and enterprises</h2><p className="mt-1 text-sm text-muted">Bulk empanelment, API and webhook integration, custom plans for staffing dozens of batches a quarter.</p><a href="mailto:partners@corpgurus.com" className="mt-3 inline-block font-semibold text-violet hover:underline">partners@corpgurus.com</a></Card>
        <Card className="p-6"><ShieldCheck size={20} className="text-amber" /><h2 className="mt-3 text-lg font-bold">Grievance officer</h2><p className="mt-1 text-sm text-muted">Data protection and content complaints under the IT Rules, 2021 and the DPDP Act, 2023. Acknowledged within 24 hours, resolved within 15 days.</p><a href="mailto:grievance@corpgurus.com" className="mt-3 inline-block font-semibold text-amber hover:underline">grievance@corpgurus.com</a></Card>
        <Card className="p-6"><MessageSquare size={20} className="text-lime" /><h2 className="mt-3 text-lg font-bold">Report content</h2><p className="mt-1 text-sm text-muted">Use the Report button on any profile, requirement, post or comment. Reports go to the moderation queue and you are notified of the outcome.</p><Link href="/requirements" className="mt-3 inline-block font-semibold text-lime hover:underline">Browse requirements →</Link></Card>
      </div>
      <div className="mt-8 rounded-[28px] bg-navy p-8 text-white md:flex md:items-center md:justify-between">
        <div><p className="font-display text-xl font-bold">CorpGurus</p><p className="mt-1 text-sm text-white/65">Bengaluru, Karnataka, India · Monday to Friday, 9:30 to 18:30 IST</p><p className="mt-2 text-sm text-white/65"><Link href="/legal/terms" className="hover:text-white">Terms</Link> · <Link href="/legal/privacy" className="hover:text-white">Privacy</Link> · <Link href="/legal/refunds" className="hover:text-white">Refunds</Link></p></div>
        <div className="mt-4 flex gap-2 md:mt-0"><ButtonLink href="/signup?as=company">Post a requirement</ButtonLink><ButtonLink href="/signup" variant="secondary">Join as a trainer</ButtonLink></div>
      </div>
    </div>
  );
}
