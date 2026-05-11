import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateProfileNumber } from "@/lib/profile-number";

// GET own profile
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "No user ID" }, { status: 400 });

  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    include: { experiences: true, certifications: true, user: { select: { name: true, email: true, degree: true, gradYear: true, phone: true } } },
  });

  return NextResponse.json({ profile });
}

// POST create or update profile
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "No user ID" }, { status: 400 });

  const body = await req.json();
  const {
    collegeName, experienceLevel, fieldOfInterest, bio,
    academicScore, academicType,
    salaryMin, salaryMax, availableToJoin, joinDate,
    resumeUrl, githubUrl, linkedinUrl, portfolioUrl, otherLinks,
    skills, experiences, certifications,
  } = body;

  // Calculate profile score
  let score = 0;
  if (collegeName) score += 8;
  if (fieldOfInterest) score += 7;
  if (bio && bio.length > 20) score += 5;
  if (academicScore) score += 10;
  if (resumeUrl) score += 15;
  if (githubUrl) score += 8;
  if (linkedinUrl) score += 7;
  if (skills?.length > 0) score += Math.min(skills.length * 3, 15);
  if (experiences?.length > 0) score += Math.min(experiences.length * 5, 15);
  if (certifications?.length > 0) score += Math.min(certifications.length * 5, 10);

  const existing = await prisma.studentProfile.findUnique({ where: { userId } });

  if (existing) {
    // Delete old experiences and certifications to replace
    await prisma.experience.deleteMany({ where: { profileId: existing.id } });
    await prisma.certification.deleteMany({ where: { profileId: existing.id } });

    const updated = await prisma.studentProfile.update({
      where: { userId },
      data: {
        collegeName, experienceLevel: experienceLevel || "FRESHER", fieldOfInterest, bio,
        academicScore, academicType,
        salaryMin: salaryMin ? parseInt(salaryMin) : null,
        salaryMax: salaryMax ? parseInt(salaryMax) : null,
        availableToJoin: availableToJoin ?? true,
        joinDate,
        resumeUrl, githubUrl, linkedinUrl, portfolioUrl,
        otherLinks: otherLinks || [],
        skills: skills || [],
        profileScore: score,
        experiences: {
          create: (experiences || []).map((exp: { company: string; role: string; startDate: string; endDate?: string; description?: string; current?: boolean }) => ({
            company: exp.company, role: exp.role, startDate: exp.startDate,
            endDate: exp.endDate || null, description: exp.description || null, current: exp.current || false,
          })),
        },
        certifications: {
          create: (certifications || []).map((cert: { title: string; issuer: string; issueDate?: string; imageUrl?: string }) => ({
            title: cert.title, issuer: cert.issuer,
            issueDate: cert.issueDate || null, imageUrl: cert.imageUrl || null,
          })),
        },
      },
      include: { experiences: true, certifications: true },
    });

    return NextResponse.json({ profile: updated });
  } else {
    const profileNumber = generateProfileNumber();

    const created = await prisma.studentProfile.create({
      data: {
        userId,
        profileNumber,
        collegeName, experienceLevel: experienceLevel || "FRESHER", fieldOfInterest, bio,
        academicScore, academicType,
        salaryMin: salaryMin ? parseInt(salaryMin) : null,
        salaryMax: salaryMax ? parseInt(salaryMax) : null,
        availableToJoin: availableToJoin ?? true,
        joinDate,
        resumeUrl, githubUrl, linkedinUrl, portfolioUrl,
        otherLinks: otherLinks || [],
        skills: skills || [],
        profileScore: score,
        experiences: {
          create: (experiences || []).map((exp: { company: string; role: string; startDate: string; endDate?: string; description?: string; current?: boolean }) => ({
            company: exp.company, role: exp.role, startDate: exp.startDate,
            endDate: exp.endDate || null, description: exp.description || null, current: exp.current || false,
          })),
        },
        certifications: {
          create: (certifications || []).map((cert: { title: string; issuer: string; issueDate?: string; imageUrl?: string }) => ({
            title: cert.title, issuer: cert.issuer,
            issueDate: cert.issueDate || null, imageUrl: cert.imageUrl || null,
          })),
        },
      },
      include: { experiences: true, certifications: true },
    });

    return NextResponse.json({ profile: created }, { status: 201 });
  }
}
