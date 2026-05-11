// POST /api/admin/b2b-partners/:id/rotate
// Generates a new API key (invalidating the old one immediately) and
// returns the plaintext to the operator once.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateApiKey, hashApiKey } from "@/lib/b2b-auth";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if ((session?.user as { role?: string })?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const keyEnv = body.env === "test" ? "test" : "live";

  const existing = await prisma.b2BPartner.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { plaintext, prefix, last4 } = generateApiKey(keyEnv);
  const apiKeyHash = await hashApiKey(plaintext);

  await prisma.b2BPartner.update({
    where: { id },
    data: { apiKeyHash, apiKeyPrefix: prefix, apiKeyLast4: last4 },
  });

  return NextResponse.json({
    plaintextApiKey: plaintext,
    warning: "Old key is now invalid. Save this key — it will never be shown again.",
  });
}
