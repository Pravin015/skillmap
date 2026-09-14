import { db } from "@/lib/db";
import { STAFF_ROLE_META, STAFF_ROLES } from "@/lib/permissions";
import { requireStaff } from "@/lib/auth";
import { createAdmin, removeAdmin, runJobsNow, setAnnouncement, updateSetting, upsertTaxonomy, setStaffRole } from "@/lib/actions/admin";
import { ActionForm, SubmitButton } from "@/components/form-bits";
import { Avatar, Badge, Button, Card, Chip, Field, Input, PageHeader, Select, Stat } from "@/components/ui";
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
  await requireStaff("platform", "/admin/platform");
  const [admins, settings, categories, skills, audit, growth] = await Promise.all([
    db.user.findMany({ where: { role: { in: STAFF_ROLES } }, orderBy: [{ role: "desc" }, { createdAt: "asc" }] }),
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
  const jobRuns = await db.jobRun.findMany({ orderBy: { ranAt: "desc" }, take: 7 });
  const [emailStats, smsStats, pushCount] = await Promise.all([db.emailLog.groupBy({ by: ["status"], _count: true }), db.smsLog.groupBy({ by: ["status"], _count: true }), db.pushSubscription.count()]);
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
              {a.status === "SUSPENDED" ? <Badge tone="neutral">removed</Badge> : a.role === "SUPER_ADMIN" ? <Badge tone="amber">super admin</Badge> : <form action={setStaffRole} className="flex items-center gap-1"><input type="hidden" name="id" value={a.id} /><Select name="role" defaultValue={a.role} className="h-8 w-40 py-1 text-xs">{STAFF_ROLE_META.filter((r) => r.value !== "SUPER_ADMIN").map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</Select><Button size="sm" variant="ghost">Save</Button></form>}
              {a.role !== "SUPER_ADMIN" && a.status === "ACTIVE" ? <form action={removeAdmin}><input type="hidden" name="id" value={a.id} /><Button size="sm" variant="ghost" className="text-dim hover:text-rose">Remove</Button></form> : null}
            </div>
          ))}</div>
          <ActionForm action={createAdmin} className="mt-4 grid gap-3 md:grid-cols-3 md:items-end" resetOnSuccess>
            <Field label="Name"><Input name="name" required /></Field>
            <Field label="Email"><Input name="email" type="email" required /></Field>
            <Field label="Initial password"><Input name="password" type="text" required minLength={8} /></Field>
            <Field label="Role" className="md:col-span-3"><Select name="role" defaultValue="ADMIN">{STAFF_ROLE_META.filter((r) => r.value !== "SUPER_ADMIN").map((r) => <option key={r.value} value={r.value}>{r.label} · {r.blurb}</option>)}</Select></Field>
            <div className="md:col-span-3"><SubmitButton variant="secondary">Create staff account</SubmitButton></div>
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
        <h2 className="text-lg font-bold">Announcement banner</h2>
        <p className="mt-1 text-sm text-muted">Shown at the top of every page until the expiry date or until cleared. Members can dismiss it per browser.</p>
        <ActionForm action={setAnnouncement} className="mt-4 grid gap-3 md:grid-cols-[1fr_140px_1fr_170px_auto] md:items-end">
          <Field label="Text"><Input name="text" defaultValue={s.announcement_text ?? ""} placeholder="Maintenance on Sunday 02:00–04:00 IST" /></Field>
          <Field label="Style"><Select name="tone" defaultValue={s.announcement_tone ?? "info"}><option value="info">Info</option><option value="warning">Warning</option><option value="success">Success</option></Select></Field>
          <Field label="Link (optional)"><Input name="href" defaultValue={s.announcement_href ?? ""} placeholder="/pricing" /></Field>
          <Field label="Expires"><Input name="until" type="datetime-local" defaultValue={s.announcement_until ? new Date(s.announcement_until).toISOString().slice(0, 16) : ""} /></Field>
          <SubmitButton variant="secondary">Save</SubmitButton>
        </ActionForm>
        <p className="mt-2 text-xs text-muted">Leave the text empty and save to clear it.</p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Daily jobs</h2><form action={runJobsNow}><Button variant="secondary" size="sm">Run now</Button></form></div>
          <p className="mt-1 text-sm text-muted">Certificate expiry reminders, expiries, overdue-invoice nudges, interview reminders, completion nudges. Schedule <span className="mono">GET /api/cron/daily</span> with the <span className="mono">x-cron-secret</span> header once a day.</p>
          <ul className="mt-3 space-y-1 text-sm">{jobRuns.map((j) => <li key={j.id} className="flex gap-3"><span className="shrink-0 text-muted">{timeAgo(j.ranAt)}</span><span>{j.summary}</span></li>)}{!jobRuns.length ? <li className="text-muted">Never run.</li> : null}</ul>
        </Card>
        <Card className="p-6">
          <h2 className="text-lg font-bold">Delivery channels</h2>
          <dl className="mt-3 grid grid-cols-3 gap-3 text-sm">
            <div><dt className="mono text-[11px] uppercase tracking-wider text-muted">Email</dt><dd className="mt-1">{emailStats.length ? emailStats.map((e) => `${e._count} ${e.status}`).join(" · ") : "none yet"}</dd></div>
            <div><dt className="mono text-[11px] uppercase tracking-wider text-muted">WhatsApp / SMS</dt><dd className="mt-1">{smsStats.length ? smsStats.map((e) => `${e._count} ${e.status}`).join(" · ") : "none yet"}</dd></div>
            <div><dt className="mono text-[11px] uppercase tracking-wider text-muted">Push devices</dt><dd className="mt-1">{pushCount}</dd></div>
          </dl>
          <p className="mt-3 text-xs text-muted">“logged” means the provider key is not set and the message was recorded instead of sent.</p>
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
