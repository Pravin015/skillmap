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
  const { submissionUrl, submissionText, labAttemptId, score } = await req.json();

  const competition = await prisma.competition.findUnique({ where: { slug } });
  if (!competition) return NextResponse.json({ error: "Competition not found" }, { status: 404 });
  if (competition.status !== "LIVE" && competition.status !== "OPEN") {
    return NextResponse.json({ error: "Competition is not accepting submissions" }, { status: 400 });
  }

  // Check registered
  const participant = await prisma.competitionParticipant.findUnique({
    where: { competitionId_userId: { competitionId: competition.id, userId } },
  });
  if (!participant) return NextResponse.json({ error: "Not registered for this competition" }, { status: 400 });

  // Create or update submission
  const totalScore = score || 0;
  const submission = await prisma.competitionSubmission.upsert({
    where: { competitionId_userId: { competitionId: competition.id, userId } },
    update: { submissionUrl, submissionText, labAttemptId, score, totalScore, submittedAt: new Date() },
    create: { competitionId: competition.id, userId, submissionUrl, submissionText, labAttemptId, score, totalScore },
  });

  // Update participant status
  await prisma.competitionParticipant.update({
    where: { competitionId_userId: { competitionId: competition.id, userId } },
    data: { status: "SUBMITTED" },
  });

  return NextResponse.json({ submission }, { status: 201 });
}
