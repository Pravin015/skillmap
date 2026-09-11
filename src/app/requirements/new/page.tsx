import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { NewRequirementForm } from "./form";

export const metadata = { title: "Post a requirement" };

export default async function NewRequirementPage() {
  const user = await requireUser("/requirements/new");
  if (!user.membership) redirect("/signup?as=company");
  const [categories, skills] = await Promise.all([db.category.findMany({ orderBy: { name: "asc" } }), db.skill.findMany({ orderBy: { name: "asc" } })]);
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow={user.membership.company.name} title="Post a training requirement" body="Be specific about the audience, what you provide (lab, courseware, venue) and what you expect the trainer to bring. Matching trainers are notified the moment you publish." />
      <NewRequirementForm categories={categories} skills={skills} />
    </div>
  );
}
