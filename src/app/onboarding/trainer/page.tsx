import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeCheck, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { trainerFinish, trainerStep1, trainerStep2, trainerStep3, trainerStep4 } from "@/lib/actions/onboarding";
import { ActionForm } from "@/components/form-bits";
import { Wizard, WizardNav } from "@/components/wizard";
import { GroupedSkillPicker } from "@/components/grouped-skill-picker";
import { RequirementCard, TrainerCard } from "@/components/cards";
import { Avatar, ButtonLink, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { CURRENCIES, DELIVERY_MODES, LANGUAGES, modeLabel, money } from "@/lib/utils";

export const metadata = { title: "Set up your trainer profile", robots: { index: false } };

const STEPS = ["Identity", "Expertise", "Delivery & rate", "Proof", "Publish"];
const BASE = "/onboarding/trainer";

export default async function TrainerOnboarding({ searchParams }: { searchParams: Promise<{ step?: string }> }) {
  const user = await requireUser(BASE);
  if (!user.trainerProfile) redirect(user.membership ? "/onboarding/company" : "/dashboard");
  const sp = await searchParams;
  const step = Math.min(5, Math.max(1, Number(sp.step) || user.onboardingStep || 1));
  const p = await db.trainerProfile.findUnique({ where: { id: user.trainerProfile.id }, include: { user: { select: { name: true, avatarUrl: true } }, skills: { include: { category: { select: { name: true } } } }, certifications: true, experiences: true, courses: true, availability: { where: { endDate: { gte: new Date() } } } } });
  if (!p) redirect("/dashboard");
  const preview = <Card className="p-4"><p className="mono mb-2 text-[11px] uppercase tracking-wider text-muted">How companies see you</p><TrainerCard t={{ ...p, user: p.user }} showRate /></Card>;

  if (step === 1) {
    return (
      <Wizard base={BASE} steps={STEPS} current={1} title={<>Welcome, {user.name.split(" ")[0]}. <span className="serif text-cyan">Let’s build your profile.</span></>} body="Five short steps. You can skip any of them and come back from the dashboard." aside={preview}>
        <ActionForm action={trainerStep1} className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar name={p.user.name} src={p.user.avatarUrl} size={72} />
            <Field label="Profile photo" hint="A clear headshot gets more shortlists. JPG or PNG, under 5 MB." className="flex-1"><Input name="avatar" type="file" accept="image/*" className="file:mr-3 file:rounded-full file:border-0 file:bg-surface-2 file:px-3 file:py-1 file:text-xs" /></Field>
          </div>
          <Field label="Full name"><Input name="name" defaultValue={p.user.name} required /></Field>
          <Field label="Headline" hint="What you teach and for how long, e.g. “HPE VM Essentials & Morpheus instructor · 12 yrs infra”."><Input name="headline" defaultValue={p.headline} required minLength={8} /></Field>
          <Field label="About you" hint="Who you have trained, what makes your sessions land, anything a company should know."><Textarea name="bio" defaultValue={p.bio} className="min-h-32" placeholder="I run hands-on infrastructure bootcamps for enterprise ops teams…" /></Field>
          <div><p className="text-sm font-medium">Languages you train in</p><div className="mt-2 flex flex-wrap gap-2">{LANGUAGES.map((l) => <label key={l} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-sm has-[:checked]:border-cyan has-[:checked]:bg-cyan/5"><input type="checkbox" name="languages" value={l} defaultChecked={p.languages.includes(l) || (!p.languages.length && l === "English")} className="accent-cyan" />{l}</label>)}</div></div>
          <p className="rounded-xl border border-violet/20 bg-violet/5 px-4 py-3 text-sm">Have a LinkedIn PDF? <Link href="/settings/import" className="font-semibold text-violet hover:underline">Import it</Link> to fill work history and headline automatically, then come back here.</p>
          <WizardNav submitLabel="Continue" />
        </ActionForm>
      </Wizard>
    );
  }

  if (step === 2) {
    const groups = await db.category.findMany({ include: { skills: { select: { slug: true, name: true, vendor: true }, orderBy: { name: "asc" } } }, orderBy: { name: "asc" } });
    return (
      <Wizard base={BASE} steps={STEPS} current={2} title={<>What do you <span className="serif text-cyan">teach?</span></>} body="Skills decide which requirements you are notified about. Certifications are reviewed by staff and earn the verified badge." aside={preview}>
        <ActionForm action={trainerStep2} className="space-y-6">
          <GroupedSkillPicker groups={groups.map((g) => ({ name: g.name, slug: g.slug, skills: g.skills }))} initial={p.skills.map((s) => s.slug)} />
          <Field label="Years of training experience" className="max-w-xs"><Input name="yearsExperience" type="number" min={0} max={50} defaultValue={p.yearsExperience} /></Field>
          <div>
            <p className="text-sm font-medium">Certifications <span className="text-xs text-muted">(up to three now, more later in Settings)</span></p>
            {p.certifications.length ? <p className="mt-1 text-xs text-muted">Already added: {p.certifications.map((c) => c.name).join(", ")}</p> : null}
            <div className="mt-2 space-y-3">{[1, 2, 3].map((i) => (
              <div key={i} className="grid gap-3 rounded-xl border border-line bg-white p-3 md:grid-cols-[1.4fr_1fr_1fr_0.9fr_1.2fr]">
                <Field label={`Certification ${i}`}><Input name={`certName${i}`} placeholder="CKA · Certified Kubernetes Administrator" /></Field>
                <Field label="Issuer"><Input name={`certIssuer${i}`} placeholder="CNCF" /></Field>
                <Field label="Credential ID" hint={i === 1 ? "Checked for duplicates" : undefined}><Input name={`certId${i}`} placeholder="LF-abc123" /></Field>
                <Field label="Expires"><Input name={`certExpires${i}`} type="date" /></Field>
                <Field label="Certificate file"><Input name={`certFile${i}`} type="file" accept="image/*,.pdf" className="file:mr-2 file:rounded-full file:border-0 file:bg-surface-2 file:px-2 file:py-0.5 file:text-xs" /></Field>
              </div>
            ))}</div>
          </div>
          <WizardNav back={`${BASE}?step=1`} skip={`${BASE}?step=3`} />
        </ActionForm>
      </Wizard>
    );
  }

  if (step === 3) {
    // Rate benchmark from trainers who share at least one skill.
    const peers = p.skills.length ? await db.trainerProfile.findMany({ where: { id: { not: p.id }, skills: { some: { slug: { in: p.skills.map((s) => s.slug) } } }, dayRateMin: { not: null } }, select: { dayRateMin: true, dayRateMax: true } }) : [];
    const mins = peers.map((x) => x.dayRateMin!).sort((a, b) => a - b), maxs = peers.map((x) => x.dayRateMax ?? x.dayRateMin!).sort((a, b) => a - b);
    const med = (a: number[]) => (a.length ? a[Math.floor(a.length / 2)] : null);
    const bench = mins.length ? { low: mins[0], midMin: med(mins)!, midMax: med(maxs)!, high: maxs[maxs.length - 1], n: mins.length } : null;
    return (
      <Wizard base={BASE} steps={STEPS} current={3} title={<>Where, how, and <span className="serif text-cyan">at what rate?</span></>} body="Day rates are visible only to signed-in companies. Cities matter for onsite work; virtual trainers are matched everywhere." aside={<>{preview}{bench ? <Card className="p-4"><p className="mono text-[11px] uppercase tracking-wider text-muted">Rate benchmark</p><p className="mt-1 text-sm text-muted">{bench.n} trainer{bench.n === 1 ? "" : "s"} with your skills list</p><p className="mt-2 font-display text-2xl font-bold text-cyan">{money(bench.midMin)} – {money(bench.midMax)}</p><p className="text-xs text-muted">typical range · overall {money(bench.low)} to {money(bench.high)} per day</p></Card> : null}</>}>
        <ActionForm action={trainerStep3} className="space-y-6">
          <div><p className="text-sm font-medium">Delivery modes</p><div className="mt-2 flex flex-wrap gap-2">{DELIVERY_MODES.map((m) => <label key={m} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-sm has-[:checked]:border-cyan has-[:checked]:bg-cyan/5"><input type="checkbox" name="deliveryModes" value={m} defaultChecked={p.deliveryModes.includes(m) || (!p.deliveryModes.length && m !== "HYBRID")} className="accent-cyan" />{modeLabel[m]}</label>)}</div></div>
          <Field label="Cities you deliver onsite in" hint="Comma-separated. Leave empty for virtual only."><Input name="cities" defaultValue={p.cities.join(", ")} placeholder="Bengaluru, Chennai, Hyderabad" /></Field>
          <div className="grid gap-4 md:grid-cols-[120px_1fr_1fr]">
            <Field label="Currency"><Select name="currency" defaultValue={p.currency}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</Select></Field>
            <Field label="Day rate from"><Input name="dayRateMin" type="number" min={0} step={500} defaultValue={p.dayRateMin ?? ""} placeholder={bench ? String(bench.midMin) : "25000"} /></Field>
            <Field label="Day rate up to"><Input name="dayRateMax" type="number" min={0} step={500} defaultValue={p.dayRateMax ?? ""} placeholder={bench ? String(bench.midMax) : "45000"} /></Field>
          </div>
          <Field label="Availability note" hint="Shown on your profile, e.g. “Weekdays only · 2 weeks’ notice for onsite”."><Input name="availabilityNote" defaultValue={p.availabilityNote ?? ""} /></Field>
          <div>
            <p className="text-sm font-medium">Block dates you already know you are busy <span className="text-xs text-muted">(optional)</span></p>
            {p.availability.length ? <p className="mt-1 text-xs text-muted">{p.availability.length} block{p.availability.length === 1 ? "" : "s"} already on your calendar.</p> : null}
            <div className="mt-2 grid gap-3 md:grid-cols-2">{[1, 2].map((i) => <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 rounded-xl border border-line bg-white p-3"><Field label="From"><Input name={`blockStart${i}`} type="date" /></Field><Field label="To"><Input name={`blockEnd${i}`} type="date" /></Field><Field label="Kind"><Select name={`blockKind${i}`} defaultValue="UNAVAILABLE"><option value="UNAVAILABLE">Unavailable</option><option value="TENTATIVE">Tentative</option></Select></Field></div>)}</div>
          </div>
          <WizardNav back={`${BASE}?step=2`} skip={`${BASE}?step=4`} />
        </ActionForm>
      </Wizard>
    );
  }

  if (step === 4) {
    return (
      <Wizard base={BASE} steps={STEPS} current={4} title={<>Show your <span className="serif text-cyan">track record.</span></>} body="Work history and a course from your catalogue make companies confident before they message you." aside={preview}>
        <ActionForm action={trainerStep4} className="space-y-6">
          <div>
            <p className="text-sm font-medium">Work history <span className="text-xs text-muted">(most recent first)</span></p>
            {p.experiences.length ? <p className="mt-1 text-xs text-muted">Already added: {p.experiences.map((e) => `${e.title} at ${e.organisation}`).join("; ")}</p> : null}
            <div className="mt-2 space-y-3">{[1, 2, 3].map((i) => (
              <div key={i} className="grid gap-3 rounded-xl border border-line bg-white p-3 md:grid-cols-[1.3fr_1.3fr_0.8fr_0.8fr_auto]">
                <Field label="Role"><Input name={`expTitle${i}`} placeholder="Senior Technical Trainer" /></Field>
                <Field label="Organisation"><Input name={`expOrg${i}`} placeholder="HPE Education Services" /></Field>
                <Field label="From"><Input name={`expStart${i}`} type="month" /></Field>
                <Field label="To"><Input name={`expEnd${i}`} type="month" /></Field>
                <label className="flex items-end gap-1.5 pb-2 text-xs"><input type="checkbox" name={`expCurrent${i}`} value="1" className="accent-cyan" /> Current</label>
                <Field label="What you did" className="md:col-span-5"><Input name={`expDesc${i}`} placeholder="Delivered 40+ HPE VME batches for enterprise ops teams across India." /></Field>
              </div>
            ))}</div>
          </div>
          <div className="rounded-xl border border-line bg-white p-4">
            <p className="text-sm font-medium">Your signature course <span className="text-xs text-muted">(optional; companies can request it directly)</span></p>
            {p.courses.length ? <p className="mt-1 text-xs text-muted">Already listed: {p.courses.map((c) => c.title).join(", ")}</p> : null}
            <div className="mt-2 grid gap-3 md:grid-cols-[1.5fr_100px]"><Field label="Course title"><Input name="courseTitle" placeholder="HPE VM Essentials 9.0 · hands-on bootcamp" /></Field><Field label="Days"><Input name="courseDays" type="number" min={1} max={30} defaultValue={3} /></Field></div>
            <Field label="Summary" className="mt-3"><Textarea name="courseSummary" className="min-h-20" placeholder="Who it is for, what they can do afterwards, lab setup you bring." /></Field>
          </div>
          <Field label="Intro video link" hint="YouTube, Vimeo or Loom. A 60-second intro doubles profile-to-message conversion."><Input name="videoUrl" defaultValue={p.videoUrl ?? ""} placeholder="https://youtu.be/…" /></Field>
          <WizardNav back={`${BASE}?step=3`} skip={`${BASE}?step=5`} />
        </ActionForm>
      </Wizard>
    );
  }

  // Step 5: review and publish.
  const checks: [string, boolean][] = [["Photo", !!p.user.avatarUrl], ["Headline and bio", p.headline.length >= 8 && p.bio.length >= 40], ["Skills (3+)", p.skills.length >= 3], ["Certification submitted", p.certifications.length > 0], ["Delivery modes and cities", p.deliveryModes.length > 0 && (p.cities.length > 0 || p.deliveryModes.every((m) => m === "VIRTUAL"))], ["Day rate", !!p.dayRateMin || !!p.dayRateMax], ["Work history", p.experiences.length > 0], ["Course or video", p.courses.length > 0 || !!p.videoUrl]];
  const score = Math.round((checks.filter(([, ok]) => ok).length / checks.length) * 100);
  const matches = p.skills.length ? await db.requirement.findMany({ where: { visibility: "PUBLIC", status: { in: ["OPEN", "SHORTLISTING"] }, skills: { some: { id: { in: p.skills.map((s) => s.id) } } } }, include: { company: { select: { name: true, slug: true, type: true, logoUrl: true, domainVerifiedAt: true } }, skills: true, _count: { select: { applications: true, comments: true } } }, orderBy: { createdAt: "desc" }, take: 3 }) : [];
  return (
    <Wizard base={BASE} steps={STEPS} current={5} title={<>Ready to <span className="serif text-cyan">go live.</span></>} body="Publish now and improve later. Verified badges appear once staff review your certifications, usually within two working days." aside={preview}>
      <div className="grid gap-5 md:grid-cols-[1fr_1fr]">
        <Card className="p-5">
          <div className="flex items-center justify-between"><p className="font-display font-semibold">Profile completeness</p><span className="font-display text-2xl font-bold text-cyan">{score}%</span></div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full bg-cyan" style={{ width: `${score}%` }} /></div>
          <ul className="mt-3 space-y-1.5 text-sm">{checks.map(([l, ok]) => <li key={l} className={ok ? "text-muted line-through" : ""}><span className={`mr-2 ${ok ? "text-lime" : "text-dim"}`}>{ok ? "✓" : "○"}</span>{l}</li>)}</ul>
        </Card>
        <Card className="p-5">
          <p className="flex items-center gap-2 font-display font-semibold"><BadgeCheck size={16} className="text-cyan" /> What happens next</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>Your profile appears in the directory and skill pages immediately.</li>
            <li>Staff review certifications for the verified badge.</li>
            <li>You get notified when a requirement matches your skills, and you can apply with a day rate.</li>
            <li>Companies can message you once you apply, or directly on a Growth plan.</li>
          </ul>
        </Card>
      </div>
      {matches.length ? <div className="mt-8"><h2 className="flex items-center gap-2 text-lg font-bold"><Sparkles size={16} className="text-cyan" /> Requirements that match you right now</h2><div className="mt-3 grid gap-4 md:grid-cols-3">{matches.map((r) => <RequirementCard key={r.id} r={r} />)}</div></div> : null}
      <form action={trainerFinish} className="mt-8 flex flex-wrap items-center gap-3 border-t border-line pt-5">
        <Link href={`${BASE}?step=4`} className="text-sm text-muted hover:text-ink">← Back</Link>
        <span className="ml-auto" />
        <ButtonLink href="/settings" variant="secondary">Edit more in Settings</ButtonLink>
        <button className="inline-flex h-11 items-center rounded-full bg-cyan px-6 font-display text-sm font-semibold text-white hover:bg-violet">Publish my profile</button>
      </form>
    </Wizard>
  );
}
