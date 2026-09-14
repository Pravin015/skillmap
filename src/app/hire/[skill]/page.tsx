import type { Metadata } from "next";
import { HireLanding, hireDescription, hireTitle, resolveHire } from "@/components/hire-landing";
import { pageMeta } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ skill: string }> }): Promise<Metadata> {
  const { skill } = await params;
  const data = await resolveHire(skill);
  if (!data) return { title: "Skill not found", robots: { index: false } };
  return pageMeta({ title: hireTitle(data.skill.name), description: hireDescription(data.skill.name, data.trainers.length), path: `/hire/${data.skill.slug}`, keywords: [`${data.skill.name} trainer`, `freelance ${data.skill.name} trainer India`, `hire ${data.skill.name} corporate trainer`, `${data.skill.name} training company India`] });
}

export default async function HireSkillPage({ params }: { params: Promise<{ skill: string }> }) {
  const { skill } = await params;
  return <HireLanding skillSlug={skill} />;
}
