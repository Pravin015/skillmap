import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

// GET — list applications (student sees own, HR sees their job's apps)
export async function GET() {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as { role?: string })?.role;
  const userId = (session?.user as { id?: string })?.id;

  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (userRole === "STUDENT") {
    const apps = await prisma.application.findMany({
      where: { userId },
      include: {
        job: { select: { title: true, company: true, location: true, status: true, workMode: true } },
      },
      orderBy: { appliedAt: "desc" },
    });
    return NextResponse.json({ applications: apps });
  }

  // HR sees apps for their jobs.
  // Email + phone are ALWAYS exposed to HR even when the student profile
  // is incomplete — recruiters need a way to reach the candidate
  // regardless of profile completeness. Resume URL also surfaced for the
  // same reason (apply flow now mandates resume, so it should always exist).
  // gamifyScore + maxScore included so HR can see lab performance.
  if (userRole === "HR") {
    const apps = await prisma.application.findMany({
      where: { job: { postedById: userId } },
      include: {
        job: { select: { title: true, company: true, gamifyLabSlug: true, gamifyLabSlugs: true, gamifyMinScore: true } },
        user: {
          select: {
            name: true, email: true, phone: true,
            profile: { select: { profileNumber: true, profileScore: true, fieldOfInterest: true, collegeName: true, skills: true, experienceLevel: true, resumeUrl: true } },
          },
        },
      },
      orderBy: { appliedAt: "desc" },
    });
    return NextResponse.json({ applications: apps });
  }

  // ADMIN/ORG sees all + same direct-contact fields.
  const apps = await prisma.application.findMany({
    include: {
      job: { select: { title: true, company: true } },
      user: {
        select: {
          name: true, email: true, phone: true,
          profile: { select: { resumeUrl: true } },
        },
      },
    },
    orderBy: { appliedAt: "desc" },
  });
  return NextResponse.json({ applications: apps });
}

// POST — student applies to job
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as { role?: string })?.role;
  const userId = (session?.user as { id?: string })?.id;

  if (!session?.user || userRole !== "STUDENT") {
    return NextResponse.json({ error: "Only students can apply" }, { status: 403 });
  }

  const { jobId, coverNote } = await req.json();
  if (!jobId) return NextResponse.json({ error: "Job ID required" }, { status: 400 });

  // Check job exists and is active
  const job = await prisma.jobPosting.findUnique({ where: { id: jobId } });
  if (!job || job.status !== "ACTIVE") {
    return NextResponse.json({ error: "Job not found or not active" }, { status: 404 });
  }

  // Check not already applied
  const existing = await prisma.application.findUnique({
    where: { jobId_userId: { jobId, userId: userId! } },
  });
  if (existing) {
    return NextResponse.json({ error: "Already applied to this job" }, { status: 409 });
  }

  // Mandatory resume check — every application must have a resume on file.
  // We treat this as a hard gate: HR's most-requested artefact is the resume,
  // and applications without one rarely convert.
  const profile = await prisma.studentProfile.findUnique({ where: { userId } });
  if (!profile?.resumeUrl) {
    return NextResponse.json(
      {
        error: "Resume required",
        code: "NO_RESUME",
        message: "Upload your resume before applying. Recruiters use it to shortlist within minutes.",
      },
      { status: 400 }
    );
  }

  // Lab gate — if the job lists one or more gamify labs, the student must have
  // a COMPLETED attempt with a passing score for EVERY listed lab before
  // applying. Webhooks from gamify populate ExternalLabAttempt; we read it
  // per-lab here.
  //
  // Required slugs come from the new array field, falling back to the legacy
  // single field for rows created before multi-lab landed.
  const requiredLabSlugs: string[] = (job.gamifyLabSlugs?.length ? job.gamifyLabSlugs : (job.gamifyLabSlug ? [job.gamifyLabSlug] : []));

  interface AttemptSnap { slug: string; score: number | null; maxScore: number | null; sessionId: string | null; completedAt: Date | null }
  const attemptsBySlug: AttemptSnap[] = [];
  // Legacy single-field result, kept populated for back-compat with readers
  // built before multi-lab (HR cards, analytics).
  let bestAttempt: { score: number | null; maxScore: number | null; sessionId: string | null } = { score: null, maxScore: null, sessionId: null };

  if (requiredLabSlugs.length > 0) {
    const allAttempts = await prisma.externalLabAttempt.findMany({
      where: {
        userId,
        labSlug: { in: requiredLabSlugs },
        status: { in: ["COMPLETED", "FLAG_CAPTURED"] },
      },
      orderBy: [{ score: "desc" }, { completedAt: "desc" }],
      select: { labSlug: true, score: true, maxScore: true, sessionId: true, completedAt: true },
    });

    // Keep highest-scoring attempt per slug (first occurrence after the sort).
    const bestPerSlug = new Map<string, typeof allAttempts[number]>();
    for (const a of allAttempts) {
      if (!bestPerSlug.has(a.labSlug)) bestPerSlug.set(a.labSlug, a);
    }

    const missing: string[] = [];
    const tooLow: { slug: string; yourScore: number | null; minScore: number }[] = [];

    for (const slug of requiredLabSlugs) {
      const a = bestPerSlug.get(slug);
      if (!a) { missing.push(slug); continue; }
      if (job.gamifyMinScore && (a.score ?? 0) < job.gamifyMinScore) {
        tooLow.push({ slug, yourScore: a.score, minScore: job.gamifyMinScore });
        continue;
      }
      attemptsBySlug.push({ slug, score: a.score, maxScore: a.maxScore, sessionId: a.sessionId, completedAt: a.completedAt });
    }

    if (missing.length > 0) {
      return NextResponse.json(
        {
          error: "Lab required",
          code: "LAB_REQUIRED",
          labSlugs: missing,
          labSlug: missing[0],                     // legacy
          minScore: job.gamifyMinScore,
          message: missing.length === 1
            ? `This job requires you to complete a hands-on lab first. Open the lab below — once you complete it, come back here and apply.`
            : `This job requires ${requiredLabSlugs.length} hands-on labs. You still need to complete ${missing.length} of them before applying.`,
        },
        { status: 400 }
      );
    }

    if (tooLow.length > 0) {
      const first = tooLow[0];
      return NextResponse.json(
        {
          error: "Lab score too low",
          code: "LAB_SCORE_LOW",
          labSlugs: tooLow.map((t) => t.slug),
          labSlug: first.slug,                     // legacy
          yourScore: first.yourScore,
          minScore: first.minScore,
          message: tooLow.length === 1
            ? `You scored ${first.yourScore} on ${first.slug} but ${first.minScore}+ is required. Try the lab again.`
            : `${tooLow.length} of your lab scores are below the ${first.minScore}+ threshold required for this role. Retry them and re-apply.`,
        },
        { status: 400 }
      );
    }

    // All required labs cleared. Legacy single-field = top-scoring across all.
    const topAttempt = attemptsBySlug.slice().sort((x, y) => (y.score ?? 0) - (x.score ?? 0))[0];
    if (topAttempt) {
      bestAttempt = { score: topAttempt.score, maxScore: topAttempt.maxScore, sessionId: topAttempt.sessionId };
    }
  }

  // Calculate score match based on student profile vs job skills
  let scoreMatch = 0;
  if (profile && job.skills.length > 0) {
    const studentSkills = profile.skills.map((s) => s.toLowerCase());
    const matched = job.skills.filter((s) => studentSkills.some((ss) => ss.includes(s.toLowerCase()) || s.toLowerCase().includes(ss)));
    scoreMatch = Math.round((matched.length / job.skills.length) * 100);
  }
  // Boost score with profile score
  if (profile?.profileScore) {
    scoreMatch = Math.round(scoreMatch * 0.6 + profile.profileScore * 0.4);
  }

  const application = await prisma.application.create({
    data: {
      jobId,
      userId: userId!,
      coverNote: coverNote || null,
      scoreMatch: Math.min(scoreMatch, 100),
      gamifyScore: bestAttempt.score,
      gamifyMaxScore: bestAttempt.maxScore,
      gamifySessionId: bestAttempt.sessionId,
      // Per-lab snapshot for multi-lab jobs. Captured at apply-time so HR
      // sees exactly what the candidate had then, even if they re-attempt
      // a lab later. Null for jobs with zero or one required lab — the
      // legacy single fields above already cover that case.
      gamifyAttempts: attemptsBySlug.length > 1
        ? attemptsBySlug.map((a) => ({
            slug: a.slug,
            score: a.score,
            maxScore: a.maxScore,
            sessionId: a.sessionId,
            completedAt: a.completedAt?.toISOString() || null,
          }))
        : undefined,
    },
  });

  const studentUser = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });

  // Notify student
  createNotification({
    userId: userId!,
    type: "APPLICATION_SUBMITTED",
    title: `Applied for ${job.title}`,
    message: `Your application for ${job.title} at ${job.company} has been submitted. Skill match: ${application.scoreMatch}%.`,
    data: { role: job.title, company: job.company, score: application.scoreMatch.toString() },
  }).catch(() => {});

  // Notify HR who posted the job
  createNotification({
    userId: job.postedById,
    type: application.scoreMatch >= 90 ? "HR_HIGH_MATCH_CANDIDATE" : "HR_NEW_APPLICATION",
    title: `New application for ${job.title}`,
    message: `${studentUser?.name || "A candidate"} applied for ${job.title}. Skill match: ${application.scoreMatch}%.`,
    data: { role: job.title, candidateName: studentUser?.name || "Candidate", score: application.scoreMatch.toString() },
  }).catch(() => {});

  return NextResponse.json({ application }, { status: 201 });
}
