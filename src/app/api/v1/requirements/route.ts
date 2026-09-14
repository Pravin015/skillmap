import { z } from "zod";
import { db } from "@/lib/db";
import { apiHandler, ApiError, json, page, pagination } from "@/lib/api-auth";
import { requirementSelect, shapeRequirement } from "@/lib/api-shapes";
import { daysBetween } from "@/lib/utils";
import { notify } from "@/lib/notify";
import { alertRequirementSearches } from "@/lib/saved-searches";
import { entitlementsFor } from "@/lib/billing";

/** GET /api/v1/requirements?status=OPEN&limit=50&cursor=… — the calling company's requirements. */
export const GET = apiHandler(async (req, _ctx, auth) => {
  const { url, limit, cursor } = pagination(req);
  const status = url.searchParams.get("status")?.toUpperCase();
  const rows = await db.requirement.findMany({
    where: { companyId: auth.company.id, ...(status && ["OPEN", "SHORTLISTING", "AWARDED", "COMPLETED", "CANCELLED"].includes(status) ? { status: status as "OPEN" } : {}) },
    select: requirementSelect, orderBy: { createdAt: "desc" }, take: limit + 1, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const p = page(rows, limit);
  return json({ data: p.data.map(shapeRequirement), next_cursor: p.next_cursor });
});

const createSchema = z.object({
  title: z.string().trim().min(8),
  description: z.string().trim().min(40),
  category: z.string().min(1, "category slug is required"),
  skills: z.array(z.string()).default([]),
  mode: z.enum(["ONSITE", "VIRTUAL", "HYBRID"]),
  city: z.string().trim().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  participants: z.number().int().min(1),
  budget_min: z.number().int().optional(),
  budget_max: z.number().int().optional(),
  currency: z.enum(["INR", "USD"]).default("INR"),
  language: z.string().trim().default("English"),
  visibility: z.enum(["PUBLIC", "INVITE_ONLY"]).default("PUBLIC"),
  posted_by_email: z.string().email().optional(),
});

/** POST /api/v1/requirements — create a requirement on behalf of the company (posted by the first admin member unless posted_by_email names a member). */
export const POST = apiHandler(async (req, _ctx, auth) => {
  let body: unknown;
  try { body = await req.json(); } catch { throw new ApiError(400, "Body must be JSON."); }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) throw new ApiError(422, `${parsed.error.issues[0].path.join(".")}: ${parsed.error.issues[0].message}`);
  const d = parsed.data;
  const start = new Date(d.start_date), end = new Date(d.end_date);
  if (end < start) throw new ApiError(422, "end_date must be on or after start_date");
  if (d.mode !== "VIRTUAL" && !d.city) throw new ApiError(422, "city is required for ONSITE and HYBRID");
  const category = await db.category.findUnique({ where: { slug: d.category } });
  if (!category) throw new ApiError(422, `Unknown category slug "${d.category}". GET /categories for the list.`);
  const skills = d.skills.length ? await db.skill.findMany({ where: { slug: { in: d.skills } }, select: { slug: true } }) : [];
  const members = await db.companyMember.findMany({ where: { companyId: auth.company.id }, include: { user: { select: { id: true, email: true } } }, orderBy: { joinedAt: "asc" } });
  const poster = (d.posted_by_email ? members.find((m) => m.user.email === d.posted_by_email!.toLowerCase()) : undefined) ?? members[0];
  if (!poster) throw new ApiError(409, "The company has no members to post as.");
  const ent = await entitlementsFor({ id: poster.user.id, role: "COMPANY", membership: { company: { id: auth.company.id } } });
  if (!ent.unlimitedRequirements) {
    const openFreeLimit = Number((await db.setting.findUnique({ where: { key: "free_open_requirements" } }))?.value ?? 2);
    const openCount = await db.requirement.count({ where: { companyId: auth.company.id, status: { in: ["OPEN", "SHORTLISTING"] } } });
    if (openCount >= openFreeLimit) throw new ApiError(402, `The free plan allows ${openFreeLimit} open requirements. Upgrade to Company Growth for unlimited posts.`);
  }
  const created = await db.requirement.create({
    data: {
      companyId: auth.company.id, postedById: poster.user.id, title: d.title, description: d.description, categoryId: category.id, mode: d.mode, city: d.city ?? null,
      startDate: start, endDate: end, days: daysBetween(start, end), participants: d.participants, budgetMin: d.budget_min ?? null, budgetMax: d.budget_max ?? null,
      currency: d.currency, language: d.language, visibility: d.visibility, skills: { connect: skills.map((s) => ({ slug: s.slug })) },
    },
    select: requirementSelect,
  });
  if (d.visibility === "PUBLIC" && skills.length) {
    const matching = await db.trainerProfile.findMany({ where: { skills: { some: { slug: { in: skills.map((s) => s.slug) } } } }, select: { userId: true } });
    await notify(matching.map((m) => m.userId), "requirement", "New requirement matches your skills", `${auth.company.name}: ${d.title}`, `/requirements/${created.id}`);
  }
  if (d.visibility === "PUBLIC") await alertRequirementSearches(created.id);
  return json({ data: shapeRequirement(created) }, 201);
});
