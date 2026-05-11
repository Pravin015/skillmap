import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { rateLimitAsync, getClientIP } from "@/lib/rate-limit";
import { generateProfileNumber } from "@/lib/profile-number";

export async function POST(req: NextRequest) {
  const { allowed } = await rateLimitAsync(`signup:${getClientIP(req)}`, 5, 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Too many requests. Wait a minute." }, { status: 429 });
  try {
    const body = await req.json();
    const {
      name, email, password, role, organisation, phone, degree, gradYear,
      inviteToken,
    } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email and password are required" },
        { status: 400 }
      );
    }

    // Resolve invite token first — it can override role + organisation +
    // institutionId, and is the only way to mint MENTOR / HR / INSTITUTE
    // accounts via self-signup.
    let resolvedRole: string | null = role || null;
    let resolvedOrg: string | null = organisation || null;
    let resolvedInstitutionId: string | null = null;
    let resolvedCollegeName: string | null = null;
    let inviteJobId: string | null = null;
    let inviteLinkId: string | null = null;

    if (inviteToken) {
      const link = await prisma.inviteLink.findUnique({ where: { token: String(inviteToken) } });
      if (!link) return NextResponse.json({ error: "Invite not found" }, { status: 404 });
      if (link.revokedAt) return NextResponse.json({ error: "Invite has been revoked" }, { status: 410 });
      if (link.expiresAt < new Date()) {
        return NextResponse.json({ error: "Invite has expired" }, { status: 410 });
      }
      resolvedRole = link.role;
      resolvedOrg = link.organisation;
      resolvedInstitutionId = link.institutionId;
      resolvedCollegeName = link.collegeName;
      inviteJobId = link.jobId;
      inviteLinkId = link.id;
    }

    if (!resolvedRole) {
      return NextResponse.json({ error: "Role is required" }, { status: 400 });
    }

    const validRoles = ["STUDENT", "HR", "ORG", "ADMIN", "INSTITUTION", "MENTOR"];
    if (!validRoles.includes(resolvedRole)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    // ADMIN can never be created via public signup, with or without an invite.
    if (resolvedRole === "ADMIN") {
      return NextResponse.json({ error: "Admin accounts cannot be self-created" }, { status: 403 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: resolvedRole as "STUDENT" | "HR" | "ORG" | "INSTITUTION" | "MENTOR",
        organisation: resolvedOrg || null,
        phone: phone || null,
        degree: degree || null,
        gradYear: gradYear || null,
      },
    });

    // For STUDENT roles created via INSTITUTE_STUDENT or CANDIDATE invites,
    // pre-create a StudentProfile so the institution link / college name is
    // captured immediately. Public student self-signup creates the profile
    // later in /api/profile so we leave that path untouched.
    if (resolvedRole === "STUDENT" && inviteLinkId) {
      try {
        await prisma.studentProfile.create({
          data: {
            userId: user.id,
            profileNumber: generateProfileNumber(),
            institutionId: resolvedInstitutionId,
            collegeName: resolvedCollegeName,
          },
        });
      } catch (e) { console.error("Profile pre-create failed:", e); }
    }

    // Mark the invite as used (single counter — the link itself stays
    // active until expiresAt or revokedAt, so multiple recipients can use
    // the same link within its window).
    if (inviteLinkId) {
      await prisma.inviteLink.update({
        where: { id: inviteLinkId },
        data: { usedCount: { increment: 1 } },
      }).catch(() => {});
    }

    // Optional auto-apply for CANDIDATE invites that pinned a job.
    if (inviteJobId && resolvedRole === "STUDENT") {
      try {
        const job = await prisma.jobPosting.findUnique({ where: { id: inviteJobId } });
        if (job && job.status === "ACTIVE" && !job.gamifyLabSlug) {
          // Skip auto-apply if a lab gate is required — the user has to
          // complete the lab first. They'll see the job on their dashboard.
          await prisma.application.create({
            data: { jobId: inviteJobId, userId: user.id, scoreMatch: 0 },
          }).catch(() => {});
        }
      } catch { /* ignore */ }
    }

    createNotification({ userId: user.id, type: "ACCOUNT_CREATED", title: "Welcome to AstraaHire!", message: `Hi ${user.name}, welcome to AstraaHire! Complete your profile to start getting matched with jobs.` }).catch(() => {});

    return NextResponse.json(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
