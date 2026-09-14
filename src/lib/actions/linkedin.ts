"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { parseLinkedInText, type ParsedProfile } from "@/lib/linkedin-parse";
import { slugify } from "@/lib/utils";

export type LinkedInState = { error?: string; profile?: ParsedProfile; skillMatches?: { name: string; slug: string | null }[]; applied?: string[] } | undefined;

/** Step 1: read the PDF (or pasted text) and return a reviewable preview. Nothing is saved. */
export async function parseLinkedIn(_p: LinkedInState, fd: FormData): Promise<LinkedInState> {
  const user = await requireUser();
  if (!user.trainerProfile) return { error: "Only trainer accounts can import a LinkedIn profile." };
  const file = fd.get("file") as File | null;
  let text = String(fd.get("text") ?? "");
  if (file && file.size) {
    if (file.size > 8 * 1024 * 1024) return { error: "PDF must be under 8 MB." };
    if (!/\.pdf$/i.test(file.name)) return { error: "Upload the PDF from LinkedIn's “Save to PDF”." };
    try {
      const pdfParse = (await import("pdf-parse")).default;
      const out = await pdfParse(Buffer.from(await file.arrayBuffer()));
      text = out.text;
    } catch (e) { return { error: `Could not read that PDF: ${(e as Error).message}` }; }
  }
  if (text.trim().length < 50) return { error: "Nothing readable found. Upload the LinkedIn PDF or paste the profile text." };
  const profile = parseLinkedInText(text);
  const known = await db.skill.findMany({ select: { name: true, slug: true } });
  const bySlug = new Map(known.map((k) => [k.slug, k.slug]));
  const byName = new Map(known.map((k) => [k.name.toLowerCase(), k.slug]));
  const skillMatches = profile.skills.map((name) => ({ name, slug: byName.get(name.toLowerCase()) ?? bySlug.get(slugify(name)) ?? null }));
  return { profile: { ...profile, raw: "" }, skillMatches };
}

/** Step 2: apply the fields the trainer ticked. */
export async function applyLinkedIn(_p: LinkedInState, fd: FormData): Promise<LinkedInState> {
  const user = await requireUser();
  if (!user.trainerProfile) return { error: "Only trainer accounts can import a LinkedIn profile." };
  let profile: ParsedProfile;
  try { profile = JSON.parse(String(fd.get("profile") ?? "")) as ParsedProfile; } catch { return { error: "The preview expired. Upload the PDF again." }; }
  const tid = user.trainerProfile.id;
  const applied: string[] = [];
  const data: Record<string, unknown> = {};
  if (fd.get("use_headline") && profile.headline) { data.headline = profile.headline.slice(0, 160); applied.push("headline"); }
  if (fd.get("use_summary") && profile.summary) { data.bio = profile.summary.slice(0, 4000); applied.push("about"); }
  if (fd.get("use_years") && profile.yearsExperience) { data.yearsExperience = profile.yearsExperience; applied.push("years of experience"); }
  if (fd.get("use_languages") && profile.languages.length) { data.languages = profile.languages; applied.push("languages"); }
  const skillSlugs = fd.getAll("skills").map(String).filter(Boolean);
  if (skillSlugs.length) { data.skills = { connect: skillSlugs.map((slug) => ({ slug })) }; applied.push(`${skillSlugs.length} skill${skillSlugs.length > 1 ? "s" : ""}`); }
  if (Object.keys(data).length) await db.trainerProfile.update({ where: { id: tid }, data });
  const certIdx = fd.getAll("certs").map(Number);
  let certs = 0;
  for (const i of certIdx) {
    const c = profile.certifications[i];
    if (!c) continue;
    const exists = await db.certification.findFirst({ where: { trainerId: tid, name: c.name } });
    if (!exists) { await db.certification.create({ data: { trainerId: tid, name: c.name.slice(0, 160), issuer: c.issuer ?? "From LinkedIn · add issuer", status: "PENDING" } }); certs++; }
  }
  if (certs) applied.push(`${certs} certification${certs > 1 ? "s" : ""} (pending verification)`);
  const expIdx = fd.getAll("experiences").map(Number);
  let exps = 0;
  for (const i of expIdx) {
    const e = profile.experiences[i];
    if (!e) continue;
    const exists = await db.experience.findFirst({ where: { trainerId: tid, title: e.title, organisation: e.organisation } });
    if (!exists) { await db.experience.create({ data: { trainerId: tid, title: e.title.slice(0, 160), organisation: e.organisation.slice(0, 160), startDate: e.start ? new Date(e.start) : null, endDate: e.end ? new Date(e.end) : null, current: e.current, description: e.description } }); exps++; }
  }
  if (exps) applied.push(`${exps} work history entr${exps > 1 ? "ies" : "y"}`);
  if (!applied.length) return { error: "Nothing was selected." };
  revalidatePath("/settings"); revalidatePath(`/trainers/${user.trainerProfile.slug}`);
  return { applied };
}

export async function deleteExperience(fd: FormData) {
  const user = await requireUser();
  if (!user.trainerProfile) return;
  await db.experience.deleteMany({ where: { id: String(fd.get("id")), trainerId: user.trainerProfile.id } });
  revalidatePath("/settings/import"); revalidatePath(`/trainers/${user.trainerProfile.slug}`);
}
