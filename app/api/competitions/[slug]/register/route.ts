import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const { teamName } = await req.json().catch(() => ({ teamName: null }));

  const competition = await prisma.competition.findUnique({
    where: { slug },
    include: { _count: { select: { participants: true } } },
  });

  if (!competition) return NextResponse.json({ error: "Competition not found" }, { status: 404 });
  if (competition.status !== "OPEN" && competition.status !== "LIVE") {
    return NextResponse.json({ error: "Registration is not open" }, { status: 400 });
  }
  if (new Date() > new Date(competition.registrationEnd)) {
    return NextResponse.json({ error: "Registration deadline has passed" }, { status: 400 });
  }
  if (competition._count.participants >= competition.maxParticipants) {
    return NextResponse.json({ error: "Competition is full" }, { status: 400 });
  }

  // Check if already registered
  const existing = await prisma.competitionParticipant.findUnique({
    where: { competitionId_userId: { competitionId: competition.id, userId } },
  });
  if (existing) return NextResponse.json({ error: "Already registered" }, { status: 400 });

  // If paid entry, check payment (simplified — in production would verify Razorpay)
  if (competition.entryFee && competition.entryFee > 0) {
    return NextResponse.json({
      requiresPayment: true,
      amount: competition.entryFee,
      competitionId: competition.id,
    });
  }

  const participant = await prisma.competitionParticipant.create({
    data: {
      competitionId: competition.id,
      userId,
      teamName: teamName || null,
      role: competition.teamSize > 1 ? "TEAM_LEADER" : "INDIVIDUAL",
    },
  });

  return NextResponse.json({ participant }, { status: 201 });
}
