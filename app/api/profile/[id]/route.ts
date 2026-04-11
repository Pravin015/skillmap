import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET public profile by profileNumber — visible to HR, ADMIN, mentors
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: profileNumber } = await params;

  const session = await getServerSession(authOptions);
  const userRole = (session?.user as { role?: string })?.role;

  // Only HR, ORG, ADMIN, and the student themselves can view
  if (!session?.user) {
    return NextResponse.json({ error: "Please login to view profiles" }, { status: 401 });
  }

  const profile = await prisma.studentProfile.findUnique({
    where: { profileNumber },
    include: {
      experiences: true,
      certifications: true,
      user: {
        select: { name: true, email: true, degree: true, gradYear: true },
      },
    },
  });

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Students can only view their own profile
  if (userRole === "STUDENT" && profile.userId !== (session.user as { id?: string })?.id) {
    return NextResponse.json({ error: "You can only view your own profile" }, { status: 403 });
  }

  // Strip sensitive data for non-owners
  const isOwner = profile.userId === (session.user as { id?: string })?.id;

  return NextResponse.json({
    profile: {
      ...profile,
      userId: undefined, // hide internal ID
      user: {
        name: profile.user.name,
        degree: profile.user.degree,
        gradYear: profile.user.gradYear,
        email: isOwner ? profile.user.email : undefined, // hide email from non-owners
      },
    },
    isOwner,
    viewerRole: userRole,
  });
}
