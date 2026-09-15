import Link from "next/link";
import { ArrowRight, ArrowUpRight, BadgeCheck, CheckCircle2, Mail, MessageSquareText, Plus, Search, ShieldCheck, Sparkles, Star } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Avatar, ButtonLink } from "@/components/ui";
import { RequirementCard, TrainerCard } from "@/components/cards";
import { getT } from "@/lib/i18n";
import { timeAgo } from "@/lib/utils";
import { JsonLd } from "@/components/json-ld";
import { faqLd, organizationLd, pageMeta, SITE, websiteLd } from "@/lib/seo";

export const metadata = pageMeta({ title: `CorpGurus · ${SITE.tagline}`, description: SITE.description, path: "/" });

const FAQ = [
  ["How does CorpGurus verify trainers?", "Trainers upload certificates; CorpGurus staff review each one against the issuer before the verified badge appears. Company email domains are verified the same way."],
  ["What does it cost to post a requirement?", "Posting is free on the Starter plan (two open requirements at a time). Company Growth removes the limit and adds direct messaging to any trainer."],
  ["How are day rates handled?", "Trainers set a day-rate range that only signed-in companies can see. Every application carries a proposed rate, and the accepted rate is written into a signed work order."],
  ["Can I pay through the platform?", "Yes. After a work order is accepted the company can fund the amount in escrow; it is released to the trainer after delivery and CorpGurus pays out to their bank."],
  ["Do trainers pay commission?", "No. Trainers keep their full rate. Optional Trainer Pro adds unlimited applications and featured placement; escrow deducts a small platform fee only when a company chooses managed payment."],
  ["Can partners integrate their own systems?", "Training partners get API keys and webhooks to sync requirements, applications and work orders with their LMS or vendor tools."],
];

export default async function Home() {
  const [user, t] = await Promise.all([getCurrentUser(), getT()]);
  const [trainers, requirements, counts, categories, recs, posts, companies] = await Promise.all([
    db.trainerProfile.findMany({ where: { verifiedAt: { not: null } }, include: { user: { select: { name: true, avatarUrl: true } }, skills: true }, orderBy: { createdAt: "asc" }, take: 4 }),
    db.requirement.findMany({ where: { visibility: "PUBLIC", status: { in: ["OPEN", "SHORTLISTING"] } }, include: { company: { select: { name: true, slug: true, type: true, logoUrl: true, domainVerifiedAt: true } }, skills: true, _count: { select: { applications: true, comments: true } } }, orderBy: { createdAt: "desc" }, take: 4 }),
    Promise.all([db.trainerProfile.count(), db.company.count(), db.requirement.count({ where: { status: { in: ["OPEN", "SHORTLISTING"] } } }), db.certification.count({ where: { status: "VERIFIED" } }), db.requirement.count({ where: { status: { in: ["AWARDED", "COMPLETED"] } } })]),
    db.category.findMany({ include: { _count: { select: { requirements: { where: { status: { in: ["OPEN", "SHORTLISTING"] }, visibility: "PUBLIC" } }, skills: true } } }, orderBy: { name: "asc" } }),
    db.recommendation.findMany({ where: { visible: true }, include: { author: { select: { name: true, avatarUrl: true } }, trainer: { include: { user: { select: { name: true } } } }, company: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 4 }),
    db.post.findMany({ where: { deletedAt: null }, include: { author: { select: { name: true, avatarUrl: true, role: true } }, _count: { select: { likes: true, comments: true } } }, orderBy: { createdAt: "desc" }, take: 3 }),
    db.company.findMany({ select: { name: true, slug: true }, orderBy: { createdAt: "asc" }, take: 6 }),
  ]);
  const popular = await db.skill.findMany({ where: { trainers: { some: {} } }, select: { slug: true, name: true, _count: { select: { trainers: true } } }, orderBy: { trainers: { _count: "desc" } }, take: 18 });
  const [nT, nC, nR, nV, nDone] = counts;
  const showRate = user?.role === "COMPANY" || user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const featured = recs[0];

  return (
    <div className="-mt-8 md:-mt-10">
      <JsonLd data={[organizationLd(), websiteLd(), faqLd(FAQ.map(([q, a]) => [q, a] as [string, string]))]} />
      {/* ---------- Hero ---------- */}
      <section className="bleed hero-bg">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-16 pt-14 md:px-6 lg:grid-cols-[1.1fr_1fr] lg:pb-24 lg:pt-20">
          <div>
            <p className="mono mb-4 inline-flex items-center gap-2 rounded-full border border-cyan/20 bg-white px-3 py-1 text-[12px] uppercase tracking-[0.1em] text-cyan"><Sparkles size={13} /> {t("home.eyebrow")}</p>
            <h1 className="max-w-2xl text-[42px] font-bold leading-[1.02] text-ink md:text-[64px]">
              {t("home.hero.pre")} <span className="serif text-cyan">{t("home.hero.em")}</span> {t("home.hero.post")}
            </h1>
            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-muted">{t("home.body")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/signup?as=company" size="lg">{t("home.cta.post")} <ArrowRight size={16} /></ButtonLink>
              <ButtonLink href="/signup" variant="dark" size="lg">{t("home.cta.join")}</ButtonLink>
            </div>
            <ul className="mt-8 grid gap-2 text-sm text-muted sm:grid-cols-2">
              {[t("home.bullet1"), t("home.bullet2"), t("home.bullet3"), t("home.bullet4")].map((b) => (
                <li key={b} className="flex items-center gap-2"><CheckCircle2 size={16} className="shrink-0 text-cyan" />{b}</li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-[520px]">
            <div className="absolute -left-6 top-6 h-64 w-64 rounded-full bg-lilac/60 blur-2xl" />
            <div className="absolute -right-4 bottom-4 h-56 w-56 rounded-full bg-cyan/20 blur-2xl" />
            <div className="relative grid grid-cols-[1fr_1.2fr] gap-4">
              <div className="rounded-3xl bg-white p-6 shadow-[0_20px_60px_rgba(76,29,149,0.12)]">
                <p className="font-display text-[64px] font-bold leading-none text-cyan">{nV}<span className="text-[32px]">+</span></p>
                <p className="mt-2 font-display text-sm font-semibold">{t("home.stat.verified")}</p>
                <p className="text-xs text-muted">reviewed by CorpGurus staff</p>
              </div>
              <div className="row-span-2 flex flex-col justify-between rounded-[36px] bg-navy p-6 text-white">
                <div>
                  <p className="mono text-[11px] uppercase tracking-[0.12em] text-white/60">{t("home.glance")}</p>
                  <div className="mt-4 flex -space-x-3">{trainers.slice(0, 4).map((x) => <Avatar key={x.id} name={x.user.name} src={x.user.avatarUrl} size={44} className="ring-2 ring-navy" />)}</div>
                  <p className="mt-3 font-display text-3xl font-bold">{nT} <span className="serif text-lilac">{t("home.stat.trainers").toLowerCase()}</span></p>
                  <p className="text-sm text-white/70">{nC} {t("home.stat.companies").toLowerCase()} · {nR} {t("home.stat.open").toLowerCase()}</p>
                </div>
                <div className="mt-6 space-y-2">
                  {trainers.slice(0, 2).map((x) => (
                    <Link key={x.id} href={`/trainers/${x.slug}`} className="flex items-center gap-3 rounded-2xl bg-white/10 px-3 py-2 text-sm hover:bg-white/15">
                      <Avatar name={x.user.name} src={x.user.avatarUrl} size={30} /><span className="min-w-0 flex-1 truncate">{x.user.name}</span><BadgeCheck size={15} className="text-lilac" />
                    </Link>
                  ))}
                </div>
              </div>
              <div className="rounded-3xl bg-cyan p-6 text-white shadow-[0_20px_60px_rgba(109,40,217,0.25)]">
                <p className="font-display text-[40px] font-bold leading-none">{nDone}</p>
                <p className="mt-2 text-sm font-semibold">batches awarded</p>
                <p className="text-xs text-white/70">with signed work orders</p>
              </div>
            </div>
          </div>
        </div>
        {companies.length ? (
          <div className="mx-auto max-w-7xl px-4 pb-10 md:px-6">
            <p className="mono text-center text-[11px] uppercase tracking-[0.14em] text-dim">{t("home.trusted")}</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 font-display text-sm font-bold text-ink/45">{companies.map((c) => <Link key={c.slug} href={`/companies/${c.slug}`} className="hover:text-cyan">{c.name}</Link>)}</div>
          </div>
        ) : null}
      </section>

      {/* ---------- Ways to hire ---------- */}
      <section className="pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mono text-[12px] uppercase tracking-[0.12em] text-cyan">{t("home.ways.eyebrow")}</p>
          <h2 className="mt-3 text-[34px] font-bold leading-[1.05] md:text-[46px]">{t("home.ways.pre")} <span className="serif text-cyan">{t("home.ways.em")}</span> {t("home.ways.post")}</h2>
          <div className="mt-6 flex flex-wrap justify-center gap-3"><ButtonLink href="/requirements/new" size="md">{t("home.cta.post")}</ButtonLink><ButtonLink href="/trainers" variant="secondary" size="md">{t("nav.trainers")}</ButtonLink></div>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-[1.1fr_1fr]">
          <div className="rounded-[32px] bg-navy p-8 text-white md:p-10">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cyan"><Plus size={20} /></span>
            <h3 className="mt-6 text-3xl font-bold leading-tight">Tell us what you need <span className="serif text-lilac">to get delivered</span></h3>
            <p className="mt-3 max-w-md text-white/70">Dates, delivery mode, participants and budget. Matching trainers are notified the moment you publish and can ask questions in the open.</p>
            <div className="mt-6 rounded-2xl bg-white/10 p-4 text-sm text-white/80">
              <p className="text-white/50">e.g.</p>
              <p className="mt-1">HPE VM Essentials 9.0 · 3-day instructor-led for a 16-person bank ops team, Mumbai, week of 20 Oct.</p>
            </div>
            <ButtonLink href="/requirements/new" className="mt-6">{t("home.cta.post")} <ArrowRight size={15} /></ButtonLink>
          </div>
          <div className="grid gap-5">
            <div className="rounded-[32px] bg-cyan p-8 text-white">
              <h3 className="text-2xl font-bold leading-tight">Search our top <span className="serif text-lilac">talent</span></h3>
              <form action="/trainers" className="mt-4 flex overflow-hidden rounded-full bg-white p-1">
                <input name="q" placeholder="Kubernetes, PAN-OS, leadership…" className="min-w-0 flex-1 bg-transparent px-4 text-sm text-ink placeholder:text-dim focus:outline-none" />
                <button className="inline-flex h-10 items-center gap-1.5 rounded-full bg-navy px-4 font-display text-sm font-semibold text-white"><Search size={15} /> Search</button>
              </form>
              <p className="mt-3 text-sm text-white/75">Filter by skill, city, delivery mode and verification. Day rates visible to signed-in companies.</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="rounded-[32px] bg-white p-6 shadow-[0_10px_40px_rgba(76,29,149,0.08)]">
                <p className="font-display text-4xl font-bold text-cyan">3×</p>
                <p className="mt-1 font-display font-semibold">more shortlists</p>
                <p className="mt-1 text-sm text-muted">for trainers with verified certifications than self-declared ones.</p>
              </div>
              <div className="rounded-[32px] bg-plum p-6 text-white">
                <p className="font-display text-xl font-bold leading-tight">Earn what you&apos;re <span className="serif text-lilac">worth</span></p>
                <p className="mt-2 text-sm text-white/75">No commission. Rates visible only to companies.</p>
                <Link href="/signup" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-lilac hover:text-white">Build your profile <ArrowUpRight size={14} /></Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Journeys ---------- */}
      <section className="pt-24">
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-end">
          <h2 className="text-[34px] font-bold leading-[1.05] md:text-[44px]">{t("home.journeys.pre")} <span className="serif text-cyan">{t("home.journeys.em")}</span></h2>
          <p className="max-w-md text-muted lg:justify-self-end">Companies post and shortlist. Trainers apply and deliver. Everything in between, from interviews to signed work orders and invoices, lives on the same page.</p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            { n: "01", t: t("home.step.post"), b: "Publish a requirement with dates, mode, participants and budget. Matching trainers are notified instantly.", href: "/requirements/new", cta: t("home.cta.post") },
            { n: "02", t: t("home.step.shortlist"), b: "Compare applications side by side, schedule interviews, message directly and check availability.", href: "/trainers", cta: "Browse trainers" },
            { n: "03", t: t("home.step.award"), b: "Award, sign a work order, secure payment in escrow and collect participant feedback and certificates.", href: "/pricing", cta: "See plans" },
          ].map((s) => (
            <div key={s.n} className="group rounded-[32px] border border-line bg-white p-7 transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(76,29,149,0.10)]">
              <p className="serif text-5xl text-cyan/50">{s.n}</p>
              <h3 className="mt-4 text-2xl font-bold">{s.t}</h3>
              <p className="mt-2 text-muted">{s.b}</p>
              <Link href={s.href} className="mt-5 inline-flex items-center gap-1 font-display text-sm font-semibold text-cyan">{s.cta} <ArrowRight size={14} className="transition group-hover:translate-x-0.5" /></Link>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Dark: categories ---------- */}
      <section className="bleed band-dark mt-24">
        <div className="mx-auto max-w-7xl px-4 py-20 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-end">
            <h2 className="text-[34px] font-bold leading-[1.05] md:text-[46px]">{t("home.cats.pre")} <span className="serif text-lilac">{t("home.cats.em")}</span> {t("home.cats.post")}</h2>
            <div className="lg:justify-self-end"><p className="max-w-sm text-white/65">Every domain a corporate L&amp;D team buys, from HPE and cloud to compliance and leadership.</p><Link href="/categories" className="mt-3 inline-flex items-center gap-1 font-display text-sm font-semibold text-lilac">{t("home.categories.all")}</Link></div>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {categories.map((c, i) => (
              <Link key={c.id} href={`/categories/${c.slug}`} className={`group relative overflow-hidden rounded-[28px] border border-white/10 p-5 transition hover:border-lilac/60 ${i % 3 === 0 ? "bg-gradient-to-br from-cyan/60 to-plum" : i % 3 === 1 ? "bg-white/5" : "bg-gradient-to-br from-white/10 to-white/0"}`}>
                <p className="font-display text-lg font-bold leading-tight">{c.name}</p>
                <p className="mt-1 text-xs text-white/60">{c._count.skills} skills</p>
                <p className="mt-6 inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs">{c._count.requirements} {t("home.open")} <ArrowUpRight size={12} className="transition group-hover:translate-x-0.5" /></p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Requirements ---------- */}
      <section className="pt-24">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <h2 className="text-[34px] font-bold leading-[1.05] md:text-[46px]">{t("home.latest.pre")} <span className="serif text-cyan">{t("home.latest.em")}</span> {t("home.latest.post")}</h2>
          <div className="lg:justify-self-end"><p className="max-w-sm text-muted">Open now, with the dates, mode, participants and budget stated up front.</p><Link href="/requirements" className="mt-3 inline-flex items-center gap-1 font-display text-sm font-semibold text-cyan">{t("home.latest.all")}</Link></div>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">{requirements.map((r) => <RequirementCard key={r.id} r={r} />)}</div>
        <div className="mt-8 text-center"><ButtonLink href="/requirements" variant="dark">{t("home.latest.all")}</ButtonLink></div>
      </section>

      {/* ---------- Trainers ---------- */}
      <section className="pt-24">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <h2 className="text-[34px] font-bold leading-[1.05] md:text-[46px]">{t("home.verified.eyebrow")}. <span className="serif text-cyan">{t("home.verified")}</span></h2>
          <div className="lg:justify-self-end"><Link href="/trainers" className="inline-flex items-center gap-1 font-display text-sm font-semibold text-cyan">{t("home.verified.all")}</Link></div>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{trainers.map((x) => <TrainerCard key={x.id} t={x} showRate={!!showRate} />)}</div>
      </section>

      {/* ---------- Testimonials ---------- */}
      <section className="pt-24">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-end">
          <h2 className="text-[34px] font-bold leading-[1.05] md:text-[44px]">{t("home.testi.pre")} <span className="serif text-cyan">{t("home.testi.em")}</span></h2>
          <p className="max-w-md text-muted lg:justify-self-end">Recommendations are written by the people who hired or co-delivered, tied to real engagements on CorpGurus.</p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {recs.slice(0, 3).map((r) => (
            <figure key={r.id} className="flex flex-col rounded-[32px] border border-line bg-white p-7">
              <div className="flex gap-0.5 text-amber">{[1, 2, 3, 4, 5].map((i) => <Star key={i} size={14} fill="currentColor" />)}</div>
              <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-ink/90">“{r.body.length > 220 ? `${r.body.slice(0, 220)}…` : r.body}”</blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-line pt-4">
                <Avatar name={r.author.name} src={r.author.avatarUrl} size={40} tone="violet" />
                <div className="min-w-0"><p className="truncate font-display text-sm font-semibold">{r.author.name}</p><p className="truncate text-xs text-muted">{r.company?.name ?? r.relationship} · about <Link href={`/trainers/${r.trainer.slug}`} className="text-cyan hover:underline">{r.trainer.user.name}</Link></p></div>
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="band-purple mt-6 grid gap-6 rounded-[32px] p-8 md:grid-cols-[1.2fr_1fr_1fr] md:items-center md:p-10">
          <div><p className="font-display text-2xl font-bold leading-tight">Trusted by {nC} companies and {nT} trainers across India.</p><p className="mt-2 text-sm text-white/75">Two-way ratings after every completed engagement keep both sides honest.</p></div>
          <div><p className="font-display text-5xl font-bold">{nDone}<span className="text-lilac">+</span></p><p className="text-sm text-white/80">engagements awarded</p></div>
          <div><p className="font-display text-5xl font-bold">{nV}<span className="text-lilac">+</span></p><p className="text-sm text-white/80">verified certifications</p></div>
        </div>
      </section>

      {/* ---------- Featured quote (dark plum) ---------- */}
      {featured ? (
        <section className="bleed band-plum mt-24">
          <div className="mx-auto max-w-7xl px-4 py-20 md:px-6">
            <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:items-center">
              <div>
                <h2 className="text-[34px] font-bold leading-[1.05] md:text-[44px]">{t("home.quote.pre")} <span className="serif text-lilac">{t("home.quote.em")}</span></h2>
                <p className="mt-4 max-w-sm text-white/65">Every recommendation is linked to the engagement it came from, so companies can check the context.</p>
              </div>
              <figure className="rounded-[32px] border border-white/10 bg-white/5 p-8 md:p-10">
                <blockquote className="serif text-2xl leading-snug md:text-3xl">“{featured.body.length > 260 ? `${featured.body.slice(0, 260)}…` : featured.body}”</blockquote>
                <figcaption className="mt-6 flex items-center gap-3"><Avatar name={featured.author.name} src={featured.author.avatarUrl} size={44} tone="amber" /><div><p className="font-display font-semibold">{featured.author.name}</p><p className="text-sm text-white/60">{featured.company?.name ?? featured.relationship} · on {featured.trainer.user.name}</p></div></figcaption>
              </figure>
            </div>
            <div className="mt-14 grid gap-6 border-t border-white/10 pt-10 md:grid-cols-3">
              {[
                { icon: <ShieldCheck size={22} />, t: "Verified, not self-declared", b: "Certifications reviewed by staff; company domains verified." },
                { icon: <MessageSquareText size={22} />, t: "Questions in the open", b: "Clarifications are public comments; every applicant benefits." },
                { icon: <BadgeCheck size={22} />, t: "Signed work orders", b: "Dates, rate and terms confirmed by both sides before day one." },
              ].map((f) => (
                <div key={f.t} className="flex gap-4"><span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-lilac">{f.icon}</span><div><p className="font-display font-semibold">{f.t}</p><p className="mt-1 text-sm text-white/65">{f.b}</p></div></div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ---------- FAQ ---------- */}
      <section className="pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mono text-[12px] uppercase tracking-[0.12em] text-cyan">FAQ</p>
          <h2 className="mt-3 text-[34px] font-bold leading-[1.05] md:text-[46px]">{t("home.faq.pre")} <span className="serif text-cyan">{t("home.faq.em")}</span></h2>
        </div>
        <div className="mx-auto mt-10 max-w-3xl divide-y divide-line rounded-[32px] border border-line bg-white px-6 md:px-8">
          {FAQ.map(([q, a], i) => (
            <details key={q} open={i === 0} className="group py-5">
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-display text-[17px] font-semibold"><span>{q}</span><span className="faq-icon inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-cyan transition"><Plus size={16} /></span></summary>
              <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">{a}</p>
            </details>
          ))}
        </div>
        <div className="mx-auto mt-6 flex max-w-3xl flex-wrap items-center justify-between gap-4 rounded-full bg-navy px-6 py-4 text-white">
          <p className="font-display font-semibold">Still have a question?</p>
          <div className="flex gap-2"><ButtonLink href="/pricing" variant="secondary" size="sm">See pricing</ButtonLink><ButtonLink href="mailto:hello@corpgurus.com" size="sm">Contact us</ButtonLink></div>
        </div>
      </section>

      {/* ---------- Blog / feed ---------- */}
      {posts.length ? (
        <section className="pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mono text-[12px] uppercase tracking-[0.12em] text-cyan">{t("nav.feed")}</p>
            <h2 className="mt-3 text-[34px] font-bold leading-[1.05] md:text-[46px]">{t("home.blog.pre")} <span className="serif text-cyan">{t("home.blog.em")}</span></h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {posts.map((p, i) => (
              <Link key={p.id} href={`/feed/${p.id}`} className="group overflow-hidden rounded-[32px] border border-line bg-white transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(76,29,149,0.10)]">
                <div className={`h-40 ${i % 3 === 0 ? "band-purple" : i % 3 === 1 ? "bg-navy" : "bg-plum"} p-6 text-white`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {p.imageUrl ? <img src={p.imageUrl} alt="" loading="lazy" decoding="async" className="-m-6 h-40 w-[calc(100%+3rem)] object-cover" /> : <p className="serif text-3xl leading-tight text-white/90">{p.body.split("\n")[0].slice(0, 70)}{p.body.length > 70 ? "…" : ""}</p>}
                </div>
                <div className="p-6">
                  <p className="text-xs text-muted">{p.author.name} · {timeAgo(p.createdAt)}</p>
                  <p className="mt-2 line-clamp-3 text-[15px] leading-relaxed text-ink/90">{p.body}</p>
                  <p className="mt-4 text-xs text-muted">{p._count.likes} likes · {p._count.comments} comments</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* ---------- Popular searches (internal links to skill landing pages) ---------- */}
      {popular.length ? (
        <section className="pt-24">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-end">
            <h2 className="text-[30px] font-bold leading-[1.05] md:text-[40px]">Hire by skill. <span className="serif text-cyan">Popular searches</span> this month.</h2>
            <p className="max-w-sm text-muted lg:justify-self-end">Every skill has a page with the trainers who teach it, the cities they cover and the open requirements right now.</p>
          </div>
          <div className="mt-8 flex flex-wrap gap-2">{popular.map((s) => <Link key={s.slug} href={`/hire/${s.slug}`} className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-medium transition hover:border-cyan hover:text-cyan">Hire {s.name} trainers<span className="rounded-full bg-surface-2 px-1.5 text-xs text-muted">{s._count.trainers}</span></Link>)}</div>
        </section>
      ) : null}

      {/* ---------- Contact + CTA (dark) ---------- */}
      <section className="bleed band-dark mt-24">
        <div className="mx-auto max-w-7xl px-4 py-20 md:px-6">
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
            <div>
              <h2 className="text-[34px] font-bold leading-[1.05] md:text-[44px]">{t("home.help.pre")} <span className="serif text-lilac">{t("home.help.em")}</span></h2>
              <p className="mt-4 max-w-md text-white/65">Onboarding a training partner, moving a bench of trainers, or integrating your LMS: talk to a person.</p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <a href="mailto:hello@corpgurus.com" className="rounded-3xl border border-white/10 bg-white/5 p-5 hover:border-lilac/60"><Mail size={18} className="text-lilac" /><p className="mt-3 font-display font-semibold">Email us</p><p className="text-sm text-white/60">hello@corpgurus.com</p></a>
                <Link href="/pricing" className="rounded-3xl border border-white/10 bg-white/5 p-5 hover:border-lilac/60"><Sparkles size={18} className="text-lilac" /><p className="mt-3 font-display font-semibold">Plans for partners</p><p className="text-sm text-white/60">Unlimited posts, API and webhooks</p></Link>
              </div>
            </div>
            <div className="rounded-[32px] bg-cyan p-8 text-white md:p-10">
              <p className="mono text-[11px] uppercase tracking-[0.12em] text-white/70">{t("home.companies.eyebrow")}</p>
              <h3 className="mt-3 text-3xl font-bold leading-tight">{t("home.companies.t")}</h3>
              <p className="mt-3 text-white/80">{t("home.companies.b")}</p>
              <div className="mt-6 flex flex-wrap gap-3"><ButtonLink href="/signup?as=company" variant="dark">{t("home.companies.cta")}</ButtonLink><ButtonLink href="/signup" variant="secondary">{t("home.trainers.cta")}</ButtonLink></div>
            </div>
          </div>
          <div className="mt-14 rounded-[32px] bg-white p-8 text-ink md:flex md:items-center md:justify-between md:p-10">
            <div><h3 className="text-2xl font-bold leading-tight md:text-3xl">{t("home.cta.pre")} <span className="serif text-cyan">{t("home.cta.em")}</span></h3><p className="mt-2 text-muted">{t("home.trainers.b")}</p></div>
            <div className="mt-5 flex flex-wrap gap-3 md:mt-0"><ButtonLink href="/signup?as=company" size="lg">{t("home.cta.post")}</ButtonLink><ButtonLink href="/signup" variant="dark" size="lg">{t("home.cta.join")}</ButtonLink></div>
          </div>
        </div>
      </section>
    </div>
  );
}
