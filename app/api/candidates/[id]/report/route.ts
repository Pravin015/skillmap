import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as { role?: string })?.role;
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (userRole !== "HR" && userRole !== "ORG" && userRole !== "ADMIN") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { id } = await params;

  // Get user with profile
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, phone: true, degree: true, gradYear: true, profileImage: true,
      profile: {
        select: {
          collegeName: true, experienceLevel: true, fieldOfInterest: true, bio: true,
          skills: true, resumeUrl: true, githubUrl: true, linkedinUrl: true, portfolioUrl: true,
          profileScore: true, salaryMin: true, salaryMax: true, availableToJoin: true, joinDate: true,
          experiences: true, certifications: true,
        },
      },
    },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Lab attempts
  const labAttempts = await prisma.labAttempt.findMany({
    where: { userId: id },
    include: { labTemplate: { select: { title: true, domain: true, difficulty: true } } },
    orderBy: { startedAt: "desc" },
    take: 10,
  });

  // Mock interview scores
  const mockInterviews = await prisma.mockInterview.findMany({
    where: { userId: id, status: "COMPLETED" },
    include: { company: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  // Applications history
  const applications = await prisma.application.findMany({
    where: { userId: id },
    include: { job: { select: { title: true, company: true } } },
    orderBy: { appliedAt: "desc" },
    take: 10,
  });

  // Compute summary scores
  const labAvg = labAttempts.length > 0
    ? Math.round(labAttempts.reduce((s, a) => s + a.percentage, 0) / labAttempts.length)
    : null;
  const mockAvg = mockInterviews.length > 0
    ? Math.round(mockInterviews.reduce((s, i) => s + (i.score || 0), 0) / mockInterviews.length)
    : null;

  return NextResponse.json({
    user,
    labAttempts: labAttempts.map((a) => ({
      lab: a.labTemplate.title,
      domain: a.labTemplate.domain,
      difficulty: a.labTemplate.difficulty,
      score: a.score,
      percentage: a.percentage,
      passed: a.passed,
      date: a.startedAt,
    })),
    mockInterviews: mockInterviews.map((i) => ({
      company: i.company.name,
      type: i.interviewType,
      difficulty: i.difficulty,
      score: i.score,
      date: i.createdAt,
    })),
    applications: applications.map((a) => ({
      job: a.job.title,
      company: a.job.company,
      status: a.status,
      scoreMatch: a.scoreMatch,
      date: a.appliedAt,
    })),
    summary: {
      profileScore: user.profile?.profileScore || 0,
      labAvgScore: labAvg,
      mockInterviewAvg: mockAvg,
      labsCompleted: labAttempts.length,
      interviewsCompleted: mockInterviews.length,
      totalApplications: applications.length,
    },
  });
}
