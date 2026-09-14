import Link from "next/link";
import { ArrowRight, BadgeCheck, CheckCircle2, MessageSquareText, Radar, ShieldCheck } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ButtonLink } from "@/components/ui";
import { RequirementCard, TrainerCard } from "@/components/cards";
import { getT } from "@/lib/i18n";

export default async function Home() {
  const [user, t] = await Promise.all([getCurrentUser(), getT()]);
  const [trainers, requirements, counts] = await Promise.all([
    db.trainerProfile.findMany({ where: { verifiedAt: { not: null } }, include: { user: { select: { name: true, avatarUrl: true } }, skills: true }, orderBy: { createdAt: "asc" }, take: 4 }),
    db.requirement.findMany({ where: { visibility: "PUBLIC", status: { in: ["OPEN", "SHORTLISTING"] } }, include: { company: { select: { name: true, slug: true, type: true, logoUrl: true, domainVerifiedAt: true } }, skills: true, _count: { select: { applications: true, comments: true } } }, orderBy: { createdAt: "desc" }, take: 3 }),
    Promise.all([db.trainerProfile.count(), db.company.count(), db.requirement.count({ where: { status: { in: ["OPEN", "SHORTLISTING"] } } }), db.certification.count({ where: { status: "VERIFIED" } })]),
  ]);
  const [nT, nC, nR, nV] = counts;
  const categories = await db.category.findMany({ include: { _count: { select: { requirements: { where: { status: { in: ["OPEN", "SHORTLISTING"] }, visibility: "PUBLIC" } } } } }, orderBy: { name: "asc" } });
  const showRate = user?.role === "COMPANY" || user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  return (
    <div className="space-y-16">
      <section className="grid items-center gap-10 pt-4 lg:grid-cols-[1.15fr_1fr] lg:pt-10">
        <div>
          <p className="mono mb-3 text-[12px] uppercase tracking-[0.1em] text-cyan">{t("home.eyebrow")}</p>
          <h1 className="max-w-2xl text-[38px] font-bold leading-[1.1] text-navy md:text-[52px]">
            {t("home.title")}
          </h1>
          <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-muted">
            {t("home.body")}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <ButtonLink href="/signup?as=company" size="lg">{t("home.cta.post")} <ArrowRight size={16} /></ButtonLink>
            <ButtonLink href="/signup" variant="secondary" size="lg">{t("home.cta.join")}</ButtonLink>
          </div>
          <ul className="mt-7 grid gap-2 text-sm text-muted sm:grid-cols-2">
            {[t("home.bullet1"), t("home.bullet2"), t("home.bullet3"), t("home.bullet4")].map((b) => (
              <li key={b} className="flex items-center gap-2"><CheckCircle2 size={16} className="shrink-0 text-lime" />{b}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-line bg-white p-2 shadow-[0_12px_40px_rgba(11,42,91,0.08)]">
          <div className="rounded-xl bg-navy p-6 text-white">
            <p className="mono text-[11px] uppercase tracking-[0.1em] text-white/60">{t("home.glance")}</p>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-5">
              {[[t("home.stat.trainers"), nT], [t("home.stat.companies"), nC], [t("home.stat.open"), nR], [t("home.stat.verified"), nV]].map(([l, v]) => (
                <div key={String(l)}>
                  <dd className="font-display text-[34px] font-bold leading-none tabular-nums">{v}</dd>
                  <dt className="mt-1.5 text-sm text-white/70">{l}</dt>
                </div>
              ))}
            </dl>
          </div>
          <div className="grid grid-cols-3 gap-2 p-3 text-center text-xs text-muted">
            <div className="rounded-lg bg-surface-2 py-3"><p className="font-display text-base font-bold text-ink">{t("home.step.post")}</p>{t("home.step.post.b")}</div>
            <div className="rounded-lg bg-surface-2 py-3"><p className="font-display text-base font-bold text-ink">{t("home.step.shortlist")}</p>{t("home.step.shortlist.b")}</div>
            <div className="rounded-lg bg-surface-2 py-3"><p className="font-display text-base font-bold text-ink">{t("home.step.award")}</p>{t("home.step.award.b")}</div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between border-b border-line pb-3"><h2 className="text-2xl font-bold">{t("home.categories")}</h2><Link href="/categories" className="text-sm font-medium text-cyan hover:underline">{t("home.categories.all")}</Link></div>
        <div className="flex flex-wrap gap-2">{categories.map((c) => <Link key={c.id} href={`/categories/${c.slug}`} className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3.5 py-2 text-sm font-medium hover:border-cyan hover:text-cyan">{c.name}{c._count.requirements ? <span className="rounded-md bg-violet/8 px-1.5 text-xs text-violet">{c._count.requirements} {t("home.open")}</span> : null}</Link>)}</div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: <Radar size={20} />, t: t("home.f1.t"), b: t("home.f1.b") },
          { icon: <MessageSquareText size={20} />, t: t("home.f2.t"), b: t("home.f2.b") },
          { icon: <BadgeCheck size={20} />, t: t("home.f3.t"), b: t("home.f3.b") },
          { icon: <ShieldCheck size={20} />, t: t("home.f4.t"), b: t("home.f4.b") },
        ].map((f) => (
          <div key={f.t} className="rounded-2xl border border-line bg-white p-5">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-cyan/8 text-cyan">{f.icon}</span>
            <h3 className="mt-3 text-[15px] font-bold">{f.t}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted">{f.b}</p>
          </div>
        ))}
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between border-b border-line pb-3">
          <div><p className="mono text-[12px] uppercase tracking-[0.08em] text-violet">{t("home.latest.eyebrow")}</p><h2 className="text-2xl font-bold">{t("home.latest")}</h2></div>
          <Link href="/requirements" className="text-sm font-medium text-cyan hover:underline">{t("home.latest.all")}</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">{requirements.map((r) => <RequirementCard key={r.id} r={r} />)}</div>
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between border-b border-line pb-3">
          <div><p className="mono text-[12px] uppercase tracking-[0.08em] text-cyan">{t("home.verified.eyebrow")}</p><h2 className="text-2xl font-bold">{t("home.verified")}</h2></div>
          <Link href="/trainers" className="text-sm font-medium text-cyan hover:underline">{t("home.verified.all")}</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{trainers.map((t) => <TrainerCard key={t.id} t={t} showRate={!!showRate} />)}</div>
      </section>

      <section className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-2">
        <div className="bg-white p-8 md:p-10">
          <p className="mono text-[12px] uppercase tracking-[0.08em] text-violet">{t("home.companies.eyebrow")}</p>
          <h2 className="mt-2 text-2xl font-bold">{t("home.companies.t")}</h2>
          <p className="mt-3 text-muted">{t("home.companies.b")}</p>
          <ButtonLink href="/signup?as=company" variant="violet" className="mt-5">{t("home.companies.cta")}</ButtonLink>
        </div>
        <div className="bg-white p-8 md:p-10">
          <p className="mono text-[12px] uppercase tracking-[0.08em] text-cyan">{t("home.trainers.eyebrow")}</p>
          <h2 className="mt-2 text-2xl font-bold">{t("home.trainers.t")}</h2>
          <p className="mt-3 text-muted">{t("home.trainers.b")}</p>
          <ButtonLink href="/signup" className="mt-5">{t("home.trainers.cta")}</ButtonLink>
        </div>
      </section>
    </div>
  );
}
