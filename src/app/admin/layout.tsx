import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { isStaff, requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { staffCan, staffRoleLabel } from "@/lib/permissions";
import { Badge } from "@/components/ui";
import { db } from "@/lib/db";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/admin");
  if (!isStaff(user)) redirect("/dashboard");
  const openReports = await db.report.count({ where: { status: "OPEN" } });
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3 border-b border-line pb-4">
        <span className="flex items-center gap-2 font-display font-semibold"><ShieldCheck size={18} className="text-amber" /> Admin console</span>
        <Badge tone="amber">{staffRoleLabel(user.role).toLowerCase()}</Badge>
        <nav className="ml-auto flex gap-1 text-sm">
          {staffCan(user.role, "verify") ? <Link href="/admin" className="rounded-lg px-3 py-1.5 text-muted hover:bg-surface-2 hover:text-ink">Queue</Link> : null}
          {staffCan(user.role, "users") || staffCan(user.role, "support") ? <Link href="/admin/users" className="rounded-lg px-3 py-1.5 text-muted hover:bg-surface-2 hover:text-ink">Users</Link> : null}
          {staffCan(user.role, "moderate") ? <Link href="/admin/requirements" className="rounded-lg px-3 py-1.5 text-muted hover:bg-surface-2 hover:text-ink">Requirements</Link> : null}
          {staffCan(user.role, "moderate") ? <Link href="/admin/reports" className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-muted hover:bg-surface-2 hover:text-ink">Reports{openReports ? <span className="rounded-full bg-rose px-1.5 font-display text-[10px] font-bold text-white">{openReports}</span> : null}</Link> : null}
          {staffCan(user.role, "finance") ? <Link href="/admin/escrow" className="rounded-lg px-3 py-1.5 text-muted hover:bg-surface-2 hover:text-ink">Escrow</Link> : null}
          {staffCan(user.role, "platform") ? <Link href="/admin/platform" className="rounded-lg px-3 py-1.5 text-amber hover:bg-amber/10">Platform</Link> : null}
        </nav>
      </div>
      {children}
    </div>
  );
}
