import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET single job with applications.
// `id` param accepts EITHER the cuid id OR the SEO slug. We try id
// first because old links / test data still use cuids; slug second.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const job = await prisma.jobPosting.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: {
      postedBy: { select: { name: true, email: true, organisation: true } },
      labTemplate: { select: { id: true, title: true, timeLimit: true, passingScore: true, difficulty: true } },
      applications: {
        include: {
          user: { select: { name: true, email: true, profile: { select: { profileNumber: true, profileScore: true, fieldOfInterest: true, collegeName: true, skills: true } } } },
        },
        orderBy: { appliedAt: "desc" },
      },
    },
  });

  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  return NextResponse.json({ job });
}

// PATCH — update a job posting. HR can edit their own; ADMIN can edit any.
// Accepts any subset of the editable fields; missing fields are left alone
// (Prisma `update` ignores undefined values automatically).
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as { role?: string })?.role;
  const userId = (session?.user as { id?: string })?.id;

  if (!session?.user || !userId || (userRole !== "HR" && userRole !== "ORG" && userRole !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  // Ownership check — HR can only edit their own postings. ADMIN bypasses.
  // ORG can edit any post from someone in their organisation.
  const job = await prisma.jobPosting.findUnique({
    where: { id },
    select: { postedById: true, postedBy: { select: { organisation: true } } },
  });
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  if (userRole === "HR" && job.postedById !== userId) {
    return NextResponse.json({ error: "You can only edit your own job posts" }, { status: 403 });
  }
  if (userRole === "ORG") {
    const me = await prisma.user.findUnique({ where: { id: userId }, select: { organisation: true } });
    if (!me?.organisation || me.organisation !== job.postedBy?.organisation) {
      return NextResponse.json({ error: "You can only edit jobs from your organisation" }, { status: 403 });
    }
  }

  const body = await req.json().catch(() => ({}));

  // Build a partial update object — only fields actually present get touched.
  const data: Record<string, unknown> = {};

  const passthrough = ["title", "location", "workMode", "experienceLevel", "urgency", "jobType", "domain", "department", "description", "perks", "status"] as const;
  for (const k of passthrough) {
    if (typeof body[k] === "string") data[k] = body[k];
  }

  if (body.salaryMin !== undefined) data.salaryMin = body.salaryMin === null || body.salaryMin === "" ? null : parseInt(String(body.salaryMin), 10);
  if (body.salaryMax !== undefined) data.salaryMax = body.salaryMax === null || body.salaryMax === "" ? null : parseInt(String(body.salaryMax), 10);
  if (body.openings !== undefined) {
    const n = parseInt(String(body.openings), 10);
    if (Number.isFinite(n) && n > 0) data.openings = n;
  }
  if (body.deadline !== undefined) {
    data.deadline = body.deadline ? new Date(body.deadline) : null;
  }
  if (Array.isArray(body.skills)) {
    data.skills = body.skills.filter((s: unknown): s is string => typeof s === "string");
  }

  // Multi-lab fields. Always store both shapes (arrays + legacy singletons)
  // for read-side back-compat — matches what POST /api/jobs does.
  if (Array.isArray(body.labTemplateIds)) {
    const labIds = Array.from(new Set(body.labTemplateIds.filter((s: unknown): s is string => typeof s === "string" && s.length > 0)));
    data.labTemplateIds = labIds;
    data.labTemplateId = labIds[0] || null;
  }
  if (Array.isArray(body.gamifyLabSlugs)) {
    const slugs = Array.from(new Set(body.gamifyLabSlugs.filter((s: unknown): s is string => typeof s === "string" && s.length > 0)));
    data.gamifyLabSlugs = slugs;
    data.gamifyLabSlug = slugs[0] || null;
  }
  if (body.gamifyMinScore !== undefined) {
    const n = Number(body.gamifyMinScore);
    data.gamifyMinScore = Number.isFinite(n) && n > 0 ? n : null;
  }

  const updated = await prisma.jobPosting.update({ where: { id }, data });

  return NextResponse.json({ job: updated });
}

// DELETE
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as { role?: string })?.role;

  if (!session?.user || (userRole !== "HR" && userRole !== "ORG" && userRole !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.jobPosting.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
