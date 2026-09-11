import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BadgeCheck, MapPin } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { decideApplication } from "@/lib/actions/requirements";
import { startConversation } from "@/lib/actions/network";
import { Avatar, Badge, Button, ButtonLink, Chip, Empty, Input, PageHeader } from "@/components/ui";
import { reqTone } from "@/components/cards";
import { appStatusLabel, dateRange, modeLabel, rateRange, reqStatusLabel, timeAgo } from "@/lib/utils";

export const metadata = { title: "Applicants" };

export default async function ApplicantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  if (!user.membership) redirect("/dashboard");
  const r = await db.requirement.findFirst({
    where: { id, companyId: user.membership.company.id },
    include: {
      skills: true,
      applications: { include: { trainer: { include: { user: { select: { id: true, name: true, avatarUrl: true } }, skills: true, certifications: { where: { status: "VERIFIED" } }, _count: { select: { applications: { where: { status: "AWARDED" } } } } } } }, orderBy: [{ status: "asc" }, { createdAt: "asc" }] },
    },
  });
  if (!r) notFound();
  const ratings = await db.rating.groupBy({ by: ["toUserId"], _avg: { score: true }, _count: true, where: { toUserId: { in: r.applications.map((a) => a.trainer.user.id) } } });
  const avg = new Map(ratings.map((x) => [x.toUserId, x]));
  const order = { AWARDED: 0, SHORTLISTED: 1, APPLIED: 2, DECLINED: 3, WITHDRAWN: 4 } as const;
  const apps = [...r.applications].sort((a, b) => order[a.status] - order[b.status]);
  const reqSkills = new Set(r.skills.map((s) => s.id));

  return (
    <div>
      <PageHeader eyebrow="Applicants" title={r.title} body={`${dateRange(r.startDate, r.endDate)} · ${r.mode === "VIRTUAL" ? "Virtual" : `${modeLabel[r.mode]} · ${r.city}`} · ${r.participants} participants · budget ${rateRange(r.budgetMin, r.budgetMax, r.currency)}`}
        actions={<><Badge tone={reqTone[r.status]} className="self-center">{reqStatusLabel[r.status]}</Badge><ButtonLink href={`/requirements/${r.id}`} variant="secondary">View requirement</ButtonLink></>} />
      {apps.length ? (
        <div className="space-y-4">
          {apps.map((a) => {
            const t = a.trainer; const rt = avg.get(t.user.id); const matched = t.skills.filter((s) => reqSkills.has(s.id)).length;
            const dim = a.status === "DECLINED" || a.status === "WITHDRAWN";
            return (
              <div key={a.id} className={`rounded-2xl border p-5 ${a.status === "AWARDED" ? "border-lime/40 bg-lime/5" : a.status === "SHORTLISTED" ? "border-amber/40 bg-surface/70" : "border-line bg-surface/70"} ${dim ? "opacity-60" : ""}`}>
                <div className="flex flex-wrap items-start gap-4">
                  <Avatar name={t.user.name} src={t.user.avatarUrl} size={56} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/trainers/${t.slug}`} className="flex items-center gap-1.5 font-display text-lg font-semibold hover:text-cyan">{t.user.name}{t.verifiedAt ? <BadgeCheck size={16} className="text-cyan" /> : null}</Link>
                      <Badge tone={a.status === "AWARDED" ? "lime" : a.status === "SHORTLISTED" ? "amber" : dim ? "neutral" : "cyan"}>{appStatusLabel[a.status]}</Badge>
                      <span className="text-xs text-dim">applied {timeAgo(a.createdAt)}</span>
                    </div>
                    <p className="text-sm text-muted">{t.headline}</p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                      <span className="flex items-center gap-1"><MapPin size={12} />{t.cities.join(", ") || "Flexible"}</span>
                      <span>{t.yearsExperience} yrs</span>
                      <span>{t.certifications.length} verified cert{t.certifications.length === 1 ? "" : "s"}</span>
                      <span>{t._count.applications} awarded on CorpGurus</span>
                      {rt?._avg.score ? <span className="text-amber">★ {rt._avg.score.toFixed(1)} ({rt._count})</span> : null}
                      <span className="text-cyan">{matched}/{r.skills.length} skills match</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">{t.skills.map((s) => <Chip key={s.id} className={reqSkills.has(s.id) ? "border-cyan/50 text-cyan" : ""}>{s.name}</Chip>)}</div>
                    <blockquote className="mt-3 rounded-lg border-l-2 border-cyan/50 bg-bg-2/60 px-4 py-3 text-[15px] leading-relaxed text-ink/90">{a.coverNote}</blockquote>
                    <p className="mono mt-2 text-sm text-cyan">Proposed {rateRange(a.proposedRate, null, r.currency)}<span className="text-dim"> · profile {rateRange(t.dayRateMin, t.dayRateMax, t.currency)}</span></p>
                    {a.declineReason ? <p className="mt-1 text-xs text-muted">Reason sent: “{a.declineReason}”</p> : null}
                  </div>
                </div>
                {!dim && r.status !== "COMPLETED" && r.status !== "CANCELLED" ? (
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
                    <form action={startConversation}><input type="hidden" name="userId" value={t.user.id} /><input type="hidden" name="requirementId" value={r.id} /><Button variant="secondary" size="sm">Message</Button></form>
                    {a.status === "APPLIED" ? <Decide id={a.id} to="SHORTLISTED" label="Shortlist" variant="secondary" /> : null}
                    {a.status !== "AWARDED" && r.status !== "AWARDED" ? <Decide id={a.id} to="AWARDED" label="Award engagement" variant="primary" /> : null}
                    {a.status === "SHORTLISTED" ? <Decide id={a.id} to="APPLIED" label="Remove from shortlist" variant="ghost" /> : null}
                    {a.status !== "AWARDED" ? (
                      <form action={decideApplication} className="ml-auto flex gap-2"><input type="hidden" name="id" value={a.id} /><input type="hidden" name="decision" value="DECLINED" /><Input name="reason" placeholder="Reason (sent to trainer, optional)" className="h-8 w-64 py-1 text-xs" /><Button variant="danger" size="sm">Decline</Button></form>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : <Empty title="No applications yet" body="Matching trainers were notified when you posted. You can also invite trainers directly from their profile." action={<ButtonLink href="/trainers" variant="secondary" size="sm">Find trainers to invite</ButtonLink>} />}
    </div>
  );
}

function Decide({ id, to, label, variant }: { id: string; to: string; label: string; variant: "primary" | "secondary" | "ghost" }) {
  return <form action={decideApplication}><input type="hidden" name="id" value={id} /><input type="hidden" name="decision" value={to} /><Button variant={variant} size="sm">{label}</Button></form>;
}
