import Link from "next/link";
import { redirect } from "next/navigation";
import { Route } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { createLearningPath } from "@/lib/actions/learning-paths";
import { ActionForm, SubmitButton } from "@/components/form-bits";
import { Badge, ButtonLink, Card, Empty, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { fmtDate } from "@/lib/utils";
import { stepState } from "@/lib/learning-paths";

export const metadata = { title: "Learning paths" };

/** Company view: multi-training programmes for one audience, each step becoming a requirement when it is time to hire. */
export default async function LearningPathsPage() {
  const user = await requireUser("/dashboard/learning-paths");
  if (!user.membership) redirect("/dashboard");
  const paths = await db.learningPath.findMany({ where: { companyId: user.membership.company.id }, include: { steps: { include: { requirement: { select: { status: true } } }, orderBy: { position: "asc" } } }, orderBy: [{ archived: "asc" }, { updatedAt: "desc" }] });
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader eyebrow={user.membership.company.name} title="Learning paths" body="Plan a sequence of trainings for one audience, then post each step as a requirement when it is time to hire. Progress rolls up as engagements complete." actions={<ButtonLink href="/dashboard" variant="ghost" size="sm">← Dashboard</ButtonLink>} />
      <Card className="p-6">
        <h2 className="text-lg font-bold">New learning path</h2>
        <ActionForm action={createLearningPath} className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Title" className="md:col-span-2"><Input name="title" required placeholder="Platform engineering onboarding · 2026 cohort" /></Field>
          <Field label="Audience"><Input name="audience" placeholder="12 new SREs, Bengaluru" /></Field>
          <Field label="Target completion"><Input name="targetDate" type="date" /></Field>
          <Field label="Goal" className="md:col-span-2"><Textarea name="description" className="min-h-20" placeholder="What the audience should be able to do at the end of the path." /></Field>
          <div className="md:col-span-2"><SubmitButton variant="violet" pendingText="Creating…">Create path</SubmitButton></div>
        </ActionForm>
      </Card>
      {paths.length ? (
        <ul className="grid gap-4 md:grid-cols-2">{paths.map((p) => {
          const done = p.steps.filter((s) => stepState(s) === "done").length;
          const posted = p.steps.filter((s) => s.requirement).length;
          const pct = p.steps.length ? Math.round((done / p.steps.length) * 100) : 0;
          return (
            <li key={p.id}>
              <Link href={`/dashboard/learning-paths/${p.id}`} className={`block rounded-2xl border border-line bg-white p-5 transition hover:border-violet ${p.archived ? "opacity-60" : ""}`}>
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet/8 text-violet"><Route size={18} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 font-display text-lg font-semibold">{p.title}{p.archived ? <Badge tone="neutral">Archived</Badge> : null}</p>
                    <p className="text-sm text-muted">{p.audience ?? "Audience not set"}{p.targetDate ? ` · target ${fmtDate(p.targetDate)}` : ""}</p>
                  </div>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full bg-lime" style={{ width: `${pct}%` }} /></div>
                <p className="mt-2 text-xs text-muted">{p.steps.length} step{p.steps.length === 1 ? "" : "s"} · {posted} posted · {done} completed · {pct}%</p>
              </Link>
            </li>
          );
        })}</ul>
      ) : <Empty title="No learning paths yet" body="Create one above. A path is a plan: steps become requirements only when you post them." />}
    </div>
  );
}
