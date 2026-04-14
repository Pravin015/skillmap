import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — single lab with problems
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lab = await prisma.labTemplate.findUnique({
    where: { id },
    include: { problems: { orderBy: { order: "asc" } }, _count: { select: { attempts: true } } },
  });
  if (!lab) return NextResponse.json({ error: "Lab not found" }, { status: 404 });
  return NextResponse.json({ lab });
}

// PATCH — update lab (admin)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if ((session?.user as { role?: string })?.role !== "ADMIN") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const body = await req.json();
  const updated = await prisma.labTemplate.update({ where: { id }, data: body });
  return NextResponse.json({ lab: updated });
}

// DELETE
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if ((session?.user as { role?: string })?.role !== "ADMIN") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  await prisma.labTemplate.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
