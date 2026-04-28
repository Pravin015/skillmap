import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Toggle source enabled/disabled, edit defaultQuery / minIntervalMin.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (typeof body.enabled === "boolean") data.enabled = body.enabled;
  if (typeof body.minIntervalMin === "number") data.minIntervalMin = body.minIntervalMin;
  if (body.defaultQuery && typeof body.defaultQuery === "object") data.defaultQuery = body.defaultQuery;

  const source = await prisma.jobSource.update({ where: { id }, data });
  return NextResponse.json({ source });
}
