import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@prisma/client";
import { db } from "./db";

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

export const getCurrentUser = cache(async () => {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    const uid = payload.uid as string;
    const act = payload.act as string | undefined;
    if (act) {
      // Impersonation stays valid only while the actor is still an active super admin.
      const actor = await db.user.findUnique({ where: { id: act }, select: { role: true, status: true } });
      if (!actor || actor.role !== "SUPER_ADMIN" || actor.status !== "ACTIVE") return null;
    }
    const user = await db.user.findUnique({
      where: { id: uid },
      include: {
        trainerProfile: { select: { id: true, slug: true, verifiedAt: true } },
        membership: { include: { company: { select: { id: true, slug: true, name: true, type: true } } } },
      },
    });
    if (!user || user.status === "SUSPENDED") return null;
    return { ...user, impersonatedBy: act ?? null };
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

export const isStaff = (u: { role: Role } | null) =>
  !!u && (u.role === "ADMIN" || u.role === "SUPER_ADMIN");
export const isCompany = (u: { role: Role } | null) => !!u && u.role === "COMPANY";
export const isTrainer = (u: { role: Role } | null) => !!u && u.role === "TRAINER";
