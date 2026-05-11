// GET /api/admin/b2b-partners/:id/logs
// Recent API calls + recent webhook deliveries for one partner.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if ((session?.user as { role?: string })?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const take = Math.min(200, parseInt(searchParams.get("limit") || "50", 10) || 50);

  const [calls, webhooks] = await Promise.all([
    prisma.b2BApiCallLog.findMany({
      where: { partnerId: id },
      orderBy: { createdAt: "desc" },
      take,
    }),
    prisma.b2BWebhookDelivery.findMany({
      where: { partnerId: id },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true, event: true, deliveryId: true, status: true, attemptCount: true,
        lastStatus: true, lastError: true, nextAttemptAt: true, deliveredAt: true,
        createdAt: true,
      },
    }),
  ]);

  return NextResponse.json({ calls, webhooks });
}
