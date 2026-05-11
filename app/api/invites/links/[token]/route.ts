// /api/invites/links/[token]
//
// GET    → public validation. Returns just enough info for /invite/[token]
//          to render the right signup form (kind, role, org/college name,
//          expiry, inviter name). Does NOT mark the link as used — that
//          happens inside /api/auth/signup once the account is created.
// DELETE → revoke (creator or ADMIN only).
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const link = await prisma.inviteLink.findUnique({
    where: { token },
    include: { invitedBy: { select: { name: true, organisation: true } } },
  });

  if (!link) return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  if (link.revokedAt) return NextResponse.json({ error: "This invite has been revoked" }, { status: 410 });
  if (link.expiresAt < new Date()) {
    return NextResponse.json({ error: "This invite has expired" }, { status: 410 });
  }

  return NextResponse.json({
    invite: {
      kind: link.kind,
      role: link.role,
      organisation: link.organisation,
      collegeName: link.collegeName,
      label: link.label,
      expiresAt: link.expiresAt,
      invitedBy: link.invitedBy?.name || null,
      invitedByOrg: link.invitedBy?.organisation || null,
    },
  });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  const userRole = (session?.user as { role?: string })?.role;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { token } = await ctx.params;
  const link = await prisma.inviteLink.findUnique({ where: { token } });
  if (!link) return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  if (link.invitedById !== userId && userRole !== "ADMIN") {
    return NextResponse.json({ error: "You can only revoke your own invites" }, { status: 403 });
  }

  await prisma.inviteLink.update({
    where: { token },
    data: { revokedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
