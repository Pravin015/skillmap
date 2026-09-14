import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { deleteExperience } from "@/lib/actions/linkedin";
import { Button, ButtonLink, Card, PageHeader } from "@/components/ui";
import { fmtDate } from "@/lib/utils";
import { LinkedInImportForm } from "./import-form";

export const metadata = { title: "Import from LinkedIn" };

export default async function ImportPage() {
  const user = await requireUser("/settings/import");
  if (!user.trainerProfile) redirect("/settings");
  const experiences = await db.experience.findMany({ where: { trainerId: user.trainerProfile.id }, orderBy: [{ current: "desc" }, { startDate: "desc" }] });
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader eyebrow="Trainer" title="Import from LinkedIn" body="Upload the PDF LinkedIn generates from your profile. We read the headline, about, skills, languages, certifications and work history, and you choose what to keep. Nothing is sent to LinkedIn." actions={<ButtonLink href="/settings" variant="ghost" size="sm">← Settings</ButtonLink>} />
      <LinkedInImportForm />
      <Card className="p-6">
        <h2 className="text-lg font-bold">Work history on your profile</h2>
        {experiences.length ? (
          <ul className="mt-3 divide-y divide-line">{experiences.map((e) => (
            <li key={e.id} className="flex flex-wrap items-start gap-3 py-3 text-sm">
              <div className="min-w-0 flex-1"><p className="font-medium">{e.title} <span className="font-normal text-muted">· {e.organisation}</span></p><p className="text-xs text-muted">{e.startDate ? fmtDate(e.startDate) : "?"} → {e.current ? "present" : e.endDate ? fmtDate(e.endDate) : "?"}</p>{e.description ? <p className="mt-1 text-muted">{e.description}</p> : null}</div>
              <form action={deleteExperience}><input type="hidden" name="id" value={e.id} /><Button variant="ghost" size="sm" className="text-dim hover:text-rose">Remove</Button></form>
            </li>
          ))}</ul>
        ) : <p className="mt-2 text-sm text-muted">Nothing yet. Import from LinkedIn to add past roles and clients.</p>}
      </Card>
    </div>
  );
}
