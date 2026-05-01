import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — search candidates (HR/ORG/Admin)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as { role?: string })?.role;

  if (!session?.user || (userRole !== "HR" && userRole !== "ORG" && userRole !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";
  const domain = searchParams.get("domain") || "";
  const experience = searchParams.get("experience") || "";

  const profileWhere: Record<string, unknown> = {};
  if (domain) profileWhere.fieldOfInterest = { contains: domain, mode: "insensitive" };
  if (experience) profileWhere.experienceLevel = experience;

  const profiles = await prisma.studentProfile.findMany({
    where: {
      ...profileWhere,
      ...(query
        ? {
            OR: [
              { user: { is: { name: { contains: query, mode: "insensitive" as const } } } },
              { user: { is: { email: { contains: query, mode: "insensitive" as const } } } },
              { collegeName: { contains: query, mode: "insensitive" as const } },
              { fieldOfInterest: { contains: query, mode: "insensitive" as const } },
              { bio: { contains: query, mode: "insensitive" as const } },
              { skills: { has: query } },
            ],
          }
        : {}),
    },
    include: {
      user: { select: { id: true, name: true, email: true, degree: true, gradYear: true, phone: true } },
      experiences: { select: { company: true, role: true } },
    },
    orderBy: { profileScore: "desc" },
    take: 50,
  });

  return NextResponse.json({ candidates: profiles });
}
