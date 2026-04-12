import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

  return NextResponse.json({ mentors });
}
