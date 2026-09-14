"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, getActor, requireRole } from "@/lib/auth";
import { audit } from "@/lib/notify";

/** Super admin views the platform as another member. Every start/stop is audit-logged; the session carries the real actor. */
export async function startImpersonation(fd: FormData) {
  const admin = await requireRole(["SUPER_ADMIN"]);
  const targetId = String(fd.get("userId"));
  const target = await db.user.findUnique({ where: { id: targetId } });
  if (!target || target.role === "SUPER_ADMIN") return;
  await audit(admin.id, "impersonate.start", targetId, { email: target.email });
  await createSession(targetId, admin.id);
  redirect("/dashboard");
}

export async function stopImpersonation() {
  const actor = await getActor();
  if (!actor) redirect("/");
  await audit(actor.actorId, "impersonate.stop", actor.userId);
  await createSession(actor.actorId);
  redirect(`/admin/users`);
}
