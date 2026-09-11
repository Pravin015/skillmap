import { redirect } from "next/navigation";
import { Download } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Card, PageHeader } from "@/components/ui";
import { ImportForm } from "./import-form";

export const metadata = { title: "Import requirements" };

export default async function ImportPage() {
  const user = await requireUser("/requirements/import");
  if (!user.membership) redirect("/signup?as=company");
  const [cats, skills] = await Promise.all([db.category.findMany({ orderBy: { name: "asc" } }), db.skill.findMany({ orderBy: { name: "asc" } })]);
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader eyebrow={user.membership.company.name} title="Import requirements from CSV" body="Post many requirements at once. Upload the file, check the preview, then confirm. Matching trainers are notified for every public requirement." actions={<a href="/api/requirements/template" className="inline-flex h-10 items-center gap-2 rounded-lg border border-line-2 bg-white px-4 font-display text-sm font-semibold hover:bg-surface-2"><Download size={15} /> Download template</a>} />
      <ImportForm />
      <Card className="p-6 text-sm">
        <h2 className="font-display text-base font-semibold">Column reference</h2>
        <dl className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2">
          <div><dt className="mono text-xs text-cyan">title</dt><dd className="text-muted">At least 8 characters.</dd></div>
          <div><dt className="mono text-xs text-cyan">category</dt><dd className="text-muted">{cats.map((c) => c.name).join(", ")}</dd></div>
          <div><dt className="mono text-xs text-cyan">skills</dt><dd className="text-muted">Separate with ; e.g. <span className="mono">HPE VM Essentials;Morpheus</span>. Known skills: {skills.slice(0, 12).map((s) => s.name).join(", ")}{skills.length > 12 ? ` and ${skills.length - 12} more` : ""}.</dd></div>
          <div><dt className="mono text-xs text-cyan">mode · city</dt><dd className="text-muted">onsite, virtual or hybrid. City required unless virtual.</dd></div>
          <div><dt className="mono text-xs text-cyan">start_date · end_date</dt><dd className="text-muted">YYYY-MM-DD.</dd></div>
          <div><dt className="mono text-xs text-cyan">participants · budget_min · budget_max · currency</dt><dd className="text-muted">Numbers; budget per day; INR or USD.</dd></div>
          <div><dt className="mono text-xs text-cyan">language · visibility</dt><dd className="text-muted">Defaults English and public. Use invite_only to hide from search.</dd></div>
          <div><dt className="mono text-xs text-cyan">description</dt><dd className="text-muted">At least 40 characters. Wrap in quotes if it contains commas or line breaks.</dd></div>
        </dl>
      </Card>
    </div>
  );
}
