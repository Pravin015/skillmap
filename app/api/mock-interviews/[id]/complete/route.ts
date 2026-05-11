import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const anthropic = new Anthropic();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const interview = await prisma.mockInterview.findUnique({
    where: { id },
    include: { company: true, responses: { orderBy: { order: "asc" } } },
  });

  if (!interview || interview.userId !== userId) {
    return NextResponse.json({ error: "Interview not found" }, { status: 404 });
  }

  const responses = interview.responses;
  const avgScore = responses.length > 0
    ? Math.round(responses.reduce((sum, r) => sum + (r.score || 0), 0) / responses.length * 10)
    : 0;

  // Generate summary feedback with AI
  let feedback = "";
  if (responses.length > 0) {
    const qaHistory = responses
      .map((r) => `Q: ${r.question}\nA: ${r.answer}\nScore: ${r.score}/10\nFeedback: ${r.aiFeedback}`)
      .join("\n\n");

    try {
      const result = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 512,
        messages: [{
          role: "user",
          content: `You are an interview coach. Based on this ${interview.interviewType} mock interview for ${interview.company.name}, provide a brief overall summary (3-5 sentences). Mention top strengths, key areas for improvement, and one specific actionable tip.\n\nInterview Q&A:\n${qaHistory}\n\nOverall Score: ${avgScore}/100`,
        }],
      });
      feedback = result.content[0].type === "text" ? result.content[0].text : "";
    } catch {
      feedback = `You scored ${avgScore}/100 across ${responses.length} questions. Review your individual question feedback for detailed improvement areas.`;
    }
  }

  const updated = await prisma.mockInterview.update({
    where: { id },
    data: {
      status: "COMPLETED",
      score: avgScore,
      feedback,
      completedAt: new Date(),
      questionsAsked: responses.length,
      duration: Math.round((Date.now() - interview.createdAt.getTime()) / 60000),
    },
    include: { company: true, responses: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json({ interview: updated });
}
