// /api/invites/links
//
// Reusable signup-invite links. Each link is a single token that the
// recipient opens at /invite/<token> to land on a pre-configured signup
// flow (role + organisation/institution already locked).
//
// GET  → list links the caller has created (active first)
// POST → create a new link
//
// Permissions:
//   ADMIN       → can create any kind (MENTOR | HR | INSTITUTE_STUDENT | CANDIDATE)
//   INSTITUTION → INSTITUTE_STUDENT only (institutionId/collegeName auto-set)
//   HR          → CANDIDATE only        (organisation auto-set from inviter)
//   ORG         → HR only               (organisation auto-set from inviter)
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const KINDS = ["MENTOR", "HR", "INSTITUTE_STUDENT", "CANDIDATE"] as const;
type Kind = (typeof KINDS)[number];

const KIND_TO_ROLE: Record<Kind, "MENTOR" | "HR" | "STUDENT"> = {
  MENTOR: "MENTOR",
  HR: "HR",
  INSTITUTE_STUDENT: "STUDENT",
  CANDIDATE: "STUDENT",
};

// Who is allowed to mint each kind. ORG is kept on HR because the
// company dashboard already creates HR users — the invite link is
// just a self-serve replacement for that flow.
const KIND_PERMS: Record<Kind, Array<"ADMIN" | "INSTITUTION" | "HR" | "ORG">> = {
  MENTOR: ["ADMIN"],
  HR: ["ADMIN", "ORG"],
  INSTITUTE_STUDENT: ["ADMIN", "INSTITUTION"],
  CANDIDATE: ["ADMIN", "HR"],
};

function newToken() {
  // 24 bytes → 32-char base64url. Plenty of entropy, short enough for a URL.
  return crypto.randomBytes(24).toString("base64url");
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const links = await prisma.inviteLink.findMany({
    where: { invitedById: userId },
    orderBy: [{ revokedAt: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ links });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  const userRole = (session?.user as { role?: string })?.role as
    | "ADMIN" | "INSTITUTION" | "HR" | "ORG" | "STUDENT" | "MENTOR" | undefined;
  if (!userId || !userRole) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const kind = String(body.kind || "").toUpperCase() as Kind;
  const label: string | null = body.label ? String(body.label).slice(0, 80) : null;
  const jobId: string | null = body.jobId ? String(body.jobId) : null;

  if (!KINDS.includes(kind)) {
    return NextResponse.json({ error: "Invalid invite kind" }, { status: 400 });
  }
  const allowed = KIND_PERMS[kind];
  if (!allowed.includes(userRole as never)) {
    return NextResponse.json(
      { error: `Your role (${userRole}) cannot create ${kind} invite links` },
      { status: 403 }
    );
  }

  // Pull inviter's org/institution context so it gets baked into the link.
  const inviter = await prisma.user.findUnique({
    where: { id: userId },
    select: { organisation: true, name: true },
  });

  let organisation: string | null = null;
  let institutionId: string | null = null;
  let collegeName: string | null = null;

  if (kind === "HR") {
    organisation = inviter?.organisation || inviter?.name || null;
    if (!organisation && userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Set your organisation name first — HR invites need a company to attach to." },
        { status: 400 }
      );
    }
    // Admin can override organisation explicitly.
    if (userRole === "ADMIN" && body.organisation) organisation = String(body.organisation);
  }

  if (kind === "INSTITUTE_STUDENT") {
    institutionId = userId;
    collegeName = inviter?.organisation || inviter?.name || null;
    if (userRole === "ADMIN") {
      // Admin can mint a link on behalf of an institution.
      if (body.institutionId) institutionId = String(body.institutionId);
      if (body.collegeName) collegeName = String(body.collegeName);
    }
  }

  if (kind === "CANDIDATE") {
    organisation = inviter?.organisation || inviter?.name || null;
  }

  // Validate jobId belongs to the inviter when provided (CANDIDATE only).
  if (jobId && kind !== "CANDIDATE") {
    return NextResponse.json({ error: "jobId only applies to CANDIDATE invites" }, { status: 400 });
  }
  if (jobId) {
    const job = await prisma.jobPosting.findUnique({
      where: { id: jobId },
      select: { postedById: true },
    });
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
    if (job.postedById !== userId && userRole !== "ADMIN") {
      return NextResponse.json({ error: "You can only attach your own jobs" }, { status: 403 });
    }
  }

  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const role = KIND_TO_ROLE[kind];

  const link = await prisma.inviteLink.create({
    data: {
      token: newToken(),
      kind,
      role,
      invitedById: userId,
      organisation,
      institutionId,
      collegeName,
      jobId,
      label,
      expiresAt,
    },
  });

  return NextResponse.json({ link }, { status: 201 });
}
