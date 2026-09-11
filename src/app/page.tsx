import Link from "next/link";
import { ArrowRight, BadgeCheck, MessageSquareText, Radar, ShieldCheck } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ButtonLink } from "@/components/ui";
import { RequirementCard, TrainerCard } from "@/components/cards";

export default async function Home() {
  const user = await getCurrentUser();
  const [trainers, requirements, counts] = await Promise.all([
    db.trainerProfile.findMany({ where: { verifiedAt: { not: null } }, include: { user: { select: { name: true, avatarUrl: true } }, skills: true }, orderBy: { createdAt: "asc" }, take: 4 }),
    db.requirement.findMany({ where: { visibility: "PUBLIC", status: { in: ["OPEN", "SHORTLISTING"] } }, include: { company: { select: { name: true, slug: true, type: true, logoUrl: true, domainVerifiedAt: true } }, skills: true, _count: { select: { applications: true, comments: true } } }, orderBy: { createdAt: "desc" }, take: 3 }),
    Promise.all([db.trainerProfile.count(), db.company.count(), db.requirement.count({ where: { status: { in: ["OPEN", "SHORTLISTING"] } } }), db.certification.count({ where: { status: "VERIFIED" } })]),
  ]);
  const [nT, nC, nR, nV] = counts;
  const showRate = user?.role === "COMPANY" || user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  return (
    <div className="space-y-20">
      <section className="pt-6 md:pt-14">
        <p className="mono mb-4 inline-flex items-center gap-2 rounded-full border border-cyan/30 bg-cyan/5 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-cyan">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan" /> The network for freelance corporate trainers
        </p>
        <h1 className="max-w-4xl text-4xl font-bold leading-[1.05] md:text-6xl">
          Where companies find <span className="gradient-text">verified trainers</span>, and trainers find their next batch.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted">
          Post a requirement with dates, mode and participants. Trainers ask questions in the open, apply with a rate, and get shortlisted. Every profile carries platform-verified certifications and ratings from real engagements.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/signup?as=company" variant="violet" size="lg">Post a requirement <ArrowRight size={16} /></ButtonLink>
          <ButtonLink href="/signup" size="lg">Join as a trainer</ButtonLink>
          <ButtonLink href="/trainers" variant="outline" size="lg">Browse trainers</ButtonLink>
        </div>
        <dl className="mt-12 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
          {[["Trainers", nT, "text-cyan"], ["Companies", nC, "text-[#b79cff]"], ["Open requirements", nR, "text-amber"], ["Verified certs", nV, "text-lime"]].map(([l, v, c]) => (
            <div key={String(l)} className="bg-surface px-5 py-4">
              <dt className="mono text-[11px] uppercase tracking-[0.12em] text-muted">{l}</dt>
              <dd className={`mt-1 font-display text-3xl font-bold tabular-nums ${c}`}>{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          { icon: <Radar size={20} />, t: "Requirements, not job posts", b: "Dates, delivery mode, participants, budget and language up front. Trainers see fit in five seconds." },
          { icon: <MessageSquareText size={20} />, t: "Ask in the open", b: "Clarifying questions are public comments. The company answers once, everyone benefits, and the best fit shows before anyone applies." },
          { icon: <BadgeCheck size={20} />, t: "Verified, not self-declared", b: "Certifications are reviewed by CorpGurus staff. Company email domains are verified. Badges mean something." },
          { icon: <ShieldCheck size={20} />, t: "Reputation that compounds", b: "Both sides rate each other after every completed engagement. Your history travels with you." },
        ].map((f) => (
          <div key={f.t} className="rounded-2xl border border-line bg-surface/60 p-5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-cyan/10 text-cyan">{f.icon}</span>
            <h3 className="mt-3 font-semibold">{f.t}</h3>
            <p className="mt-1 text-sm text-muted">{f.b}</p>
          </div>
        ))}
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between">
          <div><p className="mono text-[11px] uppercase tracking-[0.14em] text-violet">Live now</p><h2 className="text-2xl font-bold">Open requirements</h2></div>
          <Link href="/requirements" className="text-sm text-muted hover:text-ink">All requirements →</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">{requirements.map((r) => <RequirementCard key={r.id} r={r} />)}</div>
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between">
          <div><p className="mono text-[11px] uppercase tracking-[0.14em] text-cyan">Verified</p><h2 className="text-2xl font-bold">Trainers companies keep rebooking</h2></div>
          <Link href="/trainers" className="text-sm text-muted hover:text-ink">Browse all →</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{trainers.map((t) => <TrainerCard key={t.id} t={t} showRate={!!showRate} />)}</div>
      </section>

      <section className="relative overflow-hidden rounded-3xl border border-line bg-surface p-8 md:p-12">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-violet/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-cyan/15 blur-3xl" />
        <div className="relative grid gap-8 md:grid-cols-2">
          <div>
            <p className="mono text-[11px] uppercase tracking-[0.14em] text-violet">For training partners</p>
            <h2 className="mt-2 text-2xl font-bold">Staff 300 batches a year from a bench you trust.</h2>
            <p className="mt-3 text-muted">Invite-only requirements for repeat clients, saved shortlists, and a team of recruiters on one company page.</p>
            <ButtonLink href="/signup?as=company" variant="violet" className="mt-5">Create a partner account</ButtonLink>
          </div>
          <div>
            <p className="mono text-[11px] uppercase tracking-[0.14em] text-cyan">For trainers</p>
            <h2 className="mt-2 text-2xl font-bold">Your certifications, verified. Your rate, respected.</h2>
            <p className="mt-3 text-muted">Day rates are visible only to signed-in companies. Apply with a proposed rate, and get told promptly when a batch is awarded.</p>
            <ButtonLink href="/signup" className="mt-5">Build your profile</ButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}
