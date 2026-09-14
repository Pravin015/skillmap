import Link from "next/link";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { createTeam, deleteTeam, inviteTeamMember, removeTeamMember, respondTeamInvite, updateTeam } from "@/lib/actions/teams";
import { ActionForm, SubmitButton } from "@/components/form-bits";
import { Avatar, Badge, Button, ButtonLink, Card, Field, Input, PageHeader, Textarea } from "@/components/ui";

export const metadata = { title: "Teams" };

/** Trainer teams: a lead invites co-trainers; the team can apply jointly and shows on each member's profile. */
export default async function TeamsSettings({ searchParams }: { searchParams: Promise<{ team?: string }> }) {
  const { team: focus } = await searchParams;
  const user = await requireUser("/settings/teams");
  if (!user.trainerProfile) redirect("/settings");
  const me = user.trainerProfile.id;
  const include = { lead: { include: { user: { select: { name: true, avatarUrl: true } } } }, members: { include: { trainer: { include: { user: { select: { name: true, avatarUrl: true, email: true } } } } }, orderBy: { createdAt: "asc" as const } }, _count: { select: { applications: true } } };
  const [led, memberships] = await Promise.all([
    db.trainerTeam.findMany({ where: { leadId: me }, include, orderBy: { createdAt: "asc" } }),
    db.trainerTeamMember.findMany({ where: { trainerId: me, status: { in: ["INVITED", "ACCEPTED"] } }, include: { team: { include } }, orderBy: { createdAt: "desc" } }),
  ]);
  const invites = memberships.filter((m) => m.status === "INVITED");
  const joined = memberships.filter((m) => m.status === "ACCEPTED");
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader eyebrow="Trainer" title="Teams" body="Team up with co-trainers for large or multi-track programmes. The lead applies on behalf of the team, signs the work order and raises the invoice; members appear on the application and the team page." actions={<ButtonLink href="/settings" variant="ghost" size="sm">← Settings</ButtonLink>} />

      {invites.length ? (
        <Card className="p-5" glow="cyan">
          <h2 className="text-lg font-bold">Invitations</h2>
          <ul className="mt-3 space-y-2">{invites.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-line p-3">
              <Avatar name={m.team.lead.user.name} src={m.team.lead.user.avatarUrl} size={36} />
              <div className="min-w-0 flex-1"><p className="font-semibold">{m.team.name}</p><p className="text-sm text-muted">Led by {m.team.lead.user.name} · role: {m.role}</p></div>
              <form action={respondTeamInvite} className="flex gap-2"><input type="hidden" name="id" value={m.id} /><Button name="decision" value="accept" size="sm">Accept</Button><Button name="decision" value="decline" variant="secondary" size="sm">Decline</Button></form>
            </li>
          ))}</ul>
        </Card>
      ) : null}

      {led.map((t) => (
        <Card key={t.id} className="p-6" glow={focus === t.id ? "cyan" : undefined}>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="flex items-center gap-2 text-lg font-bold"><Users size={18} className="text-cyan" /> {t.name}</h2>
            <Badge tone="cyan">You lead</Badge>
            <Link href={`/teams/${t.slug}`} className="ml-auto text-sm text-cyan hover:underline">Public page →</Link>
          </div>
          <ul className="mt-4 space-y-2">
            <li className="flex items-center gap-3 rounded-lg border border-line p-2.5"><Avatar name={user.name} src={user.avatarUrl} size={32} /><div className="flex-1 text-sm"><span className="font-medium">{user.name}</span> <span className="text-muted">· Lead</span></div></li>
            {t.members.map((m) => (
              <li key={m.id} className="flex items-center gap-3 rounded-lg border border-line p-2.5">
                <Avatar name={m.trainer.user.name} src={m.trainer.user.avatarUrl} size={32} />
                <div className="min-w-0 flex-1 text-sm"><span className="font-medium">{m.trainer.user.name}</span> <span className="text-muted">· {m.role}</span></div>
                <Badge tone={m.status === "ACCEPTED" ? "lime" : m.status === "INVITED" ? "amber" : "neutral"}>{m.status.toLowerCase()}</Badge>
                <form action={removeTeamMember}><input type="hidden" name="id" value={m.id} /><Button variant="ghost" size="sm" className="text-rose">Remove</Button></form>
              </li>
            ))}
          </ul>
          <ActionForm action={inviteTeamMember} className="mt-4 grid gap-3 md:grid-cols-[1fr_180px_auto]" resetOnSuccess>
            <input type="hidden" name="teamId" value={t.id} />
            <Field label="Invite a trainer by email"><Input name="email" type="email" required placeholder="trainer@example.com" /></Field>
            <Field label="Role"><Input name="role" placeholder="Co-trainer" /></Field>
            <div className="flex items-end"><SubmitButton size="sm" pendingText="Inviting…">Invite</SubmitButton></div>
          </ActionForm>
          <details className="mt-4 rounded-lg border border-line p-3">
            <summary className="cursor-pointer text-sm font-medium">Edit team details</summary>
            <ActionForm action={updateTeam} className="mt-3 space-y-3">
              <input type="hidden" name="id" value={t.id} />
              <Field label="Name"><Input name="name" required defaultValue={t.name} /></Field>
              <Field label="Tagline"><Input name="tagline" defaultValue={t.tagline} placeholder="Cloud + DevOps delivery pod for enterprise batches" /></Field>
              <Field label="About the team"><Textarea name="description" defaultValue={t.description} className="min-h-20" /></Field>
              <div className="flex flex-wrap gap-2"><SubmitButton size="sm" pendingText="Saving…">Save</SubmitButton></div>
            </ActionForm>
            <form action={deleteTeam} className="mt-3 border-t border-line pt-3"><input type="hidden" name="id" value={t.id} /><Button variant="danger" size="sm">Delete team</Button><span className="ml-2 text-xs text-muted">{t._count.applications} joint application{t._count.applications === 1 ? "" : "s"} keep their history.</span></form>
          </details>
        </Card>
      ))}

      {joined.length ? (
        <Card className="p-5">
          <h2 className="text-lg font-bold">Teams you belong to</h2>
          <ul className="mt-3 space-y-2">{joined.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-line p-3">
              <Avatar name={m.team.lead.user.name} src={m.team.lead.user.avatarUrl} size={36} />
              <div className="min-w-0 flex-1"><Link href={`/teams/${m.team.slug}`} className="font-semibold hover:text-cyan">{m.team.name}</Link><p className="text-sm text-muted">Led by {m.team.lead.user.name} · you: {m.role} · {m.team.members.filter((x) => x.status === "ACCEPTED").length + 1} members</p></div>
              <form action={removeTeamMember}><input type="hidden" name="id" value={m.id} /><Button variant="ghost" size="sm" className="text-rose">Leave</Button></form>
            </li>
          ))}</ul>
        </Card>
      ) : null}

      <Card className="p-6">
        <h2 className="text-lg font-bold">Create a team</h2>
        <p className="mt-1 text-sm text-muted">You become the lead. Up to 12 members; members must already have a trainer account.</p>
        <ActionForm action={createTeam} className="mt-4 space-y-3">
          <Field label="Team name"><Input name="name" required placeholder="Cloud Delivery Pod" /></Field>
          <Field label="Tagline"><Input name="tagline" placeholder="One-line pitch shown on the team page" /></Field>
          <Field label="About the team"><Textarea name="description" className="min-h-20" placeholder="Who you are, what you deliver together, batch sizes you can run in parallel." /></Field>
          <SubmitButton pendingText="Creating…">Create team</SubmitButton>
        </ActionForm>
      </Card>
    </div>
  );
}
