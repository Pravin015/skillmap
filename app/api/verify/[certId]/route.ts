import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ certId: string }> }) {
  const { certId } = await params;

  const certificate = await prisma.courseCertificate.findUnique({
    where: { certificateId: certId },
  });

  if (!certificate) return NextResponse.json({ error: "Certificate not found" }, { status: 404 });

  return NextResponse.json({ certificate });
}
