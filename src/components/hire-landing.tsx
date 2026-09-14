import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BadgeCheck, MapPin } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { RequirementCard, TrainerCard } from "@/components/cards";
import { JsonLd } from "@/components/json-ld";
import { ButtonLink, Card, Chip } from "@/components/ui";
import { breadcrumbLd, faqLd, slugifyCity } from "@/lib/seo";

/** Resolve a skill slug and optional city slug against real data. Used by both landing routes and their metadata. */
export async function resolveHire(skillSlug: string, citySlug?: string) {
  const skill = await db.skill.findUnique({ where: { slug: skillSlug }, include: { category: { select: { name: true, slug: true, skills: { select: { slug: true, name: true }, orderBy: { name: "asc" } } } } } });
  if (!skill) return null;
  const all = await db.trainerProfile.findMany({ where: { skills: { some: { id: skill.id } }, user: { status: "ACTIVE" } }, include: { user: { select: { name: true, avatarUrl: true } }, skills: true }, orderBy: [{ verifiedAt: "asc" }, { createdAt: "asc" }] });
  const cities = [...new Set(all.flatMap((t) => t.cities))].sort();
  const cityName = citySlug ? cities.find((c) => slugifyCity(c) === citySlug) : undefined;
  if (citySlug && !cityName) return null;
  const trainers = cityName ? all.filter((t) => t.cities.includes(cityName)) : all;
  return { skill, all, trainers, cities, cityName };
}

export function hireTitle(skillName: string, cityName?: string) {
  return cityName ? `Hire ${skillName} trainers in ${cityName}` : `Hire freelance ${skillName} trainers in India`;
}
export function hireDescription(skillName: string, count: number, cityName?: string) {
  return `${count} verified freelance ${skillName} corporate trainer${count === 1 ? "" : "s"}${cityName ? ` in ${cityName}` : " across India"} on CorpGurus. Compare day rates, certifications and reviews, post a requirement and get applications within hours.`;
}

/** Programmatic SEO landing page: "/hire/<skill>" and "/hire/<skill>/<city>". */
export async function HireLanding({ skillSlug, citySlug }: { skillSlug: string; citySlug?: string }) {
  const data = await resolveHire(skillSlug, citySlug);
  if (!data) notFound();
  const { skill, trainers, cities, cityName } = data;
  const user = await getCurrentUser();
  const showRate = !!user && user.role !== "TRAINER";
  const requirements = await db.requirement.findMany({ where: { visibility: "PUBLIC", status: { in: ["OPEN", "SHORTLISTING"] }, skills: { some: { id: skill.id } }, ...(cityName ? { city: cityName } : {}) }, include: { company: { select: { name: true, slug: true, type: true, logoUrl: true, domainVerifiedAt: true } }, skills: true, _count: { select: { applications: true, comments: true } } }, orderBy: { createdAt: "desc" }, take: 4 });
  const verified = trainers.filter((t) => t.verifiedAt).length;
  const rates = trainers.map((t) => t.dayRateMin).filter((n): n is number => !!n);
  const where = cityName ?? "India";
  const faq: [string, string][] = [
    [`How do I hire a ${skill.name} trainer${cityName ? ` in ${cityName}` : ""} on CorpGurus?`, `Post a requirement with your dates, delivery mode, participant count and budget. Trainers with ${skill.name} on their verified profile are notified immediately and apply with a proposed day rate. Shortlist, interview and award from your dashboard, then confirm everything in a signed work order.`],
    [`What does a freelance ${skill.name} corporate trainer cost?`, rates.length ? `Day rates listed by ${skill.name} trainers on CorpGurus currently start around ₹${Math.min(...rates).toLocaleString("en-IN")} per day and vary with experience, batch size and whether delivery is onsite or virtual. Rates are visible to signed-in company accounts.` : `Trainers publish a day-rate range on their profile, visible to signed-in company accounts. Rates vary with experience, batch size and onsite versus virtual delivery.`],
    [`Are the ${skill.name} trainers verified?`, `Trainers upload their certifications and CorpGurus staff review each one against the issuer before the verified badge appears. ${verified} of the ${trainers.length} ${skill.name} trainer${trainers.length === 1 ? "" : "s"}${cityName ? ` in ${cityName}` : ""} currently carry the badge.`],
    [`Can ${skill.name} training be delivered virtually?`, `Yes. Each trainer lists the delivery modes they support (onsite, virtual, hybrid) and the cities they travel to. Filter the directory by mode, or state the mode in your requirement.`],
  ];
  const crumbs: [string, string][] = [["Home", "/"], [skill.category?.name ?? "Skills", skill.category ? `/categories/${skill.category.slug}` : "/categories"], [`${skill.name} trainers`, `/hire/${skill.slug}`], ...(cityName ? [[cityName, `/hire/${skill.slug}/${slugifyCity(cityName)}`] as [string, string]] : [])];
  return (
    <div className="space-y-12">
      <JsonLd data={[faqLd(faq), breadcrumbLd(crumbs)]} />
      <nav aria-label="Breadcrumb" className="text-xs text-muted">{crumbs.map((c, i) => <span key={c[1]}>{i ? " › " : ""}<Link href={c[1]} className="hover:text-ink">{c[0]}</Link></span>)}</nav>
      <section className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end">
        <div>
          <p className="mono text-[12px] uppercase tracking-[0.12em] text-cyan">{skill.category?.name ?? "Skill"} · {where}</p>
          <h1 className="mt-2 text-[36px] font-bold leading-[1.05] md:text-[52px]">{cityName ? <>Hire <span className="serif text-cyan">{skill.name}</span> trainers in {cityName}</> : <>Hire freelance <span className="serif text-cyan">{skill.name}</span> trainers in India</>}</h1>
          <p className="mt-4 max-w-2xl text-[17px] text-muted">{hireDescription(skill.name, trainers.length, cityName)} Every profile shows verified certifications, delivery modes, cities and two-way ratings from completed engagements.</p>
          <div className="mt-6 flex flex-wrap gap-3"><ButtonLink href={`/requirements/new`} size="lg">Post a {skill.name} requirement <ArrowRight size={16} /></ButtonLink><ButtonLink href={`/trainers?skill=${skill.slug}${cityName ? `&city=${encodeURIComponent(cityName)}` : ""}`} variant="dark" size="lg">Open the directory</ButtonLink></div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4"><p className="font-display text-3xl font-bold text-cyan">{trainers.length}</p><p className="text-xs text-muted">{skill.name} trainer{trainers.length === 1 ? "" : "s"}</p></Card>
          <Card className="p-4"><p className="font-display text-3xl font-bold text-lime">{verified}</p><p className="text-xs text-muted">verified</p></Card>
          <Card className="p-4"><p className="font-display text-3xl font-bold text-violet">{requirements.length}</p><p className="text-xs text-muted">open requirements</p></Card>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold">{skill.name} trainers {cityName ? `based in ${cityName}` : "available now"}</h2>
        {trainers.length ? <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{trainers.slice(0, 8).map((t) => <TrainerCard key={t.id} t={t} showRate={showRate} />)}</div> : <p className="mt-3 text-muted">No trainers list {skill.name}{cityName ? ` in ${cityName}` : ""} yet. Post a requirement and we notify trainers in related skills.</p>}
        {trainers.length > 8 ? <div className="mt-5"><ButtonLink href={`/trainers?skill=${skill.slug}${cityName ? `&city=${encodeURIComponent(cityName)}` : ""}`} variant="secondary">See all {trainers.length} trainers</ButtonLink></div> : null}
      </section>

      {cities.length ? (
        <section>
          <h2 className="text-2xl font-bold">{skill.name} trainers by city</h2>
          <div className="mt-4 flex flex-wrap gap-2">{cities.map((c) => <Link key={c} href={`/hire/${skill.slug}/${slugifyCity(c)}`} className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm ${c === cityName ? "border-cyan bg-cyan text-white" : "border-line bg-white hover:border-cyan hover:text-cyan"}`}><MapPin size={13} /> {c}</Link>)}</div>
        </section>
      ) : null}

      {requirements.length ? (
        <section>
          <h2 className="text-2xl font-bold">Open {skill.name} training requirements{cityName ? ` in ${cityName}` : ""}</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">{requirements.map((r) => <RequirementCard key={r.id} r={r} />)}</div>
        </section>
      ) : null}

      <section className="grid gap-8 lg:grid-cols-[1fr_1fr]">
        <div>
          <h2 className="text-2xl font-bold">Why companies hire {skill.name} trainers on CorpGurus</h2>
          <ul className="mt-4 space-y-3 text-[15px] text-ink/90">
            <li className="flex gap-2"><BadgeCheck size={18} className="mt-0.5 shrink-0 text-cyan" /> Certifications reviewed by staff, not self-declared. Company email domains verified too.</li>
            <li className="flex gap-2"><BadgeCheck size={18} className="mt-0.5 shrink-0 text-cyan" /> Requirements state dates, mode, participants and budget up front, so applications arrive with a real day rate.</li>
            <li className="flex gap-2"><BadgeCheck size={18} className="mt-0.5 shrink-0 text-cyan" /> Signed work orders, optional escrow, participant feedback links and completion certificates on one page.</li>
            <li className="flex gap-2"><BadgeCheck size={18} className="mt-0.5 shrink-0 text-cyan" /> No commission on the trainer&apos;s rate. Free to post your first requirements.</li>
          </ul>
        </div>
        <div>
          <h2 className="text-2xl font-bold">Frequently asked</h2>
          <div className="mt-4 divide-y divide-line rounded-2xl border border-line bg-white px-5">{faq.map(([q, a]) => <details key={q} className="py-4"><summary className="cursor-pointer font-display font-semibold">{q}</summary><p className="mt-2 text-sm leading-relaxed text-muted">{a}</p></details>)}</div>
        </div>
      </section>

      {skill.category ? (
        <section>
          <h2 className="text-2xl font-bold">Related {skill.category.name} skills</h2>
          <div className="mt-4 flex flex-wrap gap-2">{skill.category.skills.filter((s) => s.slug !== skill.slug).map((s) => <Link key={s.slug} href={`/hire/${s.slug}`}><Chip className="hover:border-cyan hover:text-cyan">{s.name} trainers</Chip></Link>)}</div>
        </section>
      ) : null}

      <section className="rounded-[32px] bg-navy p-8 text-white md:flex md:items-center md:justify-between md:p-10">
        <div><h2 className="text-2xl font-bold md:text-3xl">Need a {skill.name} batch delivered{cityName ? ` in ${cityName}` : ""}?</h2><p className="mt-2 text-white/70">Post the requirement in five minutes. Matching trainers are notified immediately.</p></div>
        <div className="mt-5 flex flex-wrap gap-3 md:mt-0"><ButtonLink href="/signup?as=company" size="lg">Post a requirement</ButtonLink><ButtonLink href="/signup" variant="secondary" size="lg">I&apos;m a {skill.name} trainer</ButtonLink></div>
      </section>
    </div>
  );
}
