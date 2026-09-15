import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@prisma/client";
import { db } from "./db";
import { isStaffRole, staffCan, type StaffPermission } from "./permissions";

const COOKIE = "cg_session";
const secret = new TextEncoder().encode(process.env.AUTH_SECRET ?? "dev-secret");

export async function createSession(userId: string, actorId?: string) {
  const token = await new SignJWT(actorId ? { uid: userId, act: actorId } : { uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

const membershipInclude = { include: { company: { select: { id: true, slug: true, name: true, type: true } } }, orderBy: { joinedAt: "asc" as const } };

/**
 * The signed-in user with their trainer profile and company memberships.
 * `membership` is the ACTIVE company context: the one picked with the context switcher, or the first membership.
 * A trainer who also belongs to companies is in "personal" (trainer) mode until they switch, so `membership` is null then.
 */
export const getCurrentUser = cache(async () => {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    const uid = payload.uid as string;
    const act = payload.act as string | undefined;
    if (act) {
      // Impersonation stays valid only while the actor is still active staff with the support permission.
      const actor = await db.user.findUnique({ where: { id: act }, select: { role: true, status: true } });
      if (!actor || !staffCan(actor.role, "support") || actor.status !== "ACTIVE") return null;
    }
    const user = await db.user.findUnique({
      where: { id: uid },
      include: {
        trainerProfile: { select: { id: true, slug: true, verifiedAt: true } },
        memberships: membershipInclude,
      },
    });
    if (!user || user.status !== "ACTIVE") return null;
    const active = user.memberships.find((m) => m.companyId === user.activeCompanyId) ?? null;
    const membership = active ?? (user.trainerProfile && user.activeCompanyId === null ? null : user.memberships[0] ?? null);
    // Context-scoped identity: while acting for a company, the trainer profile is hidden so trainer-only actions
    // (applying, invoicing) are not mixed into company work. `hasTrainerProfile` keeps the switcher informed.
    const trainerProfile = membership && user.trainerProfile ? null : user.trainerProfile;
    return { ...user, trainerProfile, hasTrainerProfile: !!user.trainerProfile, membership, impersonatedBy: act ?? null };
  } catch {
    return null;
  }
});

/** Who is really behind the session when impersonating. */
export async function getActor() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload.act ? { actorId: payload.act as string, userId: payload.uid as string } : null;
  } catch { return null; }
}

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export async function requireUser(next?: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  return user;
}

export async function requireRole(roles: Role[], next?: string) {
  const user = await requireUser(next);
  if (!roles.includes(user.role)) redirect("/dashboard");
  return user;
}

/** Staff gate by permission rather than by role, so moderators, finance and support each see only their pages. */
export async function requireStaff(perm: StaffPermission, next?: string) {
  const user = await requireUser(next);
  if (!isStaffRole(user.role)) redirect("/dashboard");
  if (!staffCan(user.role, perm)) redirect("/admin");
  return user;
}

/** Staff gate that accepts any of several permissions (e.g. the users page serves both account admins and support). */
export async function requireStaffAny(perms: StaffPermission[], next?: string) {
  const user = await requireUser(next);
  if (!isStaffRole(user.role)) redirect("/dashboard");
  if (!perms.some((p) => staffCan(user.role, p))) redirect("/admin");
  return user;
}

export const isStaff = (u: { role: Role } | null) => !!u && isStaffRole(u.role);
export const isCompany = (u: { role: Role } | null) => !!u && u.role === "COMPANY";
export const isTrainer = (u: { role: Role } | null) => !!u && u.role === "TRAINER";
