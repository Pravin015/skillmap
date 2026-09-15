"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { companyCan } from "@/lib/permissions";
import { audit } from "@/lib/notify";
import { getTrainerAgreement } from "@/lib/agreements";
import { clientIp } from "@/lib/ratelimit";
import type { ActionState } from "@/lib/types";

/** Trainer accepts the current platform agreement. Recorded with version, time and IP in the audit log. */
export async function acceptTrainerAgreement(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (!user.trainerProfile && !user.hasTrainerProfile) return { error: "Trainer accounts only." };
  if (String(fd.get("accept")) !== "1") return { error: "Tick the box to accept." };
  const { version } = await getTrainerAgreement();
  await db.user.update({ where: { id: user.id }, data: { agreementVersion: version, agreementAcceptedAt: new Date() } });
  await audit(user.id, "agreement.accept", `trainer-v${version}`, { ip: await clientIp() });
  revalidatePath("/agreements/trainer"); revalidatePath("/dashboard");
  return { ok: `Trainer Agreement v${version} accepted. You can apply to requirements.` };
}

/** Company sets the NDA text trainers must accept when they accept a work order. Empty text switches it off. */
export async function saveNda(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (!user.membership || !companyCan(user.membership.role, "company_settings")) return { error: "Only owners and admins edit the NDA." };
  const ndaText = String(fd.get("ndaText") ?? "").trim().slice(0, 20000);
  await db.company.update({ where: { id: user.membership.company.id }, data: { ndaText } });
  await audit(user.id, "company.nda", user.membership.company.id, { length: ndaText.length });
  revalidatePath("/settings");
  return { ok: ndaText ? "NDA saved. Trainers accept it when they accept your work orders." : "NDA removed." };
}
