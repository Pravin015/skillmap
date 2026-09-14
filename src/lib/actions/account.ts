"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

/**
 * Switch the active context: a company the user belongs to, or "personal" (trainer view) for trainers who also sit on company teams.
 * Stored on the user so it survives devices and sessions.
 */
export async function switchContext(fd: FormData) {
  const user = await requireUser();
  const target = String(fd.get("companyId") || "");
  if (target) {
    const m = user.memberships.find((x) => x.companyId === target);
    if (!m) return;
    await db.user.update({ where: { id: user.id }, data: { activeCompanyId: target } });
  } else {
    await db.user.update({ where: { id: user.id }, data: { activeCompanyId: null } });
  }
  revalidatePath("/", "layout");
  redirect("/dashboard");
}
