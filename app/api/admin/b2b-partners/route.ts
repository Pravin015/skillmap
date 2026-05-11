// Admin-only CRUD for B2BPartner. ADMIN role required on all routes.
//
// GET  → list partners (no secrets exposed — only prefix + last4)
// POST → create partner. Returns the plaintext key ONCE, never stored.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateApiKey, hashApiKey } from "@/lib/b2b-auth";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  const id = (session?.user as { id?: string })?.id;
  if (!id || role !== "ADMIN") return null;
  return id;
}

export async function GET() {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const partners = await prisma.b2BPartner.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, apiKeyPrefix: true, apiKeyLast4: true,
      allowedOrigins: true, rateLimit: true, scope: true, isActive: true,
      ownerEmail: true, notes: true, webhookUrl: true, webhookEvents: true,
      lastUsedAt: true, createdAt: true, updatedAt: true,
      _count: { select: { apiCalls: true, webhookDeliveries: true } },
    },
  });

  return NextResponse.json({ partners });
}

export async function POST(req: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const {
    name, ownerEmail, allowedOrigins, rateLimit, scope, webhookUrl, webhookEvents,
    notes, env,
  } = body;

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const keyEnv = env === "test" ? "test" : "live";
  const { plaintext, prefix, last4 } = generateApiKey(keyEnv);
  const apiKeyHash = await hashApiKey(plaintext);

  const partner = await prisma.b2BPartner.create({
    data: {
      name,
      ownerEmail: ownerEmail || null,
      allowedOrigins: Array.isArray(allowedOrigins) ? allowedOrigins.filter((s: unknown) => typeof s === "string") : [],
      rateLimit: typeof rateLimit === "number" && rateLimit > 0 ? Math.min(10_000, rateLimit) : 120,
      scope: Array.isArray(scope) && scope.length ? scope : ["jobs:read"],
      webhookUrl: typeof webhookUrl === "string" && webhookUrl ? webhookUrl : null,
      webhookSecret: webhookUrl
        ? (await import("crypto")).randomBytes(32).toString("hex")
        : null,
      webhookEvents: Array.isArray(webhookEvents) && webhookEvents.length
        ? webhookEvents
        : ["job.expired", "job.closed", "job.updated", "job.deleted"],
      notes: notes || null,
      apiKeyHash,
      apiKeyPrefix: prefix,
      apiKeyLast4: last4,
      createdById: adminId,
    },
  });

  // CRITICAL — return plaintext + webhookSecret to operator exactly once.
  return NextResponse.json({
    partner: {
      id: partner.id,
      name: partner.name,
      apiKeyPrefix: partner.apiKeyPrefix,
      apiKeyLast4: partner.apiKeyLast4,
      isActive: partner.isActive,
    },
    plaintextApiKey: plaintext,
    webhookSecret: partner.webhookSecret,
    warning: "Save the API key + webhook secret now. They will never be shown again.",
  }, { status: 201 });
}
