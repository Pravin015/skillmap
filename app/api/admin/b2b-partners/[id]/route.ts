// PATCH → update partner (name, allowedOrigins, rateLimit, scope,
//                          webhookUrl/events, notes, isActive)
// DELETE → set isActive=false (preserves history)
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  return (session?.user as { role?: string })?.role === "ADMIN";
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  const data: Record<string, unknown> = {};
  if (typeof body.name === "string") data.name = body.name;
  if (typeof body.ownerEmail === "string") data.ownerEmail = body.ownerEmail || null;
  if (Array.isArray(body.allowedOrigins)) data.allowedOrigins = body.allowedOrigins.filter((s: unknown) => typeof s === "string");
  if (typeof body.rateLimit === "number" && body.rateLimit > 0) data.rateLimit = Math.min(10_000, body.rateLimit);
  if (Array.isArray(body.scope)) data.scope = body.scope;
  if (typeof body.webhookUrl === "string") data.webhookUrl = body.webhookUrl || null;
  if (Array.isArray(body.webhookEvents)) data.webhookEvents = body.webhookEvents;
  if (typeof body.notes === "string") data.notes = body.notes;
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;

  const partner = await prisma.b2BPartner.update({ where: { id }, data });
  return NextResponse.json({ partner: stripSecrets(partner) });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await ctx.params;
  await prisma.b2BPartner.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}

function stripSecrets(p: { apiKeyHash?: string; webhookSecret?: string | null } & Record<string, unknown>) {
  const { apiKeyHash: _h, webhookSecret: _w, ...rest } = p;
  void _h; void _w;
  return rest;
}
