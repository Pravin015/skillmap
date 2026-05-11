import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveImage } from "@/lib/resolve-image";

// GET public profile by profileNumber
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: profileNumber } = await params;

  const session = await getServerSession(authOptions);
  const userRole = (session?.user as { role?: string })?.role;
  const viewerId = (session?.user as { id?: string })?.id;

  if (!session?.user) {
    return NextResponse.json({ error: "Please login to view profiles" }, { status: 401 });
  }

  const profile = await prisma.studentProfile.findUnique({
    where: { profileNumber },
    include: {
      experiences: true,
      certifications: true,
      user: {
        select: { name: true, email: true, degree: true, gradYear: true, phone: true, profileImage: true },
      },
    },
  });

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Students can only view their own profile
  if (userRole === "STUDENT" && profile.userId !== viewerId) {
    return NextResponse.json({ error: "You can only view your own profile" }, { status: 403 });
  }

  const isOwner = profile.userId === viewerId;

  // Track profile view for HR/ORG/ADMIN (not own views)
  if (!isOwner && viewerId && (userRole === "HR" || userRole === "ORG" || userRole === "ADMIN")) {
    try {
      await prisma.profileView.upsert({
        where: { viewerId_profileId: { viewerId, profileId: profile.id } },
        update: { viewedAt: new Date() },
        create: { viewerId, profileId: profile.id },
      });
    } catch { /* ignore duplicates */ }
  }

  // Get total view count
  const viewCount = await prisma.profileView.count({ where: { profileId: profile.id } });

  return NextResponse.json({
    profile: {
      ...profile,
      userId: undefined,
      user: {
        name: profile.user.name,
        degree: profile.user.degree,
        gradYear: profile.user.gradYear,
        profileImage: await resolveImage(profile.user.profileImage),
        email: (isOwner || userRole === "HR" || userRole === "ORG" || userRole === "ADMIN") ? profile.user.email : undefined,
        phone: (isOwner || userRole === "HR" || userRole === "ORG" || userRole === "ADMIN") ? profile.user.phone : undefined,
      },
    },
    isOwner,
    viewerRole: userRole,
    viewCount,
  });
}
