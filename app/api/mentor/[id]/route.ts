import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET public mentor profile by mentorNumber — viewable by anyone logged in
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: mentorNumber } = await params;

  const profile = await prisma.mentorProfile.findUnique({
    where: { mentorNumber },
    include: {
      achievements: true,
      user: {
        select: { name: true, profileImage: true },
      },
    },
  });

  if (!profile) {
    return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
  }

  return NextResponse.json({
    mentor: {
      ...profile,
      userId: undefined,
      user: { name: profile.user.name, profileImage: profile.user.profileImage },
    },
  });
}
