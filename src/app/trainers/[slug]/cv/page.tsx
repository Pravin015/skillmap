import { notFound } from "next/navigation";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { trainerBadges } from "@/lib/badges";
import { learnerScore } from "@/lib/stats";
import { appUrl } from "@/lib/oauth";
import { BadgeRow } from "@/components/badges";
import { PrintButton } from "@/components/print-button";
import { CopyButton } from "@/components/copy-button";
import { Logo } from "@/components/shell";
import { fmtDate, modeLabel, rateRange } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = await db.trainerProfile.findUnique({ where: { slug }, select: { user: { select: { name: true } } } });
  return { title: t ? `${t.user.name} · CV` : "CV" };
}

/** One-page, print-ready trainer CV. Public at /trainers/<slug>/cv; rates only for signed-in companies. */
export default async function TrainerCvPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const t = await db.trainerProfile.findUnique({
    where: { slug },
    include: {
      user: { select: { id: true, name: true, email: true, avatarUrl: true, status: true, ratingsReceived: { select: { score: true } } } },
      skills: { include: { category: { select: { name: true } } }, orderBy: { name: "asc" } },
      certifications: { where: { status: "VERIFIED" }, orderBy: { issuedOn: "desc" } },
      courses: { where: { published: true }, orderBy: { createdAt: "desc" } },
      applications: { where: { status: "AWARDED" }, include: { requirement: { include: { company: { select: { name: true } } } } }, orderBy: { createdAt: "desc" }, take: 8 },
      recommendations: { where: { visible: true }, include: { author: { select: { name: true, memberships: { select: { company: { select: { name: true } } } } } } }, orderBy: { createdAt: "desc" }, take: 2 },
    },
  });
  if (!t || t.user.status !== "ACTIVE") notFound();
  const [badges, learners] = await Promise.all([trainerBadges(t.id), learnerScore(t.id)]);
  const showRate = !!user && user.role !== "TRAINER";
  const ratings = t.user.ratingsReceived;
  const avg = ratings.length ? ratings.reduce((a, r) => a + r.score, 0) / ratings.length : null;
  const byCat = new Map<string, string[]>();
  for (const s of t.skills) { const k = s.category?.name ?? "Other"; byCat.set(k, [...(byCat.get(k) ?? []), s.name]); }
  const url = `${appUrl()}/trainers/${slug}`;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center gap-2 print:hidden">
        <Link href={`/trainers/${slug}`} className="text-sm text-muted hover:text-ink">← Profile</Link>
        <span className="ml-auto" /><PrintButton /><CopyButton text={`${url}/cv`} label="Copy CV link" />
      </div>
      <article className="rounded-2xl border border-line bg-white p-8 print:border-0 print:p-0 md:p-10">
        <header className="flex items-start gap-5 border-b-2 border-navy pb-5">
          {t.user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={t.user.avatarUrl} alt="" className="h-20 w-20 rounded-full object-cover" />
          ) : null}
          <div className="min-w-0 flex-1">
            <h1 className="flex flex-wrap items-center gap-2 text-3xl font-bold text-navy">{t.user.name}{t.verifiedAt ? <BadgeCheck className="text-cyan" size={22} /> : null}</h1>
            <p className="mt-1 text-lg text-muted">{t.headline}</p>
            <p className="mt-2 text-sm text-muted">{t.cities.join(", ")} · {t.yearsExperience} years · {t.languages.join(", ")} · {t.deliveryModes.map((m) => modeLabel[m]).join(", ")}</p>
            <BadgeRow badges={badges} className="mt-3" />
          </div>
          <div className="hidden text-right print:block"><Logo /><p className="mt-1 text-[11px] text-muted">{url.replace(/^https?:\/\//, "")}</p></div>
        </header>

        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg bg-surface-2 py-3"><p className="font-display text-2xl font-bold text-amber">{avg ? avg.toFixed(1) : "—"}</p><p className="text-[11px] text-muted">client rating{ratings.length ? ` · ${ratings.length}` : ""}</p></div>
          <div className="rounded-lg bg-surface-2 py-3"><p className="font-display text-2xl font-bold text-lime">{learners.count ? learners.avg!.toFixed(1) : "—"}</p><p className="text-[11px] text-muted">learner score{learners.count ? ` · ${learners.count} participants` : ""}</p></div>
          <div className="rounded-lg bg-surface-2 py-3"><p className="font-display text-2xl font-bold text-cyan">{t.applications.length}</p><p className="text-[11px] text-muted">engagements via CorpGurus</p></div>
        </div>

        {t.bio ? <section className="mt-6"><h2 className="mono text-[11px] uppercase tracking-[0.12em] text-cyan">Profile</h2><p className="mt-1 whitespace-pre-line text-[15px] leading-relaxed">{t.bio}</p></section> : null}

        <section className="mt-6"><h2 className="mono text-[11px] uppercase tracking-[0.12em] text-cyan">Skills</h2>
          <dl className="mt-1 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">{[...byCat.entries()].map(([k, v]) => <div key={k}><dt className="font-semibold">{k}</dt><dd className="text-muted">{v.join(", ")}</dd></div>)}</dl>
        </section>

        {t.certifications.length ? <section className="mt-6"><h2 className="mono text-[11px] uppercase tracking-[0.12em] text-cyan">Verified certifications</h2><ul className="mt-1 space-y-0.5 text-sm">{t.certifications.map((c) => <li key={c.id}><span className="font-semibold">{c.name}</span> · {c.issuer}{c.issuedOn ? ` · ${fmtDate(c.issuedOn)}` : ""}{c.credentialId ? <span className="mono text-xs text-muted"> · {c.credentialId}</span> : null}</li>)}</ul></section> : null}

        {t.courses.length ? <section className="mt-6"><h2 className="mono text-[11px] uppercase tracking-[0.12em] text-cyan">Courses delivered</h2><ul className="mt-1 space-y-1 text-sm">{t.courses.map((c) => <li key={c.id}><span className="font-semibold">{c.title}</span> <span className="text-muted">· {c.durationDays} day{c.durationDays > 1 ? "s" : ""} · {c.level.toLowerCase()}</span><br /><span className="text-muted">{c.summary}</span></li>)}</ul></section> : null}

        {t.applications.length ? <section className="mt-6"><h2 className="mono text-[11px] uppercase tracking-[0.12em] text-cyan">Recent engagements</h2><ul className="mt-1 space-y-0.5 text-sm">{t.applications.map((a) => <li key={a.id}><span className="font-semibold">{a.requirement.title}</span> <span className="text-muted">· {a.requirement.company.name} · {a.requirement.participants} participants · {fmtDate(a.requirement.startDate)}</span></li>)}</ul></section> : null}

        {t.recommendations.length ? <section className="mt-6"><h2 className="mono text-[11px] uppercase tracking-[0.12em] text-cyan">Recommendations</h2>{t.recommendations.map((r) => <blockquote key={r.id} className="mt-2 border-l-2 border-line pl-3 text-sm"><p className="italic">“{r.body.length > 280 ? r.body.slice(0, 277) + "…" : r.body}”</p><p className="mt-1 text-xs text-muted">{r.author.name}{r.author.memberships[0] ? `, ${r.author.memberships[0].company.name}` : ""}</p></blockquote>)}</section> : null}

        <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-xs text-muted">
          <p>{showRate ? `Day rate ${rateRange(t.dayRateMin, t.dayRateMax, t.currency)} · ` : ""}Contact through CorpGurus: {url.replace(/^https?:\/\//, "")}</p>
          <p>Generated {fmtDate(new Date())} · verified data from CorpGurus</p>
        </footer>
      </article>
    </div>
  );
}
