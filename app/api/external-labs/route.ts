// GET /api/external-labs — list practice labs from gamify (outerlayerx).
// Public catalog — no auth required.
//
// Falls back to an empty list if GAMIFY_API_URL/KEY aren't configured,
// so the /labs page still renders cleanly during local dev.
import { NextRequest, NextResponse } from "next/server";
import { listLabs, gamifyConfigured, GamifyError } from "@/lib/integrations/gamify-labs";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!gamifyConfigured) {
    return NextResponse.json({ labs: [], configured: false });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || undefined;
  const difficulty = searchParams.get("difficulty") || undefined;

  try {
    const labs = await listLabs({ category, difficulty });
    return NextResponse.json({ labs, configured: true });
  } catch (err) {
    if (err instanceof GamifyError) {
      console.error("[external-labs] gamify error:", err.status, err.message);
      // Don't surface gamify's status code to client — return empty list
      // so the page can render an empty state.
      return NextResponse.json({ labs: [], configured: true, error: "Couldn't reach lab platform — try again in a minute." });
    }
    throw err;
  }
}
