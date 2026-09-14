import type { Metadata } from "next";
import { HireLanding, hireDescription, hireTitle, resolveHire } from "@/components/hire-landing";
import { pageMeta, slugifyCity } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ skill: string; city: string }> }): Promise<Metadata> {
  const { skill, city } = await params;
  const data = await resolveHire(skill, city);
  if (!data || !data.cityName) return { title: "Not found", robots: { index: false } };
  return pageMeta({ title: hireTitle(data.skill.name, data.cityName), description: hireDescription(data.skill.name, data.trainers.length, data.cityName), path: `/hire/${data.skill.slug}/${slugifyCity(data.cityName)}`, keywords: [`${data.skill.name} trainer ${data.cityName}`, `corporate trainer ${data.cityName}`, `${data.skill.name} training ${data.cityName}`, `freelance trainer ${data.cityName}`] });
}

export default async function HireSkillCityPage({ params }: { params: Promise<{ skill: string; city: string }> }) {
  const { skill, city } = await params;
  return <HireLanding skillSlug={skill} citySlug={city} />;
}
