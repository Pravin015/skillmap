import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { addLearningStep, deleteLearningPath, deleteLearningStep, moveLearningStep, unlinkLearningStep, updateLearningPath } from "@/lib/actions/learning-paths";
import { ActionForm, SubmitButton } from "@/components/form-bits";
import { Badge, Button, ButtonLink, Card, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { SkillPicker } from "@/components/skill-picker";
import { dateRange, fmtDate } from "@/lib/utils";
import { stepLabel, stepState, stepTone } from "@/lib/learning-paths";

export const metadata = { title: "Learning path" };

export default async function LearningPathPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/dashboard/learning-paths/${id}`);
  if (!user.membership) redirect("/dashboard");
  const [path, skills] = await Promise.all([
    db.learningPath.findFirst({ where: { id, companyId: user.membership.company.id }, include: { steps: { include: { requirement: { select: { id: true, status: true, startDate: true, endDate: true, _count: { select: { applications: true } }, applications: { where: { status: "AWARDED" }, select: { trainer: { select: { slug: true, user: { select: { name: true } } } } } } } } }, orderBy: { position: "asc" } } } }),
    db.skill.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!path) notFound();
  const done = path.steps.filter((s) => stepState(s) === "done").length;
  const pct = path.steps.length ? Math.round((done / path.steps.length) * 100) : 0;
  const totalDays = path.steps.reduce((n, s) => n + s.days, 0);
  const iso = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader eyebrow="Learning path" title={path.title} body={path.description || undefined} actions={<ButtonLink href="/dashboard/learning-paths" variant="ghost" size="sm">← All paths</ButtonLink>} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4"><p className="mono text-[11px] uppercase tracking-wider text-muted">Progress</p><p className="font-display text-2xl font-bold">{pct}%</p><div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2"><div className="h-full bg-lime" style={{ width: `${pct}%` }} /></div></Card>
        <Card className="p-4"><p className="mono text-[11px] uppercase tracking-wider text-muted">Steps</p><p className="font-display text-2xl font-bold">{path.steps.length}</p><p className="text-xs text-muted">{totalDays} training day{totalDays === 1 ? "" : "s"} in total</p></Card>
        <Card className="p-4"><p className="mono text-[11px] uppercase tracking-wider text-muted">Audience</p><p className="font-display text-lg font-bold">{path.audience ?? "—"}</p><p className="text-xs text-muted">{path.targetDate ? `Target ${fmtDate(path.targetDate)}` : "No target date"}</p></Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-bold">Steps</h2>
        {path.steps.length ? (
          <ol className="mt-4 space-y-3">{path.steps.map((s, i) => {
            const st = stepState(s);
            const awardedTo = s.requirement?.applications[0]?.trainer;
            return (
              <li key={s.id} className="flex gap-4 rounded-xl border border-line p-4">
                <div className="flex flex-col items-center gap-1">
                  <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full font-display text-sm font-bold ${st === "done" ? "bg-lime text-white" : st === "planned" ? "bg-surface-2 text-muted" : "bg-violet text-white"}`}>{i + 1}</span>
                  <form action={moveLearningStep}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="dir" value="up" /><button aria-label="Move up" disabled={i === 0} className="rounded p-1 text-muted hover:text-ink disabled:opacity-30"><ArrowUp size={13} /></button></form>
                  <form action={moveLearningStep}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="dir" value="down" /><button aria-label="Move down" disabled={i === path.steps.length - 1} className="rounded p-1 text-muted hover:text-ink disabled:opacity-30"><ArrowDown size={13} /></button></form>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><p className="font-display font-semibold">{s.title}</p><Badge tone={stepTone[st]}>{stepLabel[st]}</Badge></div>
                  <p className="text-sm text-muted">{s.days} day{s.days === 1 ? "" : "s"} · {s.participants} participants{s.skills.length ? ` · ${s.skills.join(", ")}` : ""}</p>
                  {s.description ? <p className="mt-1 whitespace-pre-line text-sm text-ink/90">{s.description}</p> : null}
                  {s.requirement ? (
                    <p className="mt-2 text-sm"><Link href={`/requirements/${s.requirement.id}`} className="font-medium text-cyan hover:underline">Open requirement →</Link> <span className="text-muted">{dateRange(s.requirement.startDate, s.requirement.endDate)} · {s.requirement._count.applications} applicant{s.requirement._count.applications === 1 ? "" : "s"}{awardedTo ? <> · awarded to <Link href={`/trainers/${awardedTo.slug}`} className="hover:text-cyan">{awardedTo.user.name}</Link></> : null}</span></p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {!s.requirement || st === "cancelled" ? <ButtonLink href={`/requirements/new?step=${s.id}`} variant="violet" size="sm">Post as requirement</ButtonLink> : null}
                    {s.requirement ? <form action={unlinkLearningStep}><input type="hidden" name="id" value={s.id} /><Button variant="ghost" size="sm">Unlink</Button></form> : null}
                    <form action={deleteLearningStep}><input type="hidden" name="id" value={s.id} /><Button variant="ghost" size="sm" className="text-rose"><Trash2 size={13} /> Remove</Button></form>
                  </div>
                </div>
              </li>
            );
          })}</ol>
        ) : <p className="mt-2 text-sm text-muted">No steps yet. Add the first training below.</p>}
        <div className="mt-6 border-t border-line pt-5">
          <h3 className="font-display font-semibold">Add a step</h3>
          <ActionForm action={addLearningStep} className="mt-3 grid gap-4 md:grid-cols-4" resetOnSuccess>
            <input type="hidden" name="pathId" value={path.id} />
            <Field label="Title" className="md:col-span-2"><Input name="title" required placeholder="Kubernetes fundamentals · 3 days" /></Field>
            <Field label="Days"><Input name="days" type="number" min={1} max={60} defaultValue={2} /></Field>
            <Field label="Participants"><Input name="participants" type="number" min={1} defaultValue={path.audience?.match(/\d+/)?.[0] ?? 12} /></Field>
            <Field label="Outcome" className="md:col-span-4"><Textarea name="description" className="min-h-16" placeholder="What participants should be able to do after this step." /></Field>
            <div className="md:col-span-4"><SkillPicker skills={skills} name="skills" label="Skills" /></div>
            <div className="md:col-span-4"><SubmitButton variant="violet" size="sm" pendingText="Adding…">Add step</SubmitButton></div>
          </ActionForm>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-bold">Path details</h2>
        <ActionForm action={updateLearningPath} className="mt-4 grid gap-4 md:grid-cols-2">
          <input type="hidden" name="id" value={path.id} />
          <Field label="Title" className="md:col-span-2"><Input name="title" required defaultValue={path.title} /></Field>
          <Field label="Audience"><Input name="audience" defaultValue={path.audience ?? ""} /></Field>
          <Field label="Target completion"><Input name="targetDate" type="date" defaultValue={iso(path.targetDate)} /></Field>
          <Field label="Goal" className="md:col-span-2"><Textarea name="description" className="min-h-20" defaultValue={path.description} /></Field>
          <label className="flex items-center gap-2 text-sm md:col-span-2"><input type="checkbox" name="archived" value="1" defaultChecked={path.archived} className="accent-violet" /> Archived (hidden from the main list)</label>
          <div className="flex flex-wrap items-center gap-2 md:col-span-2"><SubmitButton pendingText="Saving…">Save</SubmitButton></div>
        </ActionForm>
        <form action={deleteLearningPath} className="mt-4 border-t border-line pt-4"><input type="hidden" name="id" value={path.id} /><Button variant="danger" size="sm">Delete path</Button><span className="ml-2 text-xs text-muted">Requirements already posted are kept.</span></form>
      </Card>
    </div>
  );
}
