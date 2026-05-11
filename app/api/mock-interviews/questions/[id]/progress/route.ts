import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: questionId } = await params;
  const { practiced } = await req.json();

  const progress = await prisma.questionProgress.upsert({
    where: { userId_questionId: { userId, questionId } },
    update: { practiced: practiced ?? true },
    create: { userId, questionId, practiced: practiced ?? true },
  });

  return NextResponse.json({ progress });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: questionId } = await params;

  await prisma.questionProgress.deleteMany({
    where: { userId, questionId },
  });

  return NextResponse.json({ success: true });
}
