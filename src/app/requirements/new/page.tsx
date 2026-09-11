import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { NewRequirementForm } from "./form";

export const metadata = { title: "Post a requirement" };

export default async function NewRequirementPage({ searchParams }: { searchParams: Promise<{ course?: string }> }) {
  const { course: courseId } = await searchParams;
  const user = await requireUser("/requirements/new");
  if (!user.membership) redirect("/signup?as=company");
  const [categories, skills, course] = await Promise.all([db.category.findMany({ orderBy: { name: "asc" } }), db.skill.findMany({ orderBy: { name: "asc" } }), courseId ? db.course.findFirst({ where: { id: courseId, published: true }, include: { skills: true, trainer: { include: { user: { select: { name: true } } } } } }) : null]);
  const preset = course ? { title: `${course.title} · ${course.durationDays}-day${course.modes.length === 1 ? ` ${course.modes[0].toLowerCase()}` : ""} with ${course.trainer.user.name}`, description: `Requested from ${course.trainer.user.name}'s course catalogue.\n\n${course.summary}${course.outline ? `\n\nOutline:\n${course.outline}` : ""}\n\nAudience, venue and lab details:\n`, categoryId: course.categoryId ?? "", mode: course.modes[0] ?? "ONSITE", participants: course.maxParticipants ?? undefined, skills: course.skills.map((s) => s.slug), inviteTrainerId: course.trainerId, trainerName: course.trainer.user.name } : undefined;
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow={user.membership.company.name} title="Post a training requirement" body="Be specific about the audience, what you provide (lab, courseware, venue) and what you expect the trainer to bring. Matching trainers are notified the moment you publish." />
      {preset ? <p className="mb-4 rounded-lg border border-violet/30 bg-violet/5 px-4 py-2.5 text-sm">Prefilled from <span className="font-semibold">{course!.title}</span>. {preset.trainerName} will be invited automatically when you publish.</p> : null}
      <NewRequirementForm categories={categories} skills={skills} preset={preset} />
    </div>
  );
}
