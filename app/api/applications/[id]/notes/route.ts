import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const notes = await prisma.applicationNote.findMany({
    where: { applicationId: id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ notes });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  const userName = (session?.user as { name?: string })?.name;
  const userRole = (session?.user as { role?: string })?.role;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (userRole !== "HR" && userRole !== "ORG" && userRole !== "ADMIN") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { id } = await params;
  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 });

  const note = await prisma.applicationNote.create({
    data: {
      applicationId: id,
      authorId: userId,
      authorName: userName || "HR",
      content: content.trim(),
    },
  });

  return NextResponse.json({ note }, { status: 201 });
}
