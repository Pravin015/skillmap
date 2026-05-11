import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  const competition = await prisma.competition.findUnique({
    where: { slug },
    include: {
      createdBy: { select: { name: true, organisation: true } },
      _count: { select: { participants: true, submissions: true } },
    },
  });

  if (!competition) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Check if current user is registered
  let isRegistered = false;
  let hasSubmitted = false;
  if (userId) {
    const participant = await prisma.competitionParticipant.findUnique({
      where: { competitionId_userId: { competitionId: competition.id, userId } },
    });
    isRegistered = !!participant;

    const submission = await prisma.competitionSubmission.findUnique({
      where: { competitionId_userId: { competitionId: competition.id, userId } },
    });
    hasSubmitted = !!submission;
  }

  return NextResponse.json({ competition, isRegistered, hasSubmitted });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  const userRole = (session?.user as { role?: string })?.role;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const body = await req.json();

  const competition = await prisma.competition.findUnique({ where: { slug } });
  if (!competition) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only creator or admin can update
  if (competition.createdById !== userId && userRole !== "ADMIN") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const updated = await prisma.competition.update({
    where: { slug },
    data: {
      ...(body.status && { status: body.status }),
      ...(body.title && { title: body.title }),
      ...(body.description && { description: body.description }),
      ...(body.rules !== undefined && { rules: body.rules }),
      ...(body.prizes !== undefined && { prizes: body.prizes }),
    },
  });

  return NextResponse.json({ competition: updated });
}
