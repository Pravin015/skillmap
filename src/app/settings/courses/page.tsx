import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { deleteCourse, toggleCourse } from "@/lib/actions/courses";
import { Badge, Button, ButtonLink, Card, Chip, Empty, PageHeader } from "@/components/ui";
import { CourseForm } from "./course-form";
import { modeLabel, money } from "@/lib/utils";

export const metadata = { title: "My courses" };

export default async function CoursesSettingsPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams;
  const user = await requireUser("/settings/courses");
  if (!user.trainerProfile) redirect("/settings");
  const [courses, categories, skills] = await Promise.all([
    db.course.findMany({ where: { trainerId: user.trainerProfile.id }, include: { skills: true, category: true }, orderBy: { createdAt: "desc" } }),
    db.category.findMany({ orderBy: { name: "asc" } }),
    db.skill.findMany({ orderBy: { name: "asc" } }),
  ]);
  const editing = edit ? courses.find((c) => c.id === edit) ?? null : null;
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader eyebrow="Trainer" title="Course catalogue" body="List the courses you deliver. Companies can request any of them with one click, which opens a requirement prefilled from the course." actions={<ButtonLink href="/settings" variant="ghost" size="sm">← Settings</ButtonLink>} />
      <Card className="p-6">
        <h2 className="text-lg font-bold">{editing ? `Edit “${editing.title}”` : "Add a course"}</h2>
        <CourseForm key={editing?.id ?? "new"} course={editing} categories={categories} skills={skills} />
        {editing ? <ButtonLink href="/settings/courses" variant="ghost" size="sm" className="mt-2">Cancel editing</ButtonLink> : null}
      </Card>
      <section>
        <h2 className="mb-3 text-lg font-bold">Your courses <span className="text-sm font-normal text-muted">{courses.length}</span></h2>
        {courses.length ? (
          <div className="space-y-3">{courses.map((c) => (
            <Card key={c.id} className={`p-5 ${c.published ? "" : "opacity-70"}`}>
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-display font-semibold">{c.title}<Badge tone={c.published ? "lime" : "neutral"}>{c.published ? "published" : "hidden"}</Badge><Badge>{c.level.toLowerCase()}</Badge></p>
                  <p className="mt-1 text-sm text-muted">{c.durationDays} day{c.durationDays > 1 ? "s" : ""} · {c.modes.map((m) => modeLabel[m]).join(" · ") || "any mode"}{c.maxParticipants ? ` · up to ${c.maxParticipants}` : ""}{c.indicativeRate ? ` · ${money(c.indicativeRate, c.currency)} / day` : ""}{c.category ? ` · ${c.category.name}` : ""}</p>
                  <p className="mt-2 text-sm">{c.summary}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">{c.skills.map((s) => <Chip key={s.id}>{s.name}</Chip>)}</div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <ButtonLink href={`/settings/courses?edit=${c.id}`} variant="secondary" size="sm">Edit</ButtonLink>
                  <form action={toggleCourse}><input type="hidden" name="id" value={c.id} /><Button variant="ghost" size="sm">{c.published ? "Hide" : "Publish"}</Button></form>
                  <form action={deleteCourse}><input type="hidden" name="id" value={c.id} /><Button variant="ghost" size="sm" className="text-dim hover:text-rose">Delete</Button></form>
                </div>
              </div>
            </Card>
          ))}</div>
        ) : <Empty title="No courses yet" body="Add the courses you deliver most. Each one becomes a one-click request for companies." />}
      </section>
    </div>
  );
}
