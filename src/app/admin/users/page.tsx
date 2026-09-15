import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireStaffAny } from "@/lib/auth";
import { staffCan } from "@/lib/permissions";
import { setUserStatus } from "@/lib/actions/admin";
import { startImpersonation } from "@/lib/actions/impersonate";
import { Avatar, Badge, Button, Input, PageHeader, Select, Stat } from "@/components/ui";
import { fmtDate, roleLabel, timeAgo } from "@/lib/utils";
import { BulkBar, SelectAll, UserActions } from "./user-actions";

export const metadata = { title: "Users" };
const PAGE = 50;
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ q?: string; role?: string; status?: string; page?: string }> }) {
  const { q, role, status, page: pageRaw } = await searchParams;
  const me = await requireStaffAny(["users", "support"], "/admin/users");
  const canManage = staffCan(me.role, "users");
  const page = Math.max(1, Number(pageRaw) || 1);
  const where: Prisma.UserWhereInput = {
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } : {}),
    ...(role === "STAFF" ? { role: { in: ["ADMIN", "SUPER_ADMIN", "MODERATOR", "FINANCE", "SUPPORT"] } } : role ? { role: role as "TRAINER" | "COMPANY" } : {}),
    ...(status ? { status: status as "ACTIVE" | "SUSPENDED" | "DELETED" } : { status: { not: "DELETED" } }),
  };
  const [users, total, counts] = await Promise.all([
    db.user.findMany({ where, include: { trainerProfile: { select: { slug: true, verifiedAt: true } }, memberships: { include: { company: { select: { name: true, slug: true } } } } }, orderBy: { createdAt: "desc" }, take: PAGE, skip: (page - 1) * PAGE }),
    db.user.count({ where }),
    Promise.all([db.user.count({ where: { status: "ACTIVE" } }), db.user.count({ where: { status: "SUSPENDED" } }), db.user.count({ where: { status: "DELETED" } }), db.user.count({ where: { createdAt: { gte: daysAgo(7) } } })]),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const qs = (p: number) => `?${new URLSearchParams({ ...(q ? { q } : {}), ...(role ? { role } : {}), ...(status ? { status } : {}), page: String(p) })}`;

  return (
    <div>
      <PageHeader eyebrow="Operations" title="Users" body="Search, disable, reset passwords, edit details or delete accounts. Tick several rows for bulk actions. Every change is written to the audit log." actions={<Link href="/api/admin/export/users" prefetch={false} className="inline-flex h-8 items-center rounded-full border border-line-2 bg-white px-3.5 font-display text-[13px] font-semibold hover:bg-surface-2">Export users.csv</Link>} />
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Active" value={counts[0]} tone="lime" /><Stat label="Disabled" value={counts[1]} tone="amber" /><Stat label="Deleted" value={counts[2]} tone="violet" /><Stat label="Joined · 7 days" value={counts[3]} />
      </div>
      <form className="mb-4 flex flex-wrap gap-2">
        <div className="w-full max-w-xs"><Input name="q" defaultValue={q} placeholder="Search name or email" /></div>
        <div className="w-44"><Select name="role" defaultValue={role ?? ""}><option value="">All roles</option><option value="TRAINER">Trainers</option><option value="COMPANY">Company members</option><option value="STAFF">Staff</option></Select></div>
        <div className="w-40"><Select name="status" defaultValue={status ?? ""}><option value="">Active + disabled</option><option value="ACTIVE">Active</option><option value="SUSPENDED">Disabled</option><option value="DELETED">Deleted</option></Select></div>
        <Button variant="secondary">Filter</Button>
        <span className="self-center text-sm text-muted">{total} account{total === 1 ? "" : "s"}</span>
      </form>

      {canManage ? <BulkBar /> : null}
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full text-sm">
            <thead><tr className="mono text-left text-[11px] uppercase tracking-wider text-muted">{canManage ? <th className="w-10 px-4 py-3"><SelectAll /></th> : null}<th className="px-4 py-3">User</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Belongs to</th><th className="px-4 py-3">Joined</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th></tr></thead>
            <tbody className="divide-y divide-line">
              {users.map((u) => {
                const protectedRow = u.id === me.id || u.role === "SUPER_ADMIN" || (u.role === "ADMIN" && me.role !== "SUPER_ADMIN");
                const deleted = u.status === "DELETED";
                return (
                  <tr key={u.id} className={`hover:bg-surface-2 ${deleted ? "opacity-60" : ""}`}>
                    {canManage ? <td className="px-4 py-3">{!protectedRow && !deleted ? <input type="checkbox" name="ids" value={u.id} form="bulk-users" aria-label={`Select ${u.name}`} className="accent-cyan" /> : null}</td> : null}
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><Avatar name={u.name} src={u.avatarUrl} size={30} tone={u.role === "COMPANY" ? "violet" : u.role === "TRAINER" ? "cyan" : "amber"} /><div><p className="font-medium">{u.name}{u.identityVerifiedAt ? <span className="ml-1 text-[10px] text-lime">● ID</span> : null}</p><p className="text-xs text-muted">{u.email}{u.phone ? ` · ${u.phone}` : ""}</p></div></div></td>
                    <td className="px-4 py-3"><Badge tone={u.role === "TRAINER" ? "cyan" : u.role === "COMPANY" ? "violet" : "amber"}>{roleLabel[u.role]}</Badge></td>
                    <td className="px-4 py-3 text-muted">{u.trainerProfile ? <Link href={`/trainers/${u.trainerProfile.slug}`} className="hover:text-cyan">Profile{u.trainerProfile.verifiedAt ? " · verified" : ""}</Link> : null}{u.trainerProfile && u.memberships[0] ? " · " : null}{u.memberships[0] ? <Link href={`/companies/${u.memberships[0].company.slug}`} className="hover:text-violet">{u.memberships[0].company.name} · {u.memberships[0].role.toLowerCase().replace("_", " ")}</Link> : null}{!u.trainerProfile && !u.memberships[0] ? "—" : null}</td>
                    <td className="px-4 py-3 text-muted" title={fmtDate(u.createdAt)}>{timeAgo(u.createdAt)}</td>
                    <td className="px-4 py-3"><Badge tone={u.status === "ACTIVE" ? "lime" : u.status === "SUSPENDED" ? "amber" : "neutral"}>{u.status === "SUSPENDED" ? "disabled" : u.status.toLowerCase()}</Badge></td>
                    <td className="px-4 py-3 text-right">
                      {!deleted ? (
                        <div className="flex items-center justify-end gap-1">
                          {me.role === "SUPER_ADMIN" && u.role !== "SUPER_ADMIN" && u.status === "ACTIVE" && u.id !== me.id ? <form action={startImpersonation}><input type="hidden" name="userId" value={u.id} /><Button size="sm" variant="ghost">View as</Button></form> : null}
                          {canManage && !protectedRow ? <form action={setUserStatus}><input type="hidden" name="id" value={u.id} /><input type="hidden" name="status" value={u.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE"} /><Button size="sm" variant={u.status === "ACTIVE" ? "danger" : "secondary"}>{u.status === "ACTIVE" ? "Disable" : "Enable"}</Button></form> : null}
                          {canManage && !protectedRow ? <UserActions user={{ id: u.id, name: u.name, email: u.email, phone: u.phone }} /> : null}
                        </div>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
              {!users.length ? <tr><td colSpan={7} className="px-4 py-10 text-center text-muted">No accounts match.</td></tr> : null}
            </tbody>
          </table>
        </div>
      {pages > 1 ? <div className="mt-4 flex items-center justify-between text-sm text-muted"><span>Page {page} of {pages}</span><div className="flex gap-2">{page > 1 ? <Link href={qs(page - 1)} className="rounded-lg border border-line-2 bg-white px-3 py-1.5 font-display text-xs font-semibold hover:bg-surface-2">Previous</Link> : null}{page < pages ? <Link href={qs(page + 1)} className="rounded-lg border border-line-2 bg-white px-3 py-1.5 font-display text-xs font-semibold hover:bg-surface-2">Next</Link> : null}</div></div> : null}
    </div>
  );
}
