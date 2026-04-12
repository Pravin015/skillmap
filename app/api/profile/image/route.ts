import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST — upload profile image (base64)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!session?.user || !userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { image } = await req.json();
  if (!image) return NextResponse.json({ error: "No image provided" }, { status: 400 });

  // Validate it's a base64 image and under 500KB
  if (!image.startsWith("data:image/")) return NextResponse.json({ error: "Invalid image format" }, { status: 400 });
  const sizeInBytes = Math.ceil((image.length * 3) / 4);
  if (sizeInBytes > 500 * 1024) return NextResponse.json({ error: "Image must be under 500KB" }, { status: 400 });

  await prisma.user.update({ where: { id: userId }, data: { profileImage: image } });

  return NextResponse.json({ success: true });
}

// GET — get current user's profile image
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!session?.user || !userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { profileImage: true } });
  return NextResponse.json({ image: user?.profileImage || null });
}
