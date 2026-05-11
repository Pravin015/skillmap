import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveImage } from "@/lib/resolve-image";

// GET — list verified mentors for students to browse
export async function GET() {
  const mentors = await prisma.mentorProfile.findMany({
    where: { status: "VERIFIED" },
    include: {
      user: { select: { name: true, profileImage: true } },
    },
    orderBy: { rating: "desc" },
    take: 20,
  });

  // Resolve profile images
  const resolved = await Promise.all(
    mentors.map(async (m) => ({
      ...m,
      user: { ...m.user, profileImage: await resolveImage(m.user.profileImage) },
    }))
  );

  return NextResponse.json({ mentors: resolved });
}
