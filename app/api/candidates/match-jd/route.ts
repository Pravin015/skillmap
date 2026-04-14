import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

// POST — AI-powered JD matching
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as { role?: string })?.role;

  if (!session?.user || (userRole !== "HR" && userRole !== "ORG" && userRole !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { jobDescription } = await req.json();
  if (!jobDescription || jobDescription.length < 20) {
    return NextResponse.json({ error: "Please paste a detailed job description (min 20 characters)" }, { status: 400 });
  }

  // Get all student profiles with skills
  const profiles = await prisma.studentProfile.findMany({
    where: { skills: { isEmpty: false } },
    include: {
      user: { select: { name: true, email: true, degree: true, gradYear: true } },
      experiences: { select: { company: true, role: true } },
    },
    orderBy: { profileScore: "desc" },
    take: 100,
  });

  if (profiles.length === 0) {
    return NextResponse.json({ candidates: [], message: "No candidates with skills found in the database" });
  }

  // Build candidate summaries for AI
  const candidateSummaries = profiles.map((p, i) => {
    const expList = p.experiences.map((e) => `${e.role} at ${e.company}`).join(", ");
    return `[${i}] ${p.user.name} | Skills: ${p.skills.join(", ")} | Domain: ${p.fieldOfInterest || "N/A"} | College: ${p.collegeName || "N/A"} | ${p.user.degree || ""} ${p.user.gradYear || ""} | Level: ${p.experienceLevel} | Score: ${p.profileScore}${expList ? ` | Exp: ${expList}` : ""}`;
  }).join("\n");

  try {
    const anthropic = new Anthropic();

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: `You are an HR matching engine. Given this job description and a list of candidates, rank the top 10 most relevant candidates by match percentage.

JOB DESCRIPTION:
${jobDescription}

CANDIDATES:
${candidateSummaries}

Return ONLY a JSON array of objects with this format (no other text):
[{"index": 0, "matchPercent": 85, "reason": "Strong Python and SQL skills match the data analyst role"}]

Rules:
- Return max 10 candidates
- matchPercent should be 0-100 based on skill/domain/experience relevance
- Sort by matchPercent descending
- Be strict — only include genuinely relevant candidates
- reason should be 1 sentence explaining why they match`
      }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    // Parse AI response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ candidates: [], message: "AI could not find matching candidates" });
    }

    const rankings = JSON.parse(jsonMatch[0]) as { index: number; matchPercent: number; reason: string }[];

    // Map back to full profiles
    const matched = rankings
      .filter((r) => r.index >= 0 && r.index < profiles.length && r.matchPercent > 0)
      .map((r) => ({
        ...profiles[r.index],
        aiMatchPercent: r.matchPercent,
        aiReason: r.reason,
      }));

    return NextResponse.json({ candidates: matched });
  } catch (err) {
    console.error("AI matching error:", err);
    // Fallback to keyword matching
    const keywords = jobDescription.toLowerCase().split(/[\s,;.]+/).filter((w: string) => w.length > 3);
    const scored = profiles.map((p) => {
      const pSkills = p.skills.map((s) => s.toLowerCase());
      const matches = keywords.filter((k: string) => pSkills.some((s) => s.includes(k) || k.includes(s)));
      const matchPercent = Math.round((matches.length / Math.max(keywords.length, 1)) * 100);
      return { ...p, aiMatchPercent: Math.min(matchPercent, 100), aiReason: `Keyword match: ${matches.slice(0, 5).join(", ")}` };
    }).filter((p) => p.aiMatchPercent > 10).sort((a, b) => b.aiMatchPercent - a.aiMatchPercent).slice(0, 10);

    return NextResponse.json({ candidates: scored, fallback: true });
  }
}
