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
  const location = searchParams.get("location") || "";

  const where: Record<string, unknown> = {};
  const profileWhere: Record<string, unknown> = {};

  if (domain) profileWhere.fieldOfInterest = { contains: domain, mode: "insensitive" };
  if (experience) profileWhere.experienceLevel = experience;

  // Build the query conditions
  const profiles = await prisma.studentProfile.findMany({
    where: {
      ...profileWhere,
      ...(query
        ? {
            OR: [
              { user: { name: { contains: query, mode: "insensitive" } } },
              { collegeName: { contains: query, mode: "insensitive" } },
              { skills: { has: query } },
              { fieldOfInterest: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      user: { select: { name: true, email: true, degree: true, gradYear: true } },
    },
    orderBy: { profileScore: "desc" },
    take: 50,
  });

  return NextResponse.json({ candidates: profiles });
}
