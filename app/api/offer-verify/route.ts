import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const anthropic = new Anthropic();

const ANALYSIS_PROMPT = `You are an expert fraud analyst specializing in detecting fake job offer letters in India.
You have analyzed thousands of offer letters and know every trick scammers use.

Analyze the following offer letter and company name. Score EACH of these 20 parameters from 0 (definite red flag) to 10 (perfectly clean):

PARAMETERS:
1. EMAIL_DOMAIN: Is the sender email a corporate domain (@company.com) or personal (gmail/yahoo)?
2. UPFRONT_FEES: Any mention of registration fee, security deposit, training charges, document verification fee?
3. COMPANY_LEGITIMACY: Is this a known/real company? Does the description match?
4. SALARY_REALISM: Is the offered CTC realistic for the role and experience level in India?
5. OFFICE_ADDRESS: Is a specific registered office address provided?
6. HR_CONTACT: Is there a named HR person with proper designation and contact?
7. GRAMMAR_LANGUAGE: Professional English or poor grammar, typos, inconsistent formatting?
8. LEGAL_TERMS: Are standard employment terms present (probation, notice period, confidentiality)?
9. CTC_BREAKDOWN: Is there a proper compensation breakdown (basic + HRA + special allowance + PF)?
10. JOINING_DATE: Is there a specific joining date or vague timing?
11. REFERENCE_ID: Is there a unique offer/reference number?
12. LETTERHEAD_FORMAT: Does it appear to have proper company branding/format?
13. URGENCY_PRESSURE: Any pressure to accept immediately, "limited time offer"?
14. COMMUNICATION_CHANNEL: Was it sent via official email or WhatsApp/Telegram?
15. PERKS_REALISM: Are the perks realistic or too good to be true?
16. DESIGNATION_MATCH: Does the offered role match the experience level?
17. BOND_CLAUSES: Any suspicious service bond or extreme penalty clauses?
18. PAYMENT_REQUEST: Any request to pay to personal UPI/bank account?
19. INTERVIEW_PROCESS: Does the letter reference a proper interview process?
20. AUTHORIZED_SIGNATORY: Is there a proper authorized signatory with designation?

You MUST respond in this EXACT JSON format (no markdown, no backticks, just pure JSON):
{
  "trustScore": <number 0-100>,
  "verdict": "<LIKELY_GENUINE|SUSPICIOUS|LIKELY_FAKE|DEFINITE_SCAM>",
  "riskLevel": "<LOW|MEDIUM|HIGH|CRITICAL>",
  "parameters": {
    "EMAIL_DOMAIN": {"score": <0-10>, "finding": "<brief finding>"},
    "UPFRONT_FEES": {"score": <0-10>, "finding": "<brief finding>"},
    "COMPANY_LEGITIMACY": {"score": <0-10>, "finding": "<brief finding>"},
    "SALARY_REALISM": {"score": <0-10>, "finding": "<brief finding>"},
    "OFFICE_ADDRESS": {"score": <0-10>, "finding": "<brief finding>"},
    "HR_CONTACT": {"score": <0-10>, "finding": "<brief finding>"},
    "GRAMMAR_LANGUAGE": {"score": <0-10>, "finding": "<brief finding>"},
    "LEGAL_TERMS": {"score": <0-10>, "finding": "<brief finding>"},
    "CTC_BREAKDOWN": {"score": <0-10>, "finding": "<brief finding>"},
    "JOINING_DATE": {"score": <0-10>, "finding": "<brief finding>"},
    "REFERENCE_ID": {"score": <0-10>, "finding": "<brief finding>"},
    "LETTERHEAD_FORMAT": {"score": <0-10>, "finding": "<brief finding>"},
    "URGENCY_PRESSURE": {"score": <0-10>, "finding": "<brief finding>"},
    "COMMUNICATION_CHANNEL": {"score": <0-10>, "finding": "<brief finding>"},
    "PERKS_REALISM": {"score": <0-10>, "finding": "<brief finding>"},
    "DESIGNATION_MATCH": {"score": <0-10>, "finding": "<brief finding>"},
    "BOND_CLAUSES": {"score": <0-10>, "finding": "<brief finding>"},
    "PAYMENT_REQUEST": {"score": <0-10>, "finding": "<brief finding>"},
    "INTERVIEW_PROCESS": {"score": <0-10>, "finding": "<brief finding>"},
    "AUTHORIZED_SIGNATORY": {"score": <0-10>, "finding": "<brief finding>"}
  },
  "redFlags": ["<list of specific red flags found>"],
  "greenFlags": ["<list of positive legitimate signals>"],
  "recommendation": "<2-3 sentence recommendation to the candidate on what to do next>",
  "detailedAnalysis": "<3-5 sentence overall analysis explaining the verdict>"
}

SCORING GUIDE:
- trustScore 80-100: LIKELY_GENUINE (riskLevel: LOW)
- trustScore 50-79: SUSPICIOUS (riskLevel: MEDIUM)
- trustScore 25-49: LIKELY_FAKE (riskLevel: HIGH)
- trustScore 0-24: DEFINITE_SCAM (riskLevel: CRITICAL)

CRITICAL SCAM INDICATORS (any ONE of these = trustScore below 25):
- Asking for ANY money/fee/deposit before joining
- Payment to personal UPI/bank account
- No interview was conducted but offer received
- Company does not exist or cannot be verified

BE STRICT. Real companies don't ask for money. Protect Indian fresh graduates who are vulnerable to these scams.`;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  const { companyName, offerText, communicationChannel, fileData, fileType } = await req.json();

  if (!companyName) {
    return NextResponse.json({ error: "Company name is required" }, { status: 400 });
  }

  // Must provide either text or file
  if (!offerText && !fileData) {
    return NextResponse.json({ error: "Please paste the offer letter text or upload the file" }, { status: 400 });
  }

  if (offerText && !fileData && offerText.length < 50) {
    return NextResponse.json({ error: "Please paste the complete offer letter text (minimum 50 characters)" }, { status: 400 });
  }

  try {
    // Build message content based on input type
    const messageContent: Anthropic.MessageCreateParams["messages"][0]["content"] = [];

    if (fileData) {
      // File uploaded — use Claude Vision to read + analyze the document
      // Strip data URL prefix if present (e.g., "data:image/png;base64,...")
      const base64Data = fileData.includes(",") ? fileData.split(",")[1] : fileData;

      // Map file type to valid media type for Claude Vision
      let mediaType: "image/png" | "image/jpeg" | "image/gif" | "image/webp" = "image/png";
      if (fileType?.includes("jpeg") || fileType?.includes("jpg")) mediaType = "image/jpeg";
      else if (fileType?.includes("webp")) mediaType = "image/webp";
      else if (fileType?.includes("gif")) mediaType = "image/gif";
      // For PDFs: convert to image/png media type (user should screenshot or we handle on frontend)
      // Claude Vision accepts images, not PDFs directly

      messageContent.push({
        type: "image",
        source: { type: "base64", media_type: mediaType, data: base64Data },
      });
      messageContent.push({
        type: "text",
        text: `Company Name: ${companyName}\nCommunication Channel: ${communicationChannel || "Not specified"}\n\nThis is an uploaded offer letter document. Read ALL the text from this image/document carefully, then analyze it against all 20 parameters. Check the letterhead, formatting, logo, signatures, and overall document quality visually as well.`,
      });
    } else {
      // Text pasted
      messageContent.push({
        type: "text",
        text: `Company Name: ${companyName}\nCommunication Channel: ${communicationChannel || "Not specified"}\n\nOFFER LETTER TEXT:\n${offerText}`,
      });
    }

    const result = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: ANALYSIS_PROMPT,
      messages: [{ role: "user", content: messageContent }],
    });

    const responseText = result.content[0].type === "text" ? result.content[0].text : "";

    // Parse JSON response
    let analysis;
    try {
      // Try to extract JSON from response (handle cases where AI adds backticks)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      analysis = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
    } catch {
      return NextResponse.json({ error: "AI analysis failed to parse. Please try again." }, { status: 500 });
    }

    // Save to database
    const verification = await prisma.offerVerification.create({
      data: {
        userId: userId || null,
        companyName,
        offerText: offerText || "[Uploaded document — analyzed via AI Vision]",
        trustScore: analysis.trustScore || 0,
        verdict: analysis.verdict || "SUSPICIOUS",
        analysis: JSON.stringify(analysis),
        redFlags: analysis.redFlags || [],
        greenFlags: analysis.greenFlags || [],
        riskLevel: analysis.riskLevel || "MEDIUM",
        parameterScores: JSON.stringify(analysis.parameters || {}),
        recommendation: analysis.recommendation || "",
      },
    });

    return NextResponse.json({
      id: verification.id,
      trustScore: analysis.trustScore,
      verdict: analysis.verdict,
      riskLevel: analysis.riskLevel,
      parameters: analysis.parameters,
      redFlags: analysis.redFlags,
      greenFlags: analysis.greenFlags,
      recommendation: analysis.recommendation,
      detailedAnalysis: analysis.detailedAnalysis,
    });
  } catch (err) {
    console.error("Offer verification error:", err);
    return NextResponse.json({ error: "Analysis failed. Please try again." }, { status: 500 });
  }
}

// GET — user's verification history
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const verifications = await prisma.offerVerification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      companyName: true,
      trustScore: true,
      verdict: true,
      riskLevel: true,
      redFlags: true,
      recommendation: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ verifications });
}
