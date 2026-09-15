import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { db } from "@/lib/db";
import { isStaff, requireUser } from "@/lib/auth";
import { memberCan } from "@/lib/permissions";
import { deliveryRecords } from "@/lib/delivery";
import { addParticipants, removeParticipant, saveAttendance } from "@/lib/actions/attendance";
import { ActionForm, SubmitButton } from "@/components/form-bits";
import { Alert, Button, Card, Field, PageHeader, Select, Stat, Textarea } from "@/components/ui";
import { fmtDate } from "@/lib/utils";

export const metadata = { title: "Attendance" };
const short = (iso: string) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(new Date(iso));

export default async function AttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/requirements/${id}/work-order/attendance`);
  const wo = await db.workOrder.findUnique({ where: { requirementId: id }, include: { company: { include: { members: { select: { userId: true, role: true } } } }, trainer: { select: { userId: true } }, requirement: { select: { title: true } } } });
  if (!wo) notFound();
  const isTrainer = wo.trainer.userId === user.id;
  const isMember = memberCan(wo.company.members, user.id, "view");
  if (!isTrainer && !isMember && !isStaff(user)) notFound();
  const rec = (await deliveryRecords(wo.id))!;
  const canEdit = isTrainer || memberCan(wo.company.members, user.id, "hire");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center gap-3"><Link href={`/requirements/${id}/work-order`} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft size={15} /> Work order</Link></div>
      <PageHeader eyebrow={wo.company.name} title="Attendance and delivery records" body={`${wo.title} · ${wo.days} day${wo.days > 1 ? "s" : ""} · ${wo.participants} participants planned. Add the roster, tick who attended each day, then attach the summary to the invoice.`} actions={<Link href={`/api/export/attendance/${wo.id}`} prefetch={false} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line-2 bg-white px-3.5 font-display text-[13px] font-semibold hover:bg-surface-2"><Download size={14} /> attendance.csv</Link>} />
      {wo.status !== "ACCEPTED" ? <Alert tone="amber">The work order is {wo.status.toLowerCase().replace("_", " ")}. Records can still be viewed but the engagement is not confirmed.</Alert> : null}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Roster" value={`${rec.roster.length} / ${wo.participants}`} /><Stat label="Attendance" value={rec.attendancePct != null ? `${rec.attendancePct}%` : "—"} tone={rec.attendancePct != null && rec.attendancePct >= 80 ? "lime" : "amber"} /><Stat label="Feedback" value={rec.feedbackAvg != null ? `${rec.feedbackAvg} / 5` : "—"} tone="violet" /><Stat label="Would recommend" value={rec.recommendPct != null ? `${rec.recommendPct}%` : "—"} tone="lime" />
      </div>

      {canEdit ? (
        <Card className="p-6">
          <h2 className="text-lg font-bold">Add participants</h2>
          <p className="mt-1 text-sm text-muted">One per line: <span className="mono text-xs">Name, email, employee id</span>. Email and employee id are optional. Paste straight from a spreadsheet.</p>
          <ActionForm action={addParticipants} className="mt-3 grid gap-3 md:grid-cols-[1fr_220px_auto] md:items-end" resetOnSuccess>
            <input type="hidden" name="workOrderId" value={wo.id} />
            <Field label="Participants"><Textarea name="participants" className="min-h-24" placeholder={"Asha Rao, asha@client.com, E1042\nRahim Khan, rahim@client.com"} required /></Field>
            {rec.wo.batches.length ? <Field label="Batch"><Select name="batchId" defaultValue=""><option value="">Whole engagement</option>{rec.wo.batches.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}</Select></Field> : <div />}
            <SubmitButton size="sm" pendingText="Adding…">Add to roster</SubmitButton>
          </ActionForm>
        </Card>
      ) : null}

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-bold">Attendance register</h2><p className="text-sm text-muted">{rec.dates.length} training day{rec.dates.length === 1 ? "" : "s"} · {fmtDate(wo.startDate)} to {fmtDate(wo.endDate)}</p></div>
        {rec.roster.length ? (
          <ActionForm action={saveAttendance} className="mt-4">
            <input type="hidden" name="workOrderId" value={wo.id} />
            <input type="hidden" name="dates" value={rec.dates.join(",")} />
            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full text-sm">
                <thead><tr className="mono bg-surface-2 text-left text-[11px] uppercase tracking-wider text-muted"><th className="px-3 py-2">Participant</th>{rec.wo.batches.length ? <th className="px-3 py-2">Batch</th> : null}{rec.dates.map((d) => <th key={d} className="px-2 py-2 text-center">{short(d)}</th>)}<th className="px-3 py-2 text-right">Present</th>{canEdit ? <th /> : null}</tr></thead>
                <tbody className="divide-y divide-line">
                  {rec.roster.map((p) => { const byDate = new Map(p.attendance.map((a) => [a.date.toISOString().slice(0, 10), a.present])); const present = [...byDate.values()].filter(Boolean).length; return (
                    <tr key={p.id} className="hover:bg-surface-2/60">
                      <td className="px-3 py-2"><p className="font-medium">{p.name}</p><p className="text-xs text-muted">{[p.email, p.employeeId].filter(Boolean).join(" · ")}</p></td>
                      {rec.wo.batches.length ? <td className="px-3 py-2 text-muted">{p.batch?.label ?? "—"}</td> : null}
                      {rec.dates.map((d) => <td key={d} className="px-2 py-2 text-center"><input type="checkbox" name="att" value={`${p.id}|${d}`} defaultChecked={byDate.get(d) === true} disabled={!canEdit} aria-label={`${p.name} on ${short(d)}`} className="h-4 w-4 accent-cyan" /></td>)}
                      <td className="px-3 py-2 text-right tabular-nums">{present} / {rec.dates.length}</td>
                      {canEdit ? <td className="px-2 py-2 text-right"><button type="submit" formAction={removeParticipant.bind(null, p.id)} className="text-xs text-dim hover:text-rose">Remove</button></td> : null}
                    </tr>
                  ); })}
                </tbody>
              </table>
            </div>
            {canEdit ? <div className="mt-3 flex items-center gap-3"><SubmitButton size="sm" pendingText="Saving…">Save attendance</SubmitButton><span className="text-xs text-muted">Ticked = present. Unticked cells are recorded as absent when you save.</span></div> : null}
          </ActionForm>
        ) : <p className="mt-2 text-sm text-muted">No participants yet.{canEdit ? " Add the roster above." : ""}</p>}
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-bold">Learner feedback and certificates</h2>
        <p className="mt-1 text-sm text-muted">{rec.feedbackCount ? `${rec.feedbackCount} anonymous responses, average ${rec.feedbackAvg} / 5, ${rec.recommendPct}% would recommend.` : "No feedback yet."} The feedback link and completion certificates are managed on the <Link href={`/requirements/${id}`} className="text-cyan underline">requirement page</Link>. Attendance, feedback and certificate counts are summarised on the invoice for this engagement.</p>
        {canEdit ? <div className="mt-3"><Link href={`/requirements/${id}`}><Button size="sm" variant="secondary">Open requirement page</Button></Link></div> : null}
      </Card>
    </div>
  );
}
