import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { companies as allCompanies, jobs as allJobs } from "@/lib/data";

const anthropic = new Anthropic();

export async function POST(req: NextRequest) {
  const { messages, profile } = await req.json();

  // Build context about the user
  let userContext = "No user profile available.";
  if (profile) {
    const selectedCompanies = allCompanies
      .filter((c) => profile.companies?.includes(c.id))
      .map((c) => {
        const domainInfo = c.domains[profile.domainKey];
        return {
          name: c.name,
          domain: profile.domainKey,
          roles: domainInfo?.roles || [],
          skills: domainInfo?.skills || [],
          interview: domainInfo?.interview || "Unknown",
          avgPackage: domainInfo?.avg_package || "Unknown",
          fresherFriendly: domainInfo?.fresher_friendly ?? false,
        };
      });

    const matchingJobs = allJobs.filter(
      (j) =>
        profile.companies?.includes(j.company) &&
        j.domain === profile.domainKey &&
        j.active
    );

    userContext = `
Name: ${profile.name}
Degree: ${profile.degree}
Graduation Year: ${profile.graduationYear}
Domain interest: ${profile.domain}

Dream companies and their requirements:
${selectedCompanies
  .map(
    (c) => `
- ${c.name} (${c.domain}):
  Roles: ${c.roles.join(", ")}
  Required skills: ${c.skills.join(", ")}
  Interview: ${c.interview}
  Avg package: ${c.avgPackage}
  Fresher friendly: ${c.fresherFriendly ? "Yes" : "No"}`
  )
  .join("\n")}

Matching open jobs found:
${
  matchingJobs.length > 0
    ? matchingJobs
        .map(
          (j) =>
            `- ${j.title} at ${allCompanies.find((c) => c.id === j.company)?.name} — ${j.location} — Deadline: ${j.deadline} — Experience: ${j.experience}`
        )
        .join("\n")
    : "No exact matches currently open."
}`;
  }

  const systemPrompt = `You are a career advisor for Indian fresh graduates. You speak clearly and directly. No fluff, no generic advice.

The user's profile:
${userContext}

Your job is to:
1) Acknowledge their specific situation
2) Tell them which open roles match them best
3) Give them a concrete week-by-week preparation plan for their top match
4) Recommend free/affordable learning resources (Coursera, YouTube, official docs)
5) Give honest timeline — how long to be application-ready

Be specific, not generic. Reference their actual companies and actual jobs. Use Indian context (LPA, Indian cities, Indian hiring patterns). Keep responses well-structured with headers and bullet points.`;

  const stream = await anthropic.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: systemPrompt,
    messages: messages.map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          const data = JSON.stringify({ text: event.delta.text });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        }
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
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
