import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — mentor's own profile
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.mentorProfile.findUnique({
    where: { userId },
    include: { achievements: true },
  });

  return NextResponse.json({ profile });
}

// POST — update mentor profile
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { headline, bio, currentCompany, currentRole, collegeName, yearsOfExperience, areaOfExpertise, mentorTopics, compensation, sessionRate, groupSessionRate, availability, linkedinUrl } = body;

  const existing = await prisma.mentorProfile.findUnique({ where: { userId } });
  if (!existing) return NextResponse.json({ error: "No mentor profile found" }, { status: 404 });

  const updated = await prisma.mentorProfile.update({
    where: { userId },
    data: {
      headline: headline || null, bio: bio || null, currentCompany: currentCompany || null,
      currentRole: currentRole || null, collegeName: collegeName || null,
      yearsOfExperience: yearsOfExperience ? parseInt(yearsOfExperience) : existing.yearsOfExperience,
      areaOfExpertise: areaOfExpertise || existing.areaOfExpertise,
      mentorTopics: mentorTopics || existing.mentorTopics,
      compensation: compensation || existing.compensation,
      sessionRate: sessionRate ? parseInt(sessionRate) : existing.sessionRate,
      groupSessionRate: groupSessionRate ? parseInt(groupSessionRate) : existing.groupSessionRate,
      availability: availability || existing.availability,
      linkedinUrl: linkedinUrl || existing.linkedinUrl,
    },
  });

  return NextResponse.json({ profile: updated });
}
