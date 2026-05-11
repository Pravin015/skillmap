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

  // Lab status — non-blocking. As of the soft-gate flow, students can
  // apply at any time; whatever labs they've completed (and at what
  // score) is captured on the Application so HR can see "lab attempted"
  // vs "lab pending" per gated lab. If anything is still pending after
  // apply we create a PendingApplyIntent so the reminder cron + dashboard
  // banner nudge the student to finish — but Apply itself never fails
  // on labs.
  const requiredLabSlugs: string[] = (job.gamifyLabSlugs?.length ? job.gamifyLabSlugs : (job.gamifyLabSlug ? [job.gamifyLabSlug] : []));

  interface AttemptSnap { slug: string; score: number | null; maxScore: number | null; sessionId: string | null; completedAt: Date | null; status: "passed" | "below_threshold" | "not_attempted" }
  const attemptsBySlug: AttemptSnap[] = [];
  // Legacy single-field result, kept populated for back-compat with readers
  // built before multi-lab (HR cards, analytics). Holds the top passing
  // attempt across all gated labs, or null if none passed yet.
  let bestAttempt: { score: number | null; maxScore: number | null; sessionId: string | null } = { score: null, maxScore: null, sessionId: null };
  let stillPendingLabs: string[] = [];

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
    const bestPerSlug = new Map<string, typeof allAttempts[number]>();
    for (const a of allAttempts) {
      if (!bestPerSlug.has(a.labSlug)) bestPerSlug.set(a.labSlug, a);
    }

    for (const slug of requiredLabSlugs) {
      const a = bestPerSlug.get(slug);
      if (!a) {
        attemptsBySlug.push({ slug, score: null, maxScore: null, sessionId: null, completedAt: null, status: "not_attempted" });
        stillPendingLabs.push(slug);
        continue;
      }
      const passed = !job.gamifyMinScore || (a.score ?? 0) >= job.gamifyMinScore;
      attemptsBySlug.push({
        slug,
        score: a.score,
        maxScore: a.maxScore,
        sessionId: a.sessionId,
        completedAt: a.completedAt,
        status: passed ? "passed" : "below_threshold",
      });
      if (!passed) stillPendingLabs.push(slug);
    }

    // Legacy bestAttempt = highest-scoring passing attempt across all labs.
    const topPassed = attemptsBySlug
      .filter((a) => a.status === "passed")
      .sort((x, y) => (y.score ?? 0) - (x.score ?? 0))[0];
    if (topPassed) {
      bestAttempt = { score: topPassed.score, maxScore: topPassed.maxScore, sessionId: topPassed.sessionId };
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
      // Per-lab snapshot — always captured when the job has gated labs so
      // HR can see "passed / below_threshold / not_attempted" per lab even
      // for a single-lab job. Status field on each entry is the source of
      // truth for the HR card render.
      gamifyAttempts: attemptsBySlug.length > 0
        ? attemptsBySlug.map((a) => ({
            slug: a.slug,
            score: a.score,
            maxScore: a.maxScore,
            sessionId: a.sessionId,
            completedAt: a.completedAt?.toISOString() || null,
            status: a.status,
          }))
        : undefined,
    },
  });

  // Apply succeeded. If any required lab is still pending, keep a
  // PendingApplyIntent so the dashboard banner + reminder cron nudge the
  // student to finish (their HR card will still show empty slots otherwise).
  // If all labs are clear, delete any lingering intent — nothing to nag about.
  if (requiredLabSlugs.length > 0 && stillPendingLabs.length > 0) {
    await prisma.pendingApplyIntent.upsert({
      where: { userId_jobId: { userId: userId!, jobId } },
      create: { userId: userId!, jobId, lastBlockedLab: stillPendingLabs[0] },
      update: { lastBlockedLab: stillPendingLabs[0], updatedAt: new Date() },
    }).catch(() => {});
  } else {
    await prisma.pendingApplyIntent.deleteMany({
      where: { userId: userId!, jobId },
    }).catch(() => {});
  }

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
