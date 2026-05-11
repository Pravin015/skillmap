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
  const { answer } = await req.json();

  const interview = await prisma.mockInterview.findUnique({
    where: { id },
    include: {
      company: true,
      responses: { orderBy: { order: "asc" } },
      user: { include: { profile: true } },
    },
  });

  if (!interview || interview.userId !== userId) {
    return NextResponse.json({ error: "Interview not found" }, { status: 404 });
  }
  if (interview.status !== "IN_PROGRESS") {
    return NextResponse.json({ error: "Interview is not in progress" }, { status: 400 });
  }

  const questionNumber = interview.responses.length + 1;
  const isFirstQuestion = !answer; // First call — no answer, just get opening question
  const isLastQuestion = questionNumber >= interview.totalQuestions;

  // Build student context
  const profile = interview.user.profile;
  const studentContext = profile
    ? `Name: ${interview.user.name}, College: ${profile.collegeName || "N/A"}, Skills: ${(profile.skills || []).join(", ") || "N/A"}, Field: ${profile.fieldOfInterest || "N/A"}, Experience: ${profile.experienceLevel || "Fresher"}`
    : `Name: ${interview.user.name}`;

  // Build conversation history
  const history = interview.responses
    .map((r) => `Q${r.order}: ${r.question}\nCandidate's Answer: ${r.answer}${r.aiFeedback ? `\nFeedback: ${r.aiFeedback}` : ""}`)
    .join("\n\n");

  const systemPrompt = `You are a professional interviewer conducting a ${interview.interviewType} interview for ${interview.company.name} (${interview.company.domain}).

Candidate Profile: ${studentContext}

Interview Settings:
- Difficulty: ${interview.difficulty}
- Total Questions: ${interview.totalQuestions}
- Current Question Number: ${questionNumber}
- ${isLastQuestion && !isFirstQuestion ? "This is the LAST question. After providing feedback, write INTERVIEW_COMPLETE in the next question section." : ""}

${isFirstQuestion ? `This is the start of the interview. Greet the candidate briefly (1 line) and ask your first ${interview.interviewType.toLowerCase()} interview question suitable for ${interview.company.name}.` : `The candidate just answered question ${questionNumber - 1}. Provide feedback on their answer, then ask the next question.`}

${history ? `Previous Q&A:\n${history}` : ""}

You MUST respond in this EXACT format (include the markers exactly as shown):

---FEEDBACK---
${isFirstQuestion ? "Welcome to the interview! Let's begin." : "{Your constructive feedback on their answer — 2-3 sentences. Be specific about what was good and what could be improved.}"}
---SCORE---
${isFirstQuestion ? "0" : "{A number from 1 to 10 rating the answer quality}"}
---NEXT_QUESTION---
${isLastQuestion && !isFirstQuestion ? "INTERVIEW_COMPLETE" : "{Your next interview question. Make it relevant to " + interview.company.name + " and appropriate for " + interview.difficulty + " difficulty.}"}

Important rules:
- Ask questions that ${interview.company.name} is known to ask in ${interview.interviewType} interviews
- Adapt difficulty based on the ${interview.difficulty} level
- For TECHNICAL: ask coding, DSA, system concepts
- For HR: ask about motivation, company knowledge, career goals
- For BEHAVIORAL: use STAR-format questions about past experiences
- For SYSTEM_DESIGN: ask about designing real-world systems
- Be encouraging but honest in feedback
- Score fairly: 1-3 poor, 4-5 average, 6-7 good, 8-9 excellent, 10 exceptional`;

  const userMessage = isFirstQuestion
    ? "Please start the interview."
    : `My answer: ${answer}`;

  // Stream response
  let fullResponse = "";
  const stream = await anthropic.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          fullResponse += event.delta.text;
          const data = JSON.stringify({ text: event.delta.text });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        }
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();

      // Parse and save response after streaming
      try {
        const feedbackMatch = fullResponse.match(/---FEEDBACK---\s*([\s\S]*?)\s*---SCORE---/);
        const scoreMatch = fullResponse.match(/---SCORE---\s*(\d+)/);
        const questionMatch = fullResponse.match(/---NEXT_QUESTION---\s*([\s\S]*?)$/);

        const aiFeedback = feedbackMatch?.[1]?.trim() || "";
        const score = parseInt(scoreMatch?.[1] || "0", 10);
        const nextQuestion = questionMatch?.[1]?.trim() || "";

        if (!isFirstQuestion && answer) {
          // Save the student's answer + AI feedback for the previous question
          const prevQuestion = interview.responses.length > 0
            ? interview.responses[interview.responses.length - 1]
            : null;
          const questionText = prevQuestion ? "Follow-up" : "Opening question";

          await prisma.mockResponse.create({
            data: {
              interviewId: id,
              question: questionText,
              answer,
              aiFeedback,
              score: Math.min(10, Math.max(0, score)),
              order: questionNumber - 1,
            },
          });
        }

        // If first question, save the question that was asked
        if (isFirstQuestion && nextQuestion && nextQuestion !== "INTERVIEW_COMPLETE") {
          // We'll track the first question when the student answers it
        }

        // Update interview question count
        await prisma.mockInterview.update({
          where: { id },
          data: { questionsAsked: questionNumber },
        });

        // If interview is complete, mark it
        if (nextQuestion === "INTERVIEW_COMPLETE") {
          const responses = await prisma.mockResponse.findMany({
            where: { interviewId: id },
          });
          const avgScore = responses.length > 0
            ? Math.round(responses.reduce((sum, r) => sum + (r.score || 0), 0) / responses.length * 10)
            : 0;

          await prisma.mockInterview.update({
            where: { id },
            data: {
              status: "COMPLETED",
              score: avgScore,
              completedAt: new Date(),
              duration: Math.round((Date.now() - interview.createdAt.getTime()) / 60000),
            },
          });
        }
      } catch {
        // Non-critical — don't fail the stream
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
