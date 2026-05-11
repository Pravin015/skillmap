import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const orgs = await prisma.user.findMany({
    where: { role: "ORG" },
    select: { id: true, name: true, email: true, organisation: true, phone: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  // Count HRs per org
  const orgsWithCounts = await Promise.all(
    orgs.map(async (org) => {
      const hrCount = await prisma.user.count({
        where: { role: "HR", organisation: org.organisation || "" },
      });
      return { ...org, hrCount };
    })
  );

  return NextResponse.json({ companies: orgsWithCounts });
}

// PATCH — suspend/activate company
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { userId, action } = await req.json();
  if (!userId || !action) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  // For now, just return success — actual suspension logic would disable login
  return NextResponse.json({ success: true, action });
}
