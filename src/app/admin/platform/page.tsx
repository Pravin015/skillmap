import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { createAdmin, removeAdmin, updateSetting, upsertTaxonomy } from "@/lib/actions/admin";
import { ActionForm, SubmitButton } from "@/components/form-bits";
import { Avatar, Badge, Button, Card, Chip, Field, Input, PageHeader, Stat } from "@/components/ui";
import { fmtDate, timeAgo } from "@/lib/utils";
import { ACTIVE_STATUSES, inr, planByCode } from "@/lib/billing";

export const metadata = { title: "Platform" };

const SETTINGS: { key: string; label: string; hint: string }[] = [
  { key: "free_applications_per_month", label: "Free applications per trainer / month", hint: "Trainer Pro removes this limit." },
  { key: "free_open_requirements", label: "Free open requirements per company", hint: "Training partners are exempt." },
  { key: "support_email", label: "Support email", hint: "Shown in suspension and takedown notices." },
  { key: "platform_name", label: "Platform name", hint: "" },
];

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);

export default async function PlatformPage() {
  await requireRole(["SUPER_ADMIN"], "/admin/platform");
  const [admins, settings, categories, skills, audit, growth] = await Promise.all([
    db.user.findMany({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } }, orderBy: [{ role: "desc" }, { createdAt: "asc" }] }),
    db.setting.findMany(),
    db.category.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { requirements: true } } } }),
    db.skill.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { trainers: true, requirements: true } } } }),
    db.auditLog.findMany({ include: { actor: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 25 }),
    Promise.all([
      db.user.count({ where: { createdAt: { gte: daysAgo(30) } } }),
      db.requirement.count({ where: { createdAt: { gte: daysAgo(30) } } }),
      db.application.count({ where: { createdAt: { gte: daysAgo(30) } } }),
      db.application.count({ where: { status: "AWARDED" } }),
    ]),
  ]);
  const activeSubs = await db.subscription.findMany({ where: { status: { in: ACTIVE_STATUSES } }, include: { user: { select: { name: true } }, company: { select: { name: true } } }, orderBy: { createdAt: "desc" } });
  const mrr = activeSubs.reduce((n, x) => n + (x.interval === "YEARLY" ? Math.round(x.amount / 12) : x.amount), 0);
  const s = Object.fromEntries(settings.map((x) => [x.key, x.value]));
  const [newUsers, newReqs, newApps, awarded] = growth;

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Super admin" title="Platform" body="Administrators, plan limits, taxonomy and the full audit log. Only super admins see this page." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="New users · 30d" value={newUsers} /><Stat label="Requirements · 30d" value={newReqs} tone="violet" /><Stat label="Applications · 30d" value={newApps} tone="amber" /><Stat label="Awarded all-time" value={awarded} tone="lime" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Active subscriptions" value={activeSubs.length} tone="lime" /><Stat label="Monthly recurring" value={inr(mrr)} tone="lime" /><Stat label="Trainer Pro" value={activeSubs.filter((x) => x.plan === "TRAINER_PRO").length} /><Stat label="Company plans" value={activeSubs.filter((x) => x.plan !== "TRAINER_PRO").length} tone="violet" />
      </div>
      {activeSubs.length ? (
        <Card className="p-6">
          <h2 className="text-lg font-bold">Subscriptions</h2>
          <div className="mt-3 overflow-x-auto"><table className="w-full text-sm"><thead><tr className="mono text-left text-[11px] uppercase tracking-wider text-muted"><th className="py-2 pr-4">Subscriber</th><th className="py-2 pr-4">Plan</th><th className="py-2 pr-4">Amount</th><th className="py-2 pr-4">Status</th><th className="py-2">Renews</th></tr></thead>
          <tbody className="divide-y divide-line">{activeSubs.map((x) => <tr key={x.id}><td className="py-2 pr-4">{x.company?.name ?? x.user?.name}</td><td className="py-2 pr-4">{planByCode(x.plan).name} · {x.interval.toLowerCase()}</td><td className="py-2 pr-4 tabular-nums">{inr(x.amount)}</td><td className="py-2 pr-4"><Badge tone={x.simulated ? "amber" : "lime"}>{x.simulated ? "simulated" : x.status.toLowerCase()}</Badge></td><td className="py-2 text-muted">{x.currentPeriodEnd ? fmtDate(x.currentPeriodEnd) : "—"}</td></tr>)}</tbody></table></div>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-lg font-bold">Administrators</h2>
          <div className="mt-3 divide-y divide-line rounded-xl border border-line">{admins.map((a) => (
            <div key={a.id} className="flex items-center gap-3 px-4 py-3">
              <Avatar name={a.name} src={a.avatarUrl} size={34} tone="amber" />
              <div className="min-w-0 flex-1"><p className="font-medium">{a.name}</p><p className="text-xs text-muted">{a.email} · since {fmtDate(a.createdAt)}</p></div>
              <Badge tone={a.role === "SUPER_ADMIN" ? "amber" : "neutral"}>{a.role === "SUPER_ADMIN" ? "super" : a.status === "SUSPENDED" ? "removed" : "admin"}</Badge>
              {a.role === "ADMIN" && a.status === "ACTIVE" ? <form action={removeAdmin}><input type="hidden" name="id" value={a.id} /><Button size="sm" variant="ghost" className="text-dim hover:text-rose">Remove</Button></form> : null}
            </div>
          ))}</div>
          <ActionForm action={createAdmin} className="mt-4 grid gap-3 md:grid-cols-3 md:items-end" resetOnSuccess>
            <Field label="Name"><Input name="name" required /></Field>
            <Field label="Email"><Input name="email" type="email" required /></Field>
            <Field label="Initial password"><Input name="password" type="text" required minLength={8} /></Field>
            <div className="md:col-span-3"><SubmitButton variant="secondary">Create administrator</SubmitButton></div>
          </ActionForm>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-bold">Plan limits & settings</h2>
          <div className="mt-3 space-y-4">{SETTINGS.map((x) => (
            <ActionForm key={x.key} action={updateSetting} className="grid grid-cols-[1fr_auto] items-end gap-2">
              <input type="hidden" name="key" value={x.key} />
              <Field label={x.label} hint={x.hint}><Input name="value" defaultValue={s[x.key] ?? ""} /></Field>
              <SubmitButton variant="secondary" size="md" className="mb-[22px]">Save</SubmitButton>
            </ActionForm>
          ))}</div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-bold">Domains <span className="mono text-xs text-muted">{categories.length}</span></h2>
          <div className="mt-3 flex flex-wrap gap-1.5">{categories.map((c) => <Chip key={c.id}>{c.name} <span className="ml-1 text-dim">{c._count.requirements}</span></Chip>)}</div>
          <ActionForm action={upsertTaxonomy} className="mt-4 flex gap-2" resetOnSuccess><input type="hidden" name="kind" value="category" /><Input name="name" placeholder="New domain, e.g. Finance" required /><SubmitButton variant="secondary">Add</SubmitButton></ActionForm>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-bold">Skills <span className="mono text-xs text-muted">{skills.length}</span></h2>
          <div className="mt-3 flex max-h-48 flex-wrap gap-1.5 overflow-y-auto scrollbar-thin">{skills.map((k) => <Chip key={k.id}>{k.name} <span className="ml-1 text-dim">{k._count.trainers}·{k._count.requirements}</span></Chip>)}</div>
          <ActionForm action={upsertTaxonomy} className="mt-4 flex gap-2" resetOnSuccess><input type="hidden" name="kind" value="skill" /><Input name="name" placeholder="New skill, e.g. Snowflake" required /><SubmitButton variant="secondary">Add</SubmitButton></ActionForm>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-bold">Audit log</h2>
        <div className="mt-3 overflow-x-auto"><table className="w-full text-sm">
          <thead><tr className="mono text-left text-[11px] uppercase tracking-wider text-muted"><th className="py-2 pr-4">When</th><th className="py-2 pr-4">Actor</th><th className="py-2 pr-4">Action</th><th className="py-2 pr-4">Target</th><th className="py-2">Detail</th></tr></thead>
          <tbody className="divide-y divide-line">{audit.map((a) => <tr key={a.id}><td className="py-2 pr-4 text-muted">{timeAgo(a.createdAt)}</td><td className="py-2 pr-4">{a.actor.name}</td><td className="mono py-2 pr-4 text-amber">{a.action}</td><td className="mono py-2 pr-4 text-xs text-muted">{a.target}</td><td className="mono py-2 text-xs text-dim">{a.detail ? JSON.stringify(a.detail) : ""}</td></tr>)}
          {!audit.length ? <tr><td colSpan={5} className="py-3 text-muted">No actions recorded yet.</td></tr> : null}</tbody>
        </table></div>
      </Card>
    </div>
  );
}
