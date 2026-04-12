import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

// GET — list jobs (filtered by role)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as { role?: string })?.role;
  const userId = (session?.user as { id?: string })?.id;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const company = searchParams.get("company");
  const domain = searchParams.get("domain");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (company) where.company = { contains: company, mode: "insensitive" };
  if (domain) where.domain = domain;

  // HR sees only their own posts
  if (userRole === "HR") {
    where.postedById = userId;
  }
  // ORG sees posts from their company's HRs
  if (userRole === "ORG") {
    const orgUser = await prisma.user.findUnique({ where: { id: userId } });
    if (orgUser?.organisation) {
      where.company = orgUser.organisation;
    }
  }
  // Students see only ACTIVE jobs
  if (userRole === "STUDENT") {
    where.status = "ACTIVE";
  }

  const jobs = await prisma.jobPosting.findMany({
    where,
    include: {
      postedBy: { select: { name: true, email: true, organisation: true } },
      _count: { select: { applications: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ jobs });
}

// POST — create job (HR or ORG only)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as { role?: string })?.role;
  const userId = (session?.user as { id?: string })?.id;

  if (!session?.user || (userRole !== "HR" && userRole !== "ORG" && userRole !== "ADMIN")) {
    return NextResponse.json({ error: "Only HR, ORG, or Admin can post jobs" }, { status: 403 });
  }

  const body = await req.json();
  const { title, company, location, workMode, salaryMin, salaryMax, experienceLevel, urgency, jobType, domain, department, description, skills, perks, deadline, openings } = body;

  if (!title || !location || !workMode || !experienceLevel || !urgency || !jobType || !description) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Auto-fill company from user profile if not provided
  let companyName = company;
  if (!companyName) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    companyName = user?.organisation || user?.name || "Unknown";
  }

  const job = await prisma.jobPosting.create({
    data: {
      postedById: userId!,
      title,
      company: companyName,
      location,
      workMode,
      salaryMin: salaryMin ? parseInt(salaryMin) : null,
      salaryMax: salaryMax ? parseInt(salaryMax) : null,
      experienceLevel,
      urgency,
      jobType,
      domain: domain || null,
      department: department || null,
      description,
      skills: skills || [],
      perks: perks || null,
      deadline: deadline ? new Date(deadline) : null,
      openings: openings ? parseInt(openings) : 1,
    },
  });

  // Notify the company admin if HR posted it
  if (userRole === "HR") {
    const hrUser = await prisma.user.findUnique({ where: { id: userId }, select: { organisation: true, name: true } });
    if (hrUser?.organisation) {
      const companyAdmin = await prisma.user.findFirst({ where: { role: "ORG", organisation: hrUser.organisation } });
      if (companyAdmin) {
        createNotification({ userId: companyAdmin.id, type: "COMPANY_JOB_POSTED", title: `New job posted: ${title}`, message: `${hrUser.name} posted a new job: ${title} in ${location}.`, data: { role: title, location, workMode, hrName: hrUser.name, company: companyName } }).catch(() => {});
      }
    }
  }

  return NextResponse.json({ job }, { status: 201 });
}
