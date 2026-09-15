import { ShieldCheck } from "lucide-react";
import { isStaff, requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { staffRoleLabel } from "@/lib/permissions";
import { Badge } from "@/components/ui";

/** Admin pages share the sidebar with everything else; this only guards access and adds the console banner. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/admin");
  if (!isStaff(user)) redirect("/dashboard");
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3 border-b border-line pb-4">
        <span className="flex items-center gap-2 font-display font-semibold"><ShieldCheck size={18} className="text-amber" /> Admin console</span>
        <Badge tone="amber">{staffRoleLabel(user.role).toLowerCase()}</Badge>
        <span className="text-sm text-muted">Sections are in the sidebar on the left.</span>
      </div>
      {children}
    </div>
  );
}
