// POST /api/external-labs/[slug]/start — start a gamify lab session for the
// signed-in student. Returns the iframe-friendly embedUrl + sessionId.
//
// We pass our User.id as gamify's externalUserId so they scope state correctly.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { startLabSession, gamifyConfigured, GamifyError } from "@/lib/integrations/gamify-labs";
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

  // Rate limit — 10 lab starts per user per hour. Each launches a Docker
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
    const result = await startLabSession({
      labSlug: slug,
      externalUserId: userId,
      externalUserEmail: userEmail || undefined,
      externalUserName: userName || undefined,
      metadata: { platform: "astraahire" },
    });

    return NextResponse.json({
      sessionId: result.sessionId,
      embedUrl: result.embedUrl,
      labUrl: result.labUrl,
      status: result.status,
      expiresAt: result.expiresAt,
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
