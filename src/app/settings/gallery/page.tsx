import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { addPhoto, deletePhoto } from "@/lib/actions/gallery";
import { ActionForm, SubmitButton } from "@/components/form-bits";
import { Button, ButtonLink, Card, Empty, Field, Input, PageHeader, Select } from "@/components/ui";
import { fmtDate } from "@/lib/utils";

export const metadata = { title: "Gallery" };

export default async function GallerySettings() {
  const user = await requireUser("/settings/gallery");
  if (!user.trainerProfile) redirect("/settings");
  const [photos, companies] = await Promise.all([
    db.galleryPhoto.findMany({ where: { trainerId: user.trainerProfile.id }, include: { company: { select: { name: true } } }, orderBy: [{ takenOn: "desc" }, { createdAt: "desc" }] }),
    db.company.findMany({ where: { requirements: { some: { applications: { some: { trainerId: user.trainerProfile.id, status: "AWARDED" } } } } }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader eyebrow="Trainer" title="Training photo gallery" body="Photos from recent sessions appear on your profile's Gallery tab. Tag the client company when you have their permission to show the room." actions={<ButtonLink href="/settings" variant="ghost" size="sm">← Settings</ButtonLink>} />
      <Card className="p-6">
        <h2 className="text-lg font-bold">Add a photo</h2>
        <ActionForm action={addPhoto} className="mt-4 grid gap-4 md:grid-cols-2" resetOnSuccess>
          <Field label="Photo" hint="JPG, PNG or WebP under 10 MB" className="md:col-span-2"><Input name="photo" type="file" accept="image/*" required className="file:mr-3 file:rounded-md file:border-0 file:bg-surface-2 file:px-3 file:py-1 file:text-xs file:text-ink" /></Field>
          <Field label="Caption" className="md:col-span-2"><Input name="caption" placeholder="Day 2 storage lab, HPE VM Essentials batch for a Mumbai bank" maxLength={300} /></Field>
          <Field label="Date"><Input name="takenOn" type="date" /></Field>
          <Field label="Company" hint="Only companies that have awarded you"><Select name="companyId" defaultValue=""><option value="">Not tagged</option>{companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
          <label className="flex items-center gap-2 text-sm md:col-span-2"><input type="checkbox" name="share" value="1" className="accent-cyan" /> Also share this photo to the feed</label>
          <div className="md:col-span-2"><SubmitButton pendingText="Uploading…">Add to gallery</SubmitButton></div>
        </ActionForm>
      </Card>
      {photos.length ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">{photos.map((p) => (
          <figure key={p.id} className="overflow-hidden rounded-xl border border-line bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt={p.caption} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover" />
            <figcaption className="p-3 text-xs">
              <p className="line-clamp-2 text-ink">{p.caption || "Untitled"}</p>
              <p className="mt-1 text-muted">{p.takenOn ? fmtDate(p.takenOn) : ""}{p.company ? ` · ${p.company.name}` : ""}</p>
              <form action={deletePhoto} className="mt-2"><input type="hidden" name="id" value={p.id} /><Button variant="ghost" size="sm" className="text-dim hover:text-rose">Remove</Button></form>
            </figcaption>
          </figure>
        ))}</div>
      ) : <Empty title="No photos yet" body="Add a few from recent sessions. Companies love seeing a real room." />}
    </div>
  );
}
