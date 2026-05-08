// POST /api/profile/enrich
// Accepts pasted profile text (LinkedIn copy-paste or resume text),
// runs it through Claude, returns structured StudentProfile fields the
// user can review-and-confirm in the UI.
//
// Why pasted text vs scraping?
//   - LinkedIn's API requires paid product approval for headline/work
//     history fields. Free tier (OIDC) gives only name + email + photo.
//   - Public-page scraping violates their ToS + is blocked by their CDN.
//   - Pasted text is what every legit competitor (Wellfound, Otta, etc.)
//     does. User opens their LinkedIn profile, Ctrl+A, Ctrl+C, pastes here.
//     One step less than uploading a PDF and we get the same result.
//
// Returns the same shape that POST /api/profile expects, so the UI can
// just spread the response into its form state.

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { rateLimitAsync, getClientIP } from "@/lib/rate-limit";

const anthropic = new Anthropic();

const MAX_TEXT_CHARS = 15_000; // ~3,750 tokens — covers any real profile
const RATE_LIMIT_PER_USER_DAY = 5; // 5 enrichments per day

const ENRICH_PROMPT = `You are a professional profile parser. The user has pasted text from their LinkedIn profile or resume. Extract structured data.

OUTPUT FORMAT — strict JSON, no markdown, no commentary:
{
  "headline": "<one-line professional headline, max 100 chars>",
  "bio": "<2-3 sentence summary, max 400 chars>",
  "collegeName": "<their college/university name, or null>",
  "academicScore": "<CGPA/percentage as a string e.g. '8.5' or '78%', or null>",
  "academicType": "<'CGPA' | 'Percentage' | 'GPA' | null>",
  "fieldOfInterest": "<one of: 'Software Development', 'Data & Analytics', 'Cybersecurity', 'Cloud & DevOps', 'Digital Marketing', 'Social Media', 'Sales', 'Consulting & Finance', 'Product Management', 'Design', 'Other' — pick the closest match>",
  "skills": ["<skill 1>", "<skill 2>", ...],   // max 12 skills, lowercase
  "experiences": [
    { "company": "<name>", "role": "<title>", "duration": "<e.g. 'Jun 2024 - Aug 2024' or '3 months'>", "description": "<1-2 sentences max>" }
  ],
  "certifications": [
    { "title": "<cert name>", "issuer": "<issuing org>", "year": "<YYYY or null>" }
  ],
  "linkedinUrl": "<URL if present in text, else null>",
  "githubUrl": "<URL if present in text, else null>",
  "portfolioUrl": "<URL if present in text, else null>"
}

RULES:
- If a field is unclear or absent, return null (or empty array for list fields).
- Be conservative — never invent data. If headline isn't explicit in text, derive a clean one-liner from current role + company.
- Skills: extract concrete tech/tool names (e.g. "python", "react", "figma"). Don't include soft skills.
- Experiences: only include real internships/jobs, not coursework. Cap at 5 most recent.
- Certifications: cap at 5.
- DO NOT include personal info beyond what's in the text (no phone, no address, no DOB).
- DO NOT add markdown, prose, or anything outside the JSON object.

If the input doesn't look like a profile/resume at all, return:
{"error": "input_not_a_profile"}`;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: "Sign in to import profile data." }, { status: 401 });
  }

  // Rate limit — 5/day per user. Each call hits Claude (paid).
  const rl = await rateLimitAsync(`profile-enrich:user:${userId}`, RATE_LIMIT_PER_USER_DAY, 24 * 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Daily limit reached (${RATE_LIMIT_PER_USER_DAY} imports/day). Edit your profile manually for further changes.` },
      { status: 429 }
    );
  }
  // IP-level: belt-and-suspenders against shared sessions in college labs.
  const ipRl = await rateLimitAsync(`profile-enrich:ip:${getClientIP(req)}`, 20, 24 * 60 * 60 * 1000);
  if (!ipRl.allowed) {
    return NextResponse.json({ error: "Too many imports from your network." }, { status: 429 });
  }

  let body: { text?: string; linkedinUrl?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text = (body.text || "").trim();
  if (!text || text.length < 100) {
    return NextResponse.json(
      { error: "Paste at least 100 characters of profile text. Open your LinkedIn profile, select all (Ctrl+A), and copy." },
      { status: 400 }
    );
  }
  if (text.length > MAX_TEXT_CHARS) {
    return NextResponse.json(
      { error: `Text too long (max ${MAX_TEXT_CHARS.toLocaleString()} characters). Paste only the relevant sections.` },
      { status: 413 }
    );
  }

  try {
    const result = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      // System prompt is identical on every call — cache it (~80% input cost cut).
      system: [{ type: "text", text: ENRICH_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: `${body.linkedinUrl ? `LinkedIn URL: ${body.linkedinUrl}\n\n` : ""}PROFILE TEXT:\n${text}` },
          ],
        },
      ],
    });

    const responseText = result.content[0].type === "text" ? result.content[0].text : "";

    let parsed: Record<string, unknown>;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
    } catch {
      console.error("[profile/enrich] AI returned unparseable JSON:", responseText.slice(0, 500));
      return NextResponse.json(
        { error: "Couldn't parse the profile text. Try pasting a cleaner version (just the main profile sections)." },
        { status: 500 }
      );
    }

    if (parsed.error === "input_not_a_profile") {
      return NextResponse.json(
        { error: "That doesn't look like a profile or resume. Paste your LinkedIn 'About' section + experience + education." },
        { status: 400 }
      );
    }

    // Pass linkedinUrl through if user supplied it but Claude missed it.
    if (body.linkedinUrl && !parsed.linkedinUrl) {
      parsed.linkedinUrl = body.linkedinUrl;
    }

    return NextResponse.json({ enriched: parsed });
  } catch (err) {
    console.error("[profile/enrich] error:", err);
    return NextResponse.json(
      { error: "Something went wrong analysing the text. Try again in a minute." },
      { status: 500 }
    );
  }
}
