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

  // HR sees apps for their jobs
  if (userRole === "HR") {
    const apps = await prisma.application.findMany({
      where: { job: { postedById: userId } },
      include: {
        job: { select: { title: true, company: true } },
        user: {
          select: {
            name: true, email: true,
            profile: { select: { profileNumber: true, profileScore: true, fieldOfInterest: true, collegeName: true, skills: true, experienceLevel: true } },
          },
        },
      },
      orderBy: { appliedAt: "desc" },
    });
    return NextResponse.json({ applications: apps });
  }

  // ADMIN/ORG sees all
  const apps = await prisma.application.findMany({
    include: {
      job: { select: { title: true, company: true } },
      user: { select: { name: true, email: true } },
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

  // Calculate score match based on student profile vs job skills
  let scoreMatch = 0;
  const profile = await prisma.studentProfile.findUnique({ where: { userId } });
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
