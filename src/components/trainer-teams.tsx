import Link from "next/link";
import { Users } from "lucide-react";
import { db } from "@/lib/db";
import { Avatar } from "./ui";

/** "Teams" section on a trainer's public profile: teams they lead or belong to (accepted only). */
export async function TrainerTeams({ trainerId }: { trainerId: string }) {
  const inc = { lead: { include: { user: { select: { name: true, avatarUrl: true } } } }, members: { where: { status: "ACCEPTED" as const }, include: { trainer: { include: { user: { select: { name: true, avatarUrl: true } } } } } } };
  const [led, member] = await Promise.all([
    db.trainerTeam.findMany({ where: { leadId: trainerId }, include: inc }),
    db.trainerTeamMember.findMany({ where: { trainerId, status: "ACCEPTED" }, include: { team: { include: inc } } }),
  ]);
  const teams = [...led.map((t) => ({ t, role: "Lead" })), ...member.map((m) => ({ t: m.team, role: m.role }))];
  if (!teams.length) return null;
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-lg font-bold"><Users size={18} className="text-cyan" /> Teams</h2>
      <ul className="grid gap-3 sm:grid-cols-2">{teams.map(({ t, role }) => {
        const people = [t.lead, ...t.members.map((m) => m.trainer)];
        return (
          <li key={t.id} className="rounded-2xl border border-line bg-white p-4">
            <Link href={`/teams/${t.slug}`} className="font-display font-semibold hover:text-cyan">{t.name}</Link>
            <p className="text-xs text-muted">{role} · {people.length} trainers{t.tagline ? ` · ${t.tagline}` : ""}</p>
            <div className="mt-2 flex -space-x-2">{people.slice(0, 6).map((p) => <Avatar key={p.id} name={p.user.name} src={p.user.avatarUrl} size={28} className="ring-2 ring-white" />)}</div>
          </li>
        );
      })}</ul>
    </section>
  );
}
