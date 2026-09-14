import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeCheck, FileSpreadsheet, Plus, ShieldCheck } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { companyFinish, companyStep1, companyStep2, companyStep3, companyStep4 } from "@/lib/actions/onboarding";
import { ActionForm } from "@/components/form-bits";
import { Wizard, WizardNav } from "@/components/wizard";
import { TrainerCard } from "@/components/cards";
import { Avatar, Badge, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { COMPANY_SIZES } from "@/lib/utils";

export const metadata = { title: "Set up your company", robots: { index: false } };

const STEPS = ["Basics", "Verification", "Hiring profile", "Team", "First requirement"];
const BASE = "/onboarding/company";
const INDUSTRIES = ["IT Services", "BFSI", "Manufacturing", "Pharma & Healthcare", "Telecom", "Retail & E-commerce", "Education & Training", "Consulting", "Government & PSU", "Other"];

export default async function CompanyOnboarding({ searchParams }: { searchParams: Promise<{ step?: string }> }) {
  const user = await requireUser(BASE);
  if (!user.membership) redirect(user.trainerProfile ? "/onboarding/trainer" : "/dashboard");
  const sp = await searchParams;
  const step = Math.min(5, Math.max(1, Number(sp.step) || user.onboardingStep || 1));
  const c = await db.company.findUnique({ where: { id: user.membership.company.id }, include: { members: { include: { user: { select: { name: true, email: true, avatarUrl: true } } } }, _count: { select: { requirements: true } } } });
  if (!c) redirect("/dashboard");
  const preview = (
    <Card className="p-4">
      <p className="mono mb-2 text-[11px] uppercase tracking-wider text-muted">How trainers see you</p>
      <div className="flex items-center gap-3"><Avatar name={c.name} src={c.logoUrl} size={48} tone="violet" className="rounded-xl" /><div className="min-w-0"><p className="flex items-center gap-1 font-display font-semibold">{c.name}{c.domainVerifiedAt ? <BadgeCheck size={14} className="text-violet" /> : null}</p><p className="truncate text-xs text-muted">{[c.industry, c.size, c.type === "TRAINING_PARTNER" ? "Training partner" : null].filter(Boolean).join(" · ") || "Add basics"}</p></div></div>
      <p className="mt-3 line-clamp-4 text-sm text-muted">{c.description || "A short description tells trainers who they will be working with."}</p>
    </Card>
  );

  if (step === 1) {
    return (
      <Wizard base={BASE} steps={STEPS} current={1} title={<>Welcome, {user.name.split(" ")[0]}. <span className="serif text-violet">Set up {c.name}.</span></>} body="Five short steps. Trainers check the company page before they apply, so a logo and a paragraph go a long way." aside={preview}>
        <ActionForm action={companyStep1} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Company name"><Input name="name" defaultValue={c.name} required /></Field>
            <Field label="Account type" hint="Training partners staff batches for other companies and post without limits on the Partner plan."><Select name="type" defaultValue={c.type}><option value="DIRECT">Company hiring for its own teams</option><option value="TRAINING_PARTNER">Training partner / agency</option></Select></Field>
            <Field label="Industry"><Select name="industry" defaultValue={c.industry || ""}><option value="">Choose…</option>{INDUSTRIES.map((i) => <option key={i}>{i}</option>)}</Select></Field>
            <Field label="Company size"><Select name="size" defaultValue={c.size || ""}><option value="">Choose…</option>{COMPANY_SIZES.map((s) => <option key={s}>{s}</option>)}</Select></Field>
            <Field label="Website" hint="Used to verify your email domain in the next step."><Input name="website" defaultValue={c.website ?? ""} placeholder="https://www.company.com" /></Field>
            <Field label="Logo" hint="Square PNG or SVG works best."><Input name="logo" type="file" accept="image/*" className="file:mr-3 file:rounded-full file:border-0 file:bg-surface-2 file:px-3 file:py-1 file:text-xs" /></Field>
          </div>
          <Field label="About the company" hint="What you do, the teams you train, and how you work with trainers."><Textarea name="description" defaultValue={c.description} className="min-h-28" /></Field>
          <WizardNav submitLabel="Continue" />
        </ActionForm>
      </Wizard>
    );
  }

  if (step === 2) {
    const emailDomain = user.email.split("@")[1];
    return (
      <Wizard base={BASE} steps={STEPS} current={2} title={<>Earn the <span className="serif text-violet">verified badge.</span></>} body="Verified companies get more and better applications. The domain check runs automatically when your work email matches your website." aside={<>{preview}<Card className="p-4"><p className="flex items-center gap-2 font-display text-sm font-semibold"><ShieldCheck size={15} className="text-violet" /> Domain check</p><p className="mt-1 text-sm text-muted">Your email domain: <span className="mono text-ink">{emailDomain}</span><br />Website: <span className="mono text-ink">{c.website ? new URL(c.website).hostname : "not set"}</span></p><p className="mt-2 text-xs text-muted">{c.domainVerifiedAt ? "Already verified." : "If they match, the badge is granted when you continue. Otherwise an administrator reviews it."}</p></Card></>}>
        <ActionForm action={companyStep2} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="GSTIN" hint="15 characters. Appears on trainer invoices and unlocks the GST-verified badge after review."><Input name="gstin" defaultValue={c.gstin ?? ""} placeholder="29ABCDE1234F1Z5" maxLength={15} className="uppercase" /></Field>
            <Field label="Billing address" hint="Printed on invoices and work orders."><Textarea name="billingAddress" defaultValue={c.billingAddress ?? ""} className="min-h-20" placeholder="Floor 4, Prestige Tech Park, Bengaluru 560103" /></Field>
          </div>
          <WizardNav back={`${BASE}?step=1`} skip={`${BASE}?step=3`} />
        </ActionForm>
      </Wizard>
    );
  }

  if (step === 3) {
    const categories = await db.category.findMany({ orderBy: { name: "asc" }, select: { slug: true, name: true, _count: { select: { skills: true } } } });
    return (
      <Wizard base={BASE} steps={STEPS} current={3} title={<>What do you <span className="serif text-violet">hire for?</span></>} body="This seeds your trainer alerts and the suggestions on your dashboard. Change it any time in Settings." aside={preview}>
        <ActionForm action={companyStep3} className="space-y-6">
          <div><p className="text-sm font-medium">Domains you hire trainers for</p><div className="mt-2 grid gap-2 sm:grid-cols-2 md:grid-cols-3">{categories.map((cat) => <label key={cat.slug} className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-sm has-[:checked]:border-violet has-[:checked]:bg-violet/5"><input type="checkbox" name="categories" value={cat.slug} defaultChecked={c.hiringCategories.includes(cat.slug)} className="accent-violet" /><span className="flex-1">{cat.name}</span><span className="text-xs text-muted">{cat._count.skills} skills</span></label>)}</div></div>
          <Field label="Cities where batches usually run" hint="Comma-separated. Leave empty if mostly virtual."><Input name="cities" defaultValue={c.hiringCities.join(", ")} placeholder="Bengaluru, Pune" /></Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Batches per quarter"><Select name="batchesPerQuarter" defaultValue={c.batchesPerQuarter ?? ""}><option value="">Choose…</option>{["1–2", "3–5", "6–12", "13+"].map((b) => <option key={b}>{b}</option>)}</Select></Field>
            <Field label="Typical day-rate budget (INR)"><Select name="budgetBand" defaultValue={c.budgetBand ?? ""}><option value="">Choose…</option>{["Under 15,000", "15,000–30,000", "30,000–50,000", "50,000+"].map((b) => <option key={b}>{b}</option>)}</Select></Field>
          </div>
          <WizardNav back={`${BASE}?step=2`} skip={`${BASE}?step=4`} />
        </ActionForm>
      </Wizard>
    );
  }

  if (step === 4) {
    const isOwner = user.membership.role === "OWNER";
    return (
      <Wizard base={BASE} steps={STEPS} current={4} title={<>Bring your <span className="serif text-violet">team.</span></>} body="Recruiters can post and shortlist; owners also manage billing, the team and API keys. Invitees get a temporary password to share securely." aside={<>{preview}<Card className="p-4"><p className="mono text-[11px] uppercase tracking-wider text-muted">Current team</p><ul className="mt-2 space-y-2">{c.members.map((m) => <li key={m.id} className="flex items-center gap-2 text-sm"><Avatar name={m.user.name} src={m.user.avatarUrl} size={26} tone="violet" /><span className="min-w-0 flex-1 truncate">{m.user.name}</span><Badge tone={m.role === "OWNER" ? "violet" : "neutral"}>{m.role.toLowerCase()}</Badge></li>)}</ul></Card></>}>
        <ActionForm action={companyStep4} className="space-y-4" resetOnSuccess>
          {!isOwner ? <p className="rounded-xl border border-amber/30 bg-amber/5 px-4 py-3 text-sm text-amber">Only the company owner can add members. You can skip this step.</p> : null}
          {[1, 2, 3].map((i) => (
            <div key={i} className="grid gap-3 rounded-xl border border-line bg-white p-3 md:grid-cols-[1fr_1.3fr_150px]">
              <Field label="Name"><Input name={`name${i}`} placeholder="Priya Sharma" disabled={!isOwner} /></Field>
              <Field label="Work email"><Input name={`email${i}`} type="email" placeholder="priya@company.com" disabled={!isOwner} /></Field>
              <Field label="Role"><Select name={`role${i}`} defaultValue="RECRUITER" disabled={!isOwner}><option value="RECRUITER">Recruiter</option><option value="OWNER">Owner</option></Select></Field>
            </div>
          ))}
          <WizardNav back={`${BASE}?step=3`} skip={`${BASE}?step=5`} submitLabel={isOwner ? "Add team and continue" : "Continue"} />
        </ActionForm>
      </Wizard>
    );
  }

  // Step 5: first requirement.
  const suggested = c.hiringCategories.length ? await db.trainerProfile.findMany({ where: { user: { status: "ACTIVE" }, skills: { some: { category: { slug: { in: c.hiringCategories } } } }, ...(c.hiringCities.length ? { OR: [{ cities: { hasSome: c.hiringCities } }, { deliveryModes: { has: "VIRTUAL" } }] } : {}) }, include: { user: { select: { name: true, avatarUrl: true } }, skills: true }, orderBy: [{ verifiedAt: { sort: "desc", nulls: "last" } }, { yearsExperience: "desc" }], take: 4 }) : [];
  return (
    <Wizard base={BASE} steps={STEPS} current={5} title={<>Post your <span className="serif text-violet">first requirement.</span></>} body="A requirement with dates, mode, participants and budget gets applications within hours. Or import several at once from a spreadsheet." aside={preview}>
      <form action={companyFinish} className="grid gap-4 md:grid-cols-3">
        <button name="next" value="post" className="rounded-[24px] border-2 border-violet bg-violet/5 p-6 text-left transition hover:bg-violet/10"><Plus size={22} className="text-violet" /><p className="mt-3 font-display text-lg font-bold">Post a requirement</p><p className="mt-1 text-sm text-muted">Guided form. Matching trainers are notified the moment you publish.</p></button>
        <button name="next" value="import" className="rounded-[24px] border border-line bg-white p-6 text-left transition hover:border-violet"><FileSpreadsheet size={22} className="text-violet" /><p className="mt-3 font-display text-lg font-bold">Import from CSV</p><p className="mt-1 text-sm text-muted">Upload a training calendar; we create one requirement per row.</p></button>
        <button name="next" value="later" className="rounded-[24px] border border-line bg-white p-6 text-left transition hover:border-violet"><p className="font-display text-lg font-bold">Browse first</p><p className="mt-1 text-sm text-muted">Go to the dashboard, look at trainers and post later. {c._count.requirements ? `You already have ${c._count.requirements} requirement${c._count.requirements === 1 ? "" : "s"}.` : ""}</p></button>
      </form>
      {suggested.length ? <div className="mt-8"><h2 className="text-lg font-bold">Trainers who fit your hiring profile</h2><p className="text-sm text-muted">Based on the domains{c.hiringCities.length ? " and cities" : ""} you chose. Save them to your bench from their profiles.</p><div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{suggested.map((t) => <TrainerCard key={t.id} t={t} showRate />)}</div></div> : null}
      <p className="mt-6 text-sm text-muted"><Link href={`${BASE}?step=4`} className="hover:text-ink">← Back</Link></p>
    </Wizard>
  );
}
