import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { withdrawApplication } from "@/lib/actions/requirements";
import { startConversation } from "@/lib/actions/network";
import { Badge, Button, ButtonLink, Empty, PageHeader } from "@/components/ui";
import { appStatusLabel, fmtDate, rateRange, timeAgo } from "@/lib/utils";

export const metadata = { title: "My applications" };

export default async function ApplicationsPage() {
  const user = await requireUser("/dashboard/applications");
  if (!user.trainerProfile) redirect("/dashboard");
  const apps = await db.application.findMany({ where: { trainerId: user.trainerProfile.id }, include: { requirement: { include: { company: { select: { name: true, slug: true } }, postedBy: { select: { id: true, name: true } } } } }, orderBy: { createdAt: "desc" } });
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const used = apps.filter((a) => a.createdAt >= monthStart).length;
  const limit = Number((await db.setting.findUnique({ where: { key: "free_applications_per_month" } }))?.value ?? 5);

  return (
    <div>
      <PageHeader eyebrow="Trainer" title="My applications" body={`Free plan: ${used} of ${limit} applications used this month.`} actions={<ButtonLink href="/requirements" variant="secondary">Find requirements</ButtonLink>} />
      {apps.length ? (
        <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
          {apps.map((a) => (
            <div key={a.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_auto_auto] md:items-center">
              <div className="min-w-0">
                <Link href={`/requirements/${a.requirementId}`} className="block truncate font-medium hover:text-cyan">{a.requirement.title}</Link>
                <p className="text-xs text-muted"><Link href={`/companies/${a.requirement.company.slug}`} className="hover:text-ink">{a.requirement.company.name}</Link> · starts {fmtDate(a.requirement.startDate)} · proposed {rateRange(a.proposedRate, null, a.requirement.currency)} · sent {timeAgo(a.createdAt)}</p>
                {a.declineReason ? <p className="mt-1 text-xs text-muted">“{a.declineReason}”</p> : null}
              </div>
              <Badge tone={a.status === "AWARDED" ? "lime" : a.status === "SHORTLISTED" ? "amber" : a.status === "DECLINED" ? "rose" : a.status === "WITHDRAWN" ? "neutral" : "cyan"}>{appStatusLabel[a.status]}</Badge>
              <div className="flex gap-2">
                <form action={startConversation}><input type="hidden" name="userId" value={a.requirement.postedBy.id} /><input type="hidden" name="requirementId" value={a.requirementId} /><Button variant="secondary" size="sm">Message</Button></form>
                {["APPLIED", "SHORTLISTED"].includes(a.status) ? <form action={withdrawApplication}><input type="hidden" name="id" value={a.id} /><Button variant="ghost" size="sm" className="text-rose">Withdraw</Button></form> : null}
              </div>
            </div>
          ))}
        </div>
      ) : <Empty title="You haven't applied to anything yet" body="Browse open requirements that match your skills." action={<ButtonLink href="/requirements" size="sm">Browse requirements</ButtonLink>} />}
    </div>
  );
}
