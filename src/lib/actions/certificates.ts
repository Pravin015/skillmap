"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { sendEmail, renderEmail } from "@/lib/email";
import { appUrl } from "@/lib/oauth";
import type { ActionState } from "@/lib/types";
import { memberCan } from "@/lib/permissions";

const code = () => randomBytes(5).toString("hex").toUpperCase().match(/.{1,5}/g)!.join("-");

/** Trainer or company issues completion certificates for an awarded/completed engagement. One line per participant: "Name" or "Name, email". */
export async function issueCertificates(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const requirementId = String(fd.get("requirementId"));
  const req = await db.requirement.findUnique({ where: { id: requirementId }, include: { company: { include: { members: { select: { userId: true, role: true } } } }, applications: { where: { status: "AWARDED" }, include: { trainer: { select: { id: true, userId: true, user: { select: { name: true } } } } } } } });
  if (!req || !["AWARDED", "COMPLETED"].includes(req.status)) return { error: "Certificates can be issued once the engagement is awarded." };
  const awarded = req.applications[0];
  if (!awarded) return { error: "No awarded trainer on this requirement." };
  const allowed = memberCan(req.company.members, user.id, "hire") || awarded.trainer.userId === user.id;
  if (!allowed) return { error: "Only the company or the awarded trainer can issue certificates." };
  const lines = String(fd.get("participants") ?? "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return { error: "Add at least one participant, one per line." };
  if (lines.length > 500) return { error: "Up to 500 participants per batch." };
  const existing = await db.issuedCertificate.findMany({ where: { requirementId, revokedAt: null }, select: { participantName: true } });
  const have = new Set(existing.map((e) => e.participantName.toLowerCase()));
  const created: { name: string; email: string | null; code: string }[] = [];
  for (const line of lines) {
    const [name, email] = line.split(",").map((s) => s.trim());
    if (!name || have.has(name.toLowerCase())) continue;
    const c = code();
    await db.issuedCertificate.create({ data: { code: c, requirementId, trainerId: awarded.trainer.id, participantName: name.slice(0, 120), participantEmail: email && /@/.test(email) ? email.toLowerCase() : null } });
    have.add(name.toLowerCase());
    created.push({ name, email: email && /@/.test(email) ? email : null, code: c });
  }
  // Email participants who have an address.
  const sendMail = String(fd.get("email")) === "1";
  if (sendMail) {
    await Promise.all(created.filter((c) => c.email).map((c) => {
      const url = `${appUrl()}/certificates/${c.code}`;
      const { html, text } = renderEmail({ title: `Your certificate · ${req.title}`, body: `Congratulations ${c.name}. Your completion certificate for “${req.title}”, delivered by ${awarded.trainer.user.name} for ${req.company.name}, is ready. Certificate ID ${c.code}.`, ctaHref: url, ctaLabel: "View and print certificate", footer: "Anyone can verify this certificate at the same link." });
      return sendEmail({ to: c.email!, subject: `Your certificate · ${req.title}`, html, text });
    }));
  }
  const others = [...req.company.members.map((m) => m.userId), awarded.trainer.userId].filter((id) => id !== user.id);
  await notify(others, "requirement", `${created.length} certificate${created.length === 1 ? "" : "s"} issued`, `${req.title} · issued by ${user.name}`, `/requirements/${requirementId}`);
  revalidatePath(`/requirements/${requirementId}`);
  return { ok: `${created.length} certificate${created.length === 1 ? "" : "s"} issued${lines.length - created.length ? ` (${lines.length - created.length} duplicate${lines.length - created.length === 1 ? "" : "s"} skipped)` : ""}${sendMail ? ", emails sent where an address was given" : ""}.` };
}

export async function revokeCertificate(fd: FormData) {
  const user = await requireUser();
  const c = await db.issuedCertificate.findUnique({ where: { id: String(fd.get("id")) }, include: { requirement: { include: { company: { include: { members: { select: { userId: true, role: true } } } } } }, trainer: { select: { userId: true } } } });
  if (!c) return;
  const allowed = memberCan(c.requirement.company.members, user.id, "hire") || c.trainer.userId === user.id;
  if (!allowed) return;
  await db.issuedCertificate.update({ where: { id: c.id }, data: { revokedAt: new Date() } });
  revalidatePath(`/requirements/${c.requirementId}`); revalidatePath(`/certificates/${c.code}`);
}
