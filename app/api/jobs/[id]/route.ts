import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET single job with applications
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const job = await prisma.jobPosting.findUnique({
    where: { id },
    include: {
      postedBy: { select: { name: true, email: true, organisation: true } },
      labTemplate: { select: { id: true, title: true, timeLimit: true, passingScore: true, difficulty: true } },
      applications: {
        include: {
          user: { select: { name: true, email: true, profile: { select: { profileNumber: true, profileScore: true, fieldOfInterest: true, collegeName: true, skills: true } } } },
        },
        orderBy: { appliedAt: "desc" },
      },
    },
  });

  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  return NextResponse.json({ job });
}

// PATCH — update job status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as { role?: string })?.role;

  if (!session?.user || (userRole !== "HR" && userRole !== "ORG" && userRole !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const { status } = await req.json();

  const updated = await prisma.jobPosting.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json({ job: updated });
}

// DELETE
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as { role?: string })?.role;

  if (!session?.user || (userRole !== "HR" && userRole !== "ORG" && userRole !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.jobPosting.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
