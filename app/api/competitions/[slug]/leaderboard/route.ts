import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const competition = await prisma.competition.findUnique({
    where: { slug },
    select: { id: true, title: true, type: true, hiringEnabled: true, status: true },
  });

  if (!competition) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const submissions = await prisma.competitionSubmission.findMany({
    where: { competitionId: competition.id },
    orderBy: { totalScore: "desc" },
    take: 100,
  });

  // Fetch user names
  const userIds = submissions.map((s) => s.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true, profile: { select: { collegeName: true } } },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  // Assign ranks
  const leaderboard = submissions.map((s, i) => {
    const user = userMap.get(s.userId);
    return {
      rank: i + 1,
      userId: s.userId,
      name: user?.name || "Unknown",
      email: user?.email || "",
      college: user?.profile?.collegeName || "",
      score: s.totalScore,
      submittedAt: s.submittedAt,
      submissionUrl: s.submissionUrl,
    };
  });

  return NextResponse.json({ competition, leaderboard });
}
