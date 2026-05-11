// GET /api/v1/partner/health
// Sanity check for partners. Returns the partner's name + scopes.
import { NextRequest, NextResponse } from "next/server";
import { authenticatePartner, finalisePartnerResponse, handlePreflight } from "@/lib/b2b-auth";

export async function OPTIONS(req: NextRequest) {
  return handlePreflight(req) ?? new NextResponse(null, { status: 204 });
}

export async function GET(req: NextRequest) {
  const started = Date.now();
  const auth = await authenticatePartner(req, "jobs:read");
  if (!auth.ok) return auth.response;

  const res = NextResponse.json({
    ok: true,
    partnerName: auth.partner.name,
    scopes: auth.partner.scope,
    version: "v1",
  });
  return finalisePartnerResponse(req, auth, res, started);
}
