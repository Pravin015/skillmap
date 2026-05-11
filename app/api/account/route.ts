import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET — fetch account details
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, phone: true, role: true, organisation: true, profileImage: true, createdAt: true, mustChangePassword: true },
  });

  return NextResponse.json({ user });
}

// PATCH — update account details
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, phone, organisation, currentPassword, newPassword } = await req.json();

  const updateData: Record<string, unknown> = {};

  if (name) updateData.name = name;
  if (phone !== undefined) updateData.phone = phone || null;
  // Org/HR/Institution accounts can update their organisation name from
  // their respective dashboards. Skip if undefined to preserve current value.
  if (organisation !== undefined) updateData.organisation = organisation || null;

  // Password change requires current password
  if (newPassword) {
    if (!currentPassword) return NextResponse.json({ error: "Current password required" }, { status: 400 });
    if (newPassword.length < 6) return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });

    updateData.password = await bcrypt.hash(newPassword, 12);
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: { name: true, email: true, phone: true },
  });

  return NextResponse.json({ user: updated });
}

// DELETE — delete the caller's own account.
// Requires the user to type their email + current password as confirmation
// to defeat accidental deletion or stolen-session attacks.
//
// Most relations cascade (onDelete: Cascade in schema). For relations
// that don't, we either anonymise or hard-delete here. Specifically:
//   - JobPosting (HR/ORG): kept as-is but the postedBy relation cascades
//     so the job rows go too. Application rows on those jobs also cascade.
//   - Course (creator): cascades to enrollments, certificates, modules.
//   - BlogPost (author): cascade.
//   - Notifications, Sessions: cascade.
//
// We do NOT delete BlogPost / Course rows authored by this user if they
// have other engagement (enrollments, comments) — for now schema cascade
// rules govern that. If you need soft-delete-with-handover, that's a
// separate feature.
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email, password } = await req.json().catch(() => ({} as Record<string, string>));

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password required to confirm deletion" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Confirm both email match and password match — defeats CSRF + stolen-cookie misuse.
  if (user.email.toLowerCase() !== String(email).toLowerCase().trim()) {
    return NextResponse.json({ error: "Email doesn't match your account" }, { status: 400 });
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return NextResponse.json({ error: "Password is incorrect" }, { status: 400 });
  }

  // Block last admin from deleting themselves — would lock everyone out.
  if (user.role === "ADMIN") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) {
      return NextResponse.json(
        { error: "Cannot delete the last admin account. Promote another user to admin first." },
        { status: 400 }
      );
    }
  }

  // Hard delete — relies on schema cascades for related rows.
  // If a relation doesn't cascade and the delete fails, surface the error
  // so the user knows there's leftover data we couldn't auto-handle.
  try {
    await prisma.user.delete({ where: { id: userId } });
  } catch (err) {
    console.error("Account deletion failed:", err);
    return NextResponse.json(
      { error: "Couldn't fully delete the account — please email support@astraahire.com so we can clean it up manually." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, message: "Account deleted" });
}
