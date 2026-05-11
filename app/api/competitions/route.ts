import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const status = searchParams.get("status");
  const domain = searchParams.get("domain");
  const mine = searchParams.get("mine");

  const where: Record<string, unknown> = {};
  if (type) where.type = type;
  if (status) where.status = status;
  else where.status = { in: ["OPEN", "LIVE", "JUDGING", "COMPLETED"] }; // public sees active ones
  if (domain) where.domain = domain;

  if (mine === "true") {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;
    if (userId) where.createdById = userId;
    // Show all statuses for own competitions
    delete where.status;
  }

  const competitions = await prisma.competition.findMany({
    where,
    include: { _count: { select: { participants: true, submissions: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ competitions });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  const userRole = (session?.user as { role?: string })?.role;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (userRole !== "HR" && userRole !== "ORG" && userRole !== "ADMIN") {
    return NextResponse.json({ error: "Only HR, ORG, or Admin can create competitions" }, { status: 403 });
  }

  const body = await req.json();
  const { title, description, rules, prizes, type, difficulty, domain,
    registrationStart, registrationEnd, startDate, endDate,
    maxParticipants, teamSize, labTemplateId, entryFee,
    companyName, companyLogo, hiringEnabled } = body;

  if (!title || !description || !registrationStart || !startDate || !endDate) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").slice(0, 60) + "-" + Date.now().toString(36);

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { organisation: true } });

  const competition = await prisma.competition.create({
    data: {
      createdById: userId,
      title, slug, description, rules, prizes,
      type: type || "HACKATHON",
      difficulty: difficulty || "MEDIUM",
      domain,
      registrationStart: new Date(registrationStart),
      registrationEnd: new Date(registrationEnd || startDate),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      maxParticipants: maxParticipants || 500,
      teamSize: teamSize || 1,
      labTemplateId,
      entryFee: entryFee ? parseInt(entryFee) : null,
      companyName: companyName || user?.organisation || "",
      companyLogo,
      hiringEnabled: hiringEnabled || false,
      status: userRole === "ADMIN" ? "OPEN" : "DRAFT", // Admin auto-publishes
    },
  });

  return NextResponse.json({ competition }, { status: 201 });
}
