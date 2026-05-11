import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  const userRole = (session?.user as { role?: string })?.role;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (userRole !== "ORG" && userRole !== "HR" && userRole !== "ADMIN") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Get the user's organisation
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { organisation: true } });
  const org = user?.organisation;
  if (!org) return NextResponse.json({ error: "No organisation found" }, { status: 400 });

  // Get all jobs for this organisation
  const jobs = await prisma.jobPosting.findMany({
    where: { company: org },
    include: {
      applications: { select: { id: true, status: true, scoreMatch: true, appliedAt: true, userId: true } },
      postedBy: { select: { id: true, name: true } },
      _count: { select: { applications: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Hiring funnel
  const allApps = jobs.flatMap((j) => j.applications);
  const funnel = {
    applied: allApps.filter((a) => a.status === "APPLIED").length,
    screening: allApps.filter((a) => a.status === "SCREENING").length,
    interview: allApps.filter((a) => a.status === "INTERVIEW").length,
    assessment: allApps.filter((a) => a.status === "ASSESSMENT").length,
    offer: allApps.filter((a) => a.status === "OFFER").length,
    hired: allApps.filter((a) => a.status === "HIRED").length,
    rejected: allApps.filter((a) => a.status === "REJECTED").length,
    total: allApps.length,
  };

  // Stats
  const activeJobs = jobs.filter((j) => j.status === "ACTIVE").length;
  const avgScoreMatch = allApps.length > 0
    ? Math.round(allApps.reduce((s, a) => s + a.scoreMatch, 0) / allApps.length)
    : 0;

  // HR performance
  const hrMap = new Map<string, { name: string; jobs: number; apps: number; hired: number }>();
  for (const job of jobs) {
    const hrId = job.postedBy.id;
    const hrName = job.postedBy.name;
    if (!hrMap.has(hrId)) hrMap.set(hrId, { name: hrName, jobs: 0, apps: 0, hired: 0 });
    const hr = hrMap.get(hrId)!;
    hr.jobs += 1;
    hr.apps += job.applications.length;
    hr.hired += job.applications.filter((a) => a.status === "HIRED").length;
  }
  const hrPerformance = Array.from(hrMap.entries()).map(([id, data]) => ({
    id, ...data,
    hireRate: data.apps > 0 ? Math.round((data.hired / data.apps) * 100) : 0,
  }));

  // Top jobs by applications
  const topJobs = jobs
    .map((j) => ({ id: j.id, title: j.title, status: j.status, applications: j._count.applications, hired: j.applications.filter((a) => a.status === "HIRED").length }))
    .sort((a, b) => b.applications - a.applications)
    .slice(0, 5);

  // Recent applications (last 10)
  const recentApps = allApps
    .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())
    .slice(0, 10);

  // Fetch names for recent apps
  const recentUserIds = recentApps.map((a) => a.userId);
  const recentUsers = await prisma.user.findMany({
    where: { id: { in: recentUserIds } },
    select: { id: true, name: true, email: true },
  });
  const userMap = new Map(recentUsers.map((u) => [u.id, u]));

  const recentActivity = recentApps.map((a) => {
    const appUser = userMap.get(a.userId);
    const job = jobs.find((j) => j.applications.some((ap) => ap.id === a.id));
    return {
      id: a.id,
      candidateName: appUser?.name || "Unknown",
      candidateEmail: appUser?.email || "",
      jobTitle: job?.title || "Unknown",
      status: a.status,
      scoreMatch: a.scoreMatch,
      appliedAt: a.appliedAt,
    };
  });

  return NextResponse.json({
    funnel,
    stats: { activeJobs, totalJobs: jobs.length, totalApplications: allApps.length, hired: funnel.hired, avgScoreMatch },
    hrPerformance,
    topJobs,
    recentActivity,
  });
}
