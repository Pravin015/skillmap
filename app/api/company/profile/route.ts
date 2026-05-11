import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — fetch company profile (by slug query param or by current user)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");

  if (slug) {
    // Public lookup by slug
    const profile = await prisma.companyProfile.findUnique({
      where: { slug },
      include: { user: { select: { id: true, name: true, organisation: true } } },
    });
    if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Get open jobs for this company
    const jobs = await prisma.jobPosting.findMany({
      where: { company: profile.name, status: "ACTIVE" },
      include: { _count: { select: { applications: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // Get stats
    const totalJobs = await prisma.jobPosting.count({ where: { company: profile.name } });
    const totalHired = await prisma.application.count({ where: { job: { company: profile.name }, status: "HIRED" } });

    return NextResponse.json({ profile, jobs, stats: { totalJobs, totalHired } });
  }

  // Authenticated: get current user's company profile
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.companyProfile.findUnique({ where: { userId } });
  return NextResponse.json({ profile });
}

// POST — create or update company profile
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  const userRole = (session?.user as { role?: string })?.role;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (userRole !== "ORG" && userRole !== "ADMIN") return NextResponse.json({ error: "Only ORG users can manage company profiles" }, { status: 403 });

  const body = await req.json();
  const { name, slug, logo, industry, about, culture, website, location, size, founded, socialLinks } = body;

  if (!name || !slug) return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });

  // Sanitize slug
  const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");

  const profile = await prisma.companyProfile.upsert({
    where: { userId },
    update: { name, slug: cleanSlug, logo, industry, about, culture, website, location, size, founded, socialLinks: socialLinks || [] },
    create: { userId, name, slug: cleanSlug, logo, industry, about, culture, website, location, size, founded, socialLinks: socialLinks || [] },
  });

  return NextResponse.json({ profile });
}
