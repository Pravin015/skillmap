import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToGCS, getSignedUrl, isGCSConfigured } from "@/lib/gcs";

// POST — upload profile image
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!session?.user || !userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { image } = await req.json();
  if (!image) return NextResponse.json({ error: "No image provided" }, { status: 400 });
  if (!image.startsWith("data:image/")) return NextResponse.json({ error: "Invalid image format" }, { status: 400 });

  const sizeInBytes = Math.ceil((image.length * 3) / 4);
  if (sizeInBytes > 2 * 1024 * 1024) return NextResponse.json({ error: "Image must be under 2MB" }, { status: 400 });

  if (isGCSConfigured()) {
    try {
      // Upload to GCS
      const ext = image.startsWith("data:image/png") ? "png" : "jpg";
      const fileName = `${userId}-${Date.now()}.${ext}`;
      const filePath = await uploadToGCS(image, "profile-images", fileName);

      // Store GCS path in DB (prefixed with gcs:)
      await prisma.user.update({ where: { id: userId }, data: { profileImage: `gcs:${filePath}` } });
      return NextResponse.json({ success: true });
    } catch (err) {
      console.error("GCS upload failed, falling back to base64:", err);
    }
  }

  // Fallback: store base64 in DB (for local dev or if GCS not configured)
  if (sizeInBytes > 500 * 1024) return NextResponse.json({ error: "Image must be under 500KB (no cloud storage configured)" }, { status: 400 });
  await prisma.user.update({ where: { id: userId }, data: { profileImage: image } });
  return NextResponse.json({ success: true });
}

// GET — get current user's profile image
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!session?.user || !userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { profileImage: true } });
  if (!user?.profileImage) return NextResponse.json({ image: null });

  // If stored in GCS, generate signed URL
  if (user.profileImage.startsWith("gcs:")) {
    try {
      const filePath = user.profileImage.slice(4);
      const url = await getSignedUrl(filePath, 120); // 2 hour expiry
      return NextResponse.json({ image: url });
    } catch {
      return NextResponse.json({ image: null });
    }
  }

  // Legacy base64
  return NextResponse.json({ image: user.profileImage });
}
