// POST /api/external-labs/[slug]/start
//
// Mints a JWT-signed launch URL for the signed-in student and returns it.
// The student then opens that URL in a new tab; gamify's /launch endpoint
// verifies the JWT, spins up the lab container, and iframes it.
//
// On completion gamify POSTs a signed webhook to
// /api/integrations/gamify-webhook → writes an ExternalLabAttempt row →
// the student's next Apply call is no longer gated.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { mintLaunchUrl, gamifyConfigured, GamifyError } from "@/lib/integrations/gamify-labs";
import { rateLimitAsync } from "@/lib/rate-limit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!gamifyConfigured) {
    return NextResponse.json(
      { error: "Lab platform not configured. Contact support." },
      { status: 503 }
    );
  }

  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  const userEmail = (session?.user as { email?: string })?.email;
  const userName = (session?.user as { name?: string })?.name;
  if (!userId) {
    return NextResponse.json({ error: "Sign in to start a lab" }, { status: 401 });
  }

  // Rate limit — 10 lab starts per user per hour. Each spawns a Docker
  // container on gamify; uncapped traffic could starve their cluster.
  const rl = await rateLimitAsync(`lab-start:user:${userId}`, 10, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many lab starts. Try again in an hour." },
      { status: 429 }
    );
  }

  const { slug } = await params;

  try {
    // No HTTP call to gamify here — the launch URL is self-contained.
    // Gamify creates the LabLaunch row + container when the student opens it.
    const { url, jti } = mintLaunchUrl({
      labSlug: slug,
      studentId: userId,
      studentEmail: userEmail || undefined,
      studentName: userName || undefined,
    });

    // Return both shapes so the existing client code that reads `embedUrl`
    // OR `labUrl` keeps working with no UI changes.
    return NextResponse.json({
      sessionId: jti,
      jti,
      embedUrl: url,
      labUrl: url,
      status: "PENDING",
    });
  } catch (err) {
    if (err instanceof GamifyError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.status >= 400 && err.status < 600 ? err.status : 500 }
      );
    }
    console.error("[external-labs/start] error:", err);
    return NextResponse.json({ error: "Couldn't start lab" }, { status: 500 });
  }
}
