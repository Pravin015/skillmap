import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as { role?: string })?.role;

  if (!session?.user || (userRole !== "INSTITUTION" && userRole !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const orgs = await prisma.user.findMany({
    where: { role: "ORG" },
    select: { id: true, name: true, email: true, organisation: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  const orgsWithHRs = await Promise.all(
    orgs.map(async (org) => {
      const hrCount = await prisma.user.count({ where: { role: "HR", organisation: org.organisation || "" } });
      const jobCount = await prisma.jobPosting.count({ where: { company: org.organisation || "" } });
      return { ...org, hrCount, jobCount };
    })
  );

  return NextResponse.json({ companies: orgsWithHRs });
}
