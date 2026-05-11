// Resume upload + retrieve for the signed-in student.
//
// Persists to GCS when configured; falls back to a base64 data-URL in
// StudentProfile.resumeUrl for local dev. Either way, the resulting value
// is non-null on success — which is what the apply-gate in
// /api/applications POST checks before letting a student submit.
//
// Body (POST): { resume: "data:application/pdf;base64,...." }
// Response:    { success: true, resumeUrl: <gcs:path | data-url> }
//
// GET returns { resumeUrl: <usable URL> | null } where the URL is a signed
// GCS read-link or the raw base64 — caller can drop it straight into an
// <iframe> or <a href>.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateProfileNumber } from "@/lib/profile-number";
import { uploadToGCS, getSignedUrl, isGCSConfigured } from "@/lib/gcs";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { resume } = await req.json().catch(() => ({}));
  if (!resume || typeof resume !== "string") {
    return NextResponse.json({ error: "No resume provided" }, { status: 400 });
  }
  if (!resume.startsWith("data:application/pdf")) {
    return NextResponse.json({ error: "Resume must be a PDF" }, { status: 400 });
  }

  // base64 size estimate (length * 3/4 minus padding). Tight check before
  // uploading anywhere so we don't waste a GCS round trip on a huge file.
  const sizeInBytes = Math.ceil((resume.length * 3) / 4);
  if (sizeInBytes > MAX_BYTES) {
    return NextResponse.json({ error: "Resume must be under 5 MB" }, { status: 400 });
  }

  // Ensure the student has a profile row — public student signup creates it
  // lazily on first /api/profile POST, but a user could land here straight
  // from /onboarding without that having happened yet.
  let profile = await prisma.studentProfile.findUnique({ where: { userId } });
  if (!profile) {
    profile = await prisma.studentProfile.create({
      data: { userId, profileNumber: generateProfileNumber() },
    });
  }

  let storedValue: string;
  if (isGCSConfigured()) {
    try {
      const fileName = `${userId}-${Date.now()}.pdf`;
      const filePath = await uploadToGCS(resume, "resumes", fileName);
      storedValue = `gcs:${filePath}`;
    } catch (err) {
      console.error("[resume] GCS upload failed, falling back to base64:", err);
      // Fall through to base64 path — but only if we're well under the
      // Postgres TEXT column's practical limit. 5 MB base64 (~6.7MB text)
      // is fine for a column, just slow on serialize.
      storedValue = resume;
    }
  } else {
    // No GCS configured — store the data URL inline. Acceptable for dev,
    // tolerable for low-volume prod, ugly otherwise.
    storedValue = resume;
  }

  await prisma.studentProfile.update({
    where: { userId },
    data: { resumeUrl: storedValue },
  });

  return NextResponse.json({ success: true, resumeUrl: storedValue });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    select: { resumeUrl: true },
  });
  if (!profile?.resumeUrl) return NextResponse.json({ resumeUrl: null });

  // GCS-stored: hand back a 2-hour signed URL.
  if (profile.resumeUrl.startsWith("gcs:")) {
    try {
      const url = await getSignedUrl(profile.resumeUrl.slice(4), 120);
      return NextResponse.json({ resumeUrl: url, fileName: extractFileName(profile.resumeUrl.slice(4)) });
    } catch (err) {
      console.error("[resume] signed URL failed:", err);
      return NextResponse.json({ resumeUrl: null });
    }
  }

  // Legacy / dev: return the data URL as-is. Caller can drop it in an iframe.
  return NextResponse.json({ resumeUrl: profile.resumeUrl, fileName: "resume.pdf" });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // We intentionally don't delete the underlying GCS file — keeps an audit
  // trail and avoids dangling references from applications submitted earlier.
  // Just blank the pointer so the apply-gate fails clean.
  await prisma.studentProfile.update({
    where: { userId },
    data: { resumeUrl: null },
  }).catch(() => {});

  return NextResponse.json({ success: true });
}

function extractFileName(path: string): string {
  const parts = path.split("/");
  return parts[parts.length - 1] || "resume.pdf";
}
