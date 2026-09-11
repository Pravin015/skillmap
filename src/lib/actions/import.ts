"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { parseCsv } from "@/lib/csv";
import { entitlementsFor } from "@/lib/billing";
import { notify } from "@/lib/notify";
import { alertRequirementSearches } from "@/lib/saved-searches";
import { daysBetween, slugify } from "@/lib/utils";

export type ImportRow = { line: number; title: string; category: string; skills: string[]; mode: string; city: string; startDate: string; endDate: string; days: number; participants: number; budgetMin: number | null; budgetMax: number | null; currency: string; language: string; visibility: string; description: string; errors: string[] };
export type ImportState = { errors?: string[]; rows?: ImportRow[]; created?: number; fileName?: string } | undefined;

async function validate(text: string): Promise<{ rows: ImportRow[]; errors: string[] }> {
  const raw = parseCsv(text);
  if (!raw.length) return { rows: [], errors: ["The file has no data rows. Download the template and fill at least one line."] };
  if (raw.length > 50) return { rows: [], errors: ["Import up to 50 requirements at a time."] };
  const [cats, skills] = await Promise.all([db.category.findMany(), db.skill.findMany()]);
  const catBy = new Map(cats.flatMap((c) => [[c.name.toLowerCase(), c.id], [c.slug, c.id]] as [string, string][]));
  const skillBy = new Map(skills.flatMap((s) => [[s.name.toLowerCase(), s.slug], [s.slug, s.slug]] as [string, string][]));
  const rows: ImportRow[] = raw.map((r, i) => {
    const errors: string[] = [];
    const title = r.title ?? "";
    if (title.length < 8) errors.push("title needs at least 8 characters");
    const category = r.category ?? "";
    if (!catBy.has(category.toLowerCase()) && !catBy.has(slugify(category))) errors.push(`unknown category “${category}”`);
    const skillNames = (r.skills ?? "").split(/[;|]/).map((s) => s.trim()).filter(Boolean);
    const skillSlugs = skillNames.map((s) => skillBy.get(s.toLowerCase()) ?? skillBy.get(slugify(s)) ?? null);
    skillSlugs.forEach((s, k) => { if (!s) errors.push(`unknown skill “${skillNames[k]}”`); });
    const mode = (r.mode ?? "").toUpperCase();
    if (!["ONSITE", "VIRTUAL", "HYBRID"].includes(mode)) errors.push("mode must be onsite, virtual or hybrid");
    const city = r.city ?? "";
    if (mode !== "VIRTUAL" && !city) errors.push("city is required unless mode is virtual");
    const start = new Date(r.start_date ?? ""), end = new Date(r.end_date ?? "");
    if (isNaN(start.getTime())) errors.push("start_date must be YYYY-MM-DD");
    if (isNaN(end.getTime())) errors.push("end_date must be YYYY-MM-DD");
    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end < start) errors.push("end_date is before start_date");
    const participants = Number(r.participants);
    if (!(participants >= 1)) errors.push("participants must be a number ≥ 1");
    const budgetMin = r.budget_min ? Number(r.budget_min) : null, budgetMax = r.budget_max ? Number(r.budget_max) : null;
    if (budgetMin !== null && isNaN(budgetMin)) errors.push("budget_min must be a number");
    if (budgetMax !== null && isNaN(budgetMax)) errors.push("budget_max must be a number");
    if (budgetMin !== null && budgetMax !== null && budgetMax < budgetMin) errors.push("budget_max is below budget_min");
    const currency = (r.currency || "INR").toUpperCase();
    if (!["INR", "USD"].includes(currency)) errors.push("currency must be INR or USD");
    const visibility = (r.visibility || "public").toUpperCase().replace("-", "_");
    if (!["PUBLIC", "INVITE_ONLY"].includes(visibility)) errors.push("visibility must be public or invite_only");
    const description = r.description ?? "";
    if (description.length < 40) errors.push("description needs at least 40 characters");
    return { line: i + 2, title, category, skills: skillSlugs.filter((s): s is string => !!s), mode, city, startDate: r.start_date ?? "", endDate: r.end_date ?? "", days: !isNaN(start.getTime()) && !isNaN(end.getTime()) && end >= start ? daysBetween(start, end) : 0, participants, budgetMin, budgetMax, currency, language: r.language || "English", visibility, description, errors };
  });
  return { rows, errors: [] };
}

/** Step 1 validates and previews; step 2 (confirm=1) creates. The CSV text travels in a hidden field so no server state is needed. */
export async function importRequirements(_p: ImportState, fd: FormData): Promise<ImportState> {
  const user = await requireUser();
  if (!user.membership) return { errors: ["Only company members can import requirements."] };
  const file = fd.get("file") as File | null;
  let text = String(fd.get("csv") ?? "");
  let fileName = String(fd.get("fileName") ?? "");
  if (file && file.size) { if (file.size > 2 * 1024 * 1024) return { errors: ["CSV must be under 2 MB."] }; text = await file.text(); fileName = file.name; }
  if (!text.trim()) return { errors: ["Choose a CSV file."] };
  const { rows, errors } = await validate(text);
  if (errors.length) return { errors, fileName };
  const bad = rows.filter((r) => r.errors.length);
  const confirm = String(fd.get("confirm")) === "1";
  if (!confirm || bad.length) return { rows, fileName, errors: bad.length ? [`${bad.length} row${bad.length > 1 ? "s" : ""} need fixing before import. Correct the file and upload again.`] : [] };

  const ent = await entitlementsFor(user);
  const companyId = user.membership.company.id;
  if (!ent.unlimitedRequirements) {
    const limit = Number((await db.setting.findUnique({ where: { key: "free_open_requirements" } }))?.value ?? 2);
    const open = await db.requirement.count({ where: { companyId, status: { in: ["OPEN", "SHORTLISTING"] } } });
    if (open + rows.length > limit) return { rows, fileName, errors: [`The free plan allows ${limit} open requirements and you already have ${open}. Upgrade to Company Growth to import ${rows.length} at once.`] };
  }
  const cats = await db.category.findMany();
  const catId = (name: string) => cats.find((c) => c.name.toLowerCase() === name.toLowerCase() || c.slug === slugify(name))!.id;
  let created = 0;
  for (const r of rows) {
    const start = new Date(r.startDate), end = new Date(r.endDate);
    const req = await db.requirement.create({ data: {
      companyId, postedById: user.id, title: r.title, description: r.description, categoryId: catId(r.category), mode: r.mode as "ONSITE" | "VIRTUAL" | "HYBRID", city: r.city || null,
      startDate: start, endDate: end, days: daysBetween(start, end), participants: r.participants, budgetMin: r.budgetMin, budgetMax: r.budgetMax, currency: r.currency, language: r.language,
      visibility: r.visibility as "PUBLIC" | "INVITE_ONLY", skills: { connect: r.skills.map((slug) => ({ slug })) },
    } });
    created++;
    if (r.visibility === "PUBLIC") {
      if (r.skills.length) {
        const matching = await db.trainerProfile.findMany({ where: { skills: { some: { slug: { in: r.skills } } } }, select: { userId: true } });
        await notify(matching.map((m) => m.userId), "requirement", "New requirement matches your skills", `${user.membership.company.name}: ${r.title}`, `/requirements/${req.id}`);
      }
      await alertRequirementSearches(req.id);
    }
  }
  revalidatePath("/requirements"); revalidatePath("/dashboard");
  return { created, fileName };
}
