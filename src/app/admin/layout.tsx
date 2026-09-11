import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { Badge } from "@/components/ui";
import { db } from "@/lib/db";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["ADMIN", "SUPER_ADMIN"], "/admin");
  const openReports = await db.report.count({ where: { status: "OPEN" } });
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3 border-b border-line pb-4">
        <span className="flex items-center gap-2 font-display font-semibold"><ShieldCheck size={18} className="text-amber" /> Admin console</span>
        <Badge tone="amber">{user.role === "SUPER_ADMIN" ? "super admin" : "administrator"}</Badge>
        <nav className="ml-auto flex gap-1 text-sm">
          <Link href="/admin" className="rounded-lg px-3 py-1.5 text-muted hover:bg-surface-2 hover:text-ink">Queue</Link>
          <Link href="/admin/users" className="rounded-lg px-3 py-1.5 text-muted hover:bg-surface-2 hover:text-ink">Users</Link>
          <Link href="/admin/requirements" className="rounded-lg px-3 py-1.5 text-muted hover:bg-surface-2 hover:text-ink">Requirements</Link>
          <Link href="/admin/reports" className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-muted hover:bg-surface-2 hover:text-ink">Reports{openReports ? <span className="rounded-full bg-rose px-1.5 font-display text-[10px] font-bold text-white">{openReports}</span> : null}</Link>
          {user.role === "SUPER_ADMIN" ? <Link href="/admin/platform" className="rounded-lg px-3 py-1.5 text-amber hover:bg-amber/10">Platform</Link> : null}
        </nav>
      </div>
      {children}
    </div>
  );
}
