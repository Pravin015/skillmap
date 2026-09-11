import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { setUserStatus } from "@/lib/actions/admin";
import { Avatar, Badge, Button, Input, PageHeader, Select } from "@/components/ui";
import { fmtDate, roleLabel } from "@/lib/utils";

export const metadata = { title: "Users" };

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ q?: string; role?: string }> }) {
  const { q, role } = await searchParams;
  const me = (await getCurrentUser())!;
  const where: Prisma.UserWhereInput = {
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } : {}),
    ...(role ? { role: role as "TRAINER" | "COMPANY" | "ADMIN" | "SUPER_ADMIN" } : {}),
  };
  const users = await db.user.findMany({ where, include: { trainerProfile: { select: { slug: true, verifiedAt: true } }, membership: { include: { company: { select: { name: true, slug: true } } } } }, orderBy: { createdAt: "desc" }, take: 200 });
  return (
    <div>
      <PageHeader eyebrow="Operations" title="Users" body="Suspend accounts that break the rules. Suspended users cannot sign in and vanish from search." />
      <form className="mb-4 flex flex-wrap gap-2">
        <Input name="q" defaultValue={q} placeholder="Search name or email" className="max-w-xs" />
        <Select name="role" defaultValue={role ?? ""} className="w-44"><option value="">All roles</option><option value="TRAINER">Trainers</option><option value="COMPANY">Company members</option><option value="ADMIN">Administrators</option></Select>
        <Button variant="secondary">Filter</Button>
      </form>
      <div className="overflow-x-auto rounded-2xl border border-line bg-surface/60">
        <table className="w-full text-sm">
          <thead><tr className="mono text-left text-[11px] uppercase tracking-wider text-muted"><th className="px-4 py-3">User</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Belongs to</th><th className="px-4 py-3">Joined</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th></tr></thead>
          <tbody className="divide-y divide-line">
            {users.map((u) => {
              const canAct = u.id !== me.id && u.role !== "SUPER_ADMIN" && (u.role !== "ADMIN" || me.role === "SUPER_ADMIN");
              return (
                <tr key={u.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><Avatar name={u.name} src={u.avatarUrl} size={30} tone={u.role === "COMPANY" ? "violet" : u.role === "TRAINER" ? "cyan" : "amber"} /><div><p className="font-medium">{u.name}</p><p className="text-xs text-muted">{u.email}</p></div></div></td>
                  <td className="px-4 py-3"><Badge tone={u.role === "TRAINER" ? "cyan" : u.role === "COMPANY" ? "violet" : "amber"}>{roleLabel[u.role]}</Badge></td>
                  <td className="px-4 py-3 text-muted">{u.trainerProfile ? <Link href={`/trainers/${u.trainerProfile.slug}`} className="hover:text-cyan">Profile{u.trainerProfile.verifiedAt ? " · verified" : ""}</Link> : u.membership ? <Link href={`/companies/${u.membership.company.slug}`} className="hover:text-[#b79cff]">{u.membership.company.name} · {u.membership.role.toLowerCase()}</Link> : "—"}</td>
                  <td className="px-4 py-3 text-muted">{fmtDate(u.createdAt)}</td>
                  <td className="px-4 py-3"><Badge tone={u.status === "ACTIVE" ? "lime" : "rose"}>{u.status}</Badge></td>
                  <td className="px-4 py-3 text-right">{canAct ? <form action={setUserStatus}><input type="hidden" name="id" value={u.id} /><input type="hidden" name="status" value={u.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE"} /><Button size="sm" variant={u.status === "ACTIVE" ? "danger" : "secondary"}>{u.status === "ACTIVE" ? "Suspend" : "Reinstate"}</Button></form> : null}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
