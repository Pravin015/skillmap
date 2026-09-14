"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { sendEmail, renderEmail } from "@/lib/email";
import { buildIcs } from "@/lib/ics";
import { appUrl } from "@/lib/oauth";
import type { ActionState } from "@/lib/types";
import { createMeeting, type MeetingProvider } from "@/lib/meetings";
import { pushEventToUser, removeEventsForUser } from "@/lib/calendar";
import { memberCan } from "@/lib/permissions";
import { fmtInTz, zonedToUtc } from "@/lib/tz";

function refresh(requirementId: string) {
  revalidatePath(`/dashboard/requirements/${requirementId}/applicants`);
  revalidatePath(`/requirements/${requirementId}`);
  revalidatePath("/dashboard/applications");
  revalidatePath("/dashboard");
}

const fmtSlot = (d: Date, tz = "Asia/Kolkata") => fmtInTz(d, tz);

/** Company proposes up to three slots for a shortlisted applicant. */
export async function proposeInterview(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (!user.membership) return { error: "Only company members schedule interviews." };
  const applicationId = String(fd.get("applicationId"));
  const app = await db.application.findFirst({ where: { id: applicationId, requirement: { companyId: user.membership.company.id } }, include: { requirement: { select: { id: true, title: true } }, trainer: { select: { userId: true } }, interview: true } });
  if (!app) return { error: "Application not found." };
  if (!["SHORTLISTED", "APPLIED"].includes(app.status)) return { error: "Interviews are for applied or shortlisted trainers." };
  if (app.interview && app.interview.status === "CONFIRMED") return { error: "An interview is already confirmed. Cancel it first to propose new slots." };
  const proposer = await db.user.findUnique({ where: { id: user.id }, select: { timezone: true } });
  const tz = proposer?.timezone ?? "Asia/Kolkata";
  const slots = [1, 2, 3].map((i) => String(fd.get(`slot${i}`) || "")).filter(Boolean).map((s) => zonedToUtc(s, tz)).filter((d): d is Date => !!d && d > new Date());
  if (!slots.length) return { error: "Propose at least one future date and time." };
  const mode = (["VIDEO", "PHONE", "ONSITE"].includes(String(fd.get("mode"))) ? String(fd.get("mode")) : "VIDEO") as "VIDEO" | "PHONE" | "ONSITE";
  const durationMin = [15, 30, 45, 60].includes(Number(fd.get("durationMin"))) ? Number(fd.get("durationMin")) : 30;
  const location = String(fd.get("location") ?? "").trim();
  const note = String(fd.get("note") ?? "").trim();
  const data = { proposedById: user.id, status: "PROPOSED" as const, mode, durationMin, location, note, responseNote: null, confirmedSlotId: null };
  const interview = app.interview
    ? await db.interview.update({ where: { id: app.interview.id }, data: { ...data, slots: { deleteMany: {}, create: slots.map((startsAt) => ({ startsAt })) } } })
    : await db.interview.create({ data: { ...data, applicationId, slots: { create: slots.map((startsAt) => ({ startsAt })) } } });
  if (app.status === "APPLIED") await db.application.update({ where: { id: applicationId }, data: { status: "SHORTLISTED", statusChangedAt: new Date() } });
  const trainerTz = (await db.user.findUnique({ where: { id: app.trainer.userId }, select: { timezone: true } }))?.timezone ?? "Asia/Kolkata";
  await notify(app.trainer.userId, "application", `Interview slots from ${user.membership.company.name}`, `${app.requirement.title}: ${slots.map((d) => fmtSlot(d, trainerTz)).join(" / ")}. Pick one.`, `/requirements/${app.requirement.id}`);
  refresh(app.requirement.id);
  void interview;
  return { ok: `Sent ${slots.length} slot${slots.length > 1 ? "s" : ""} to the trainer.` };
}

/** Trainer picks a slot (confirms) or declines with a note. Confirmation emails both sides a calendar invite. */
export async function respondInterview(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const id = String(fd.get("id"));
  const slotId = String(fd.get("slotId") || "");
  const decline = String(fd.get("decline")) === "1";
  const note = String(fd.get("note") ?? "").trim();
  const iv = await db.interview.findUnique({ where: { id }, include: { slots: true, proposedBy: { select: { id: true, name: true, email: true } }, application: { include: { requirement: { include: { company: { include: { members: { select: { userId: true, role: true } } } } } }, trainer: { include: { user: { select: { id: true, name: true, email: true } } } } } } } });
  if (!iv || iv.application.trainer.user.id !== user.id) return { error: "Only the invited trainer can respond." };
  if (iv.status !== "PROPOSED") return { error: "This interview is not awaiting a response." };
  const req = iv.application.requirement;
  const members = req.company.members.map((m) => m.userId);
  if (decline) {
    await db.interview.update({ where: { id }, data: { status: "DECLINED", responseNote: note || null } });
    await notify(members, "application", `${user.name} can't make the proposed slots`, note || "Propose new times from the applicants page.", `/dashboard/requirements/${req.id}/applicants`);
    refresh(req.id);
    return { ok: "Sent. The company can propose new times." };
  }
  const slot = iv.slots.find((s) => s.id === slotId);
  if (!slot) return { error: "Pick one of the proposed slots." };
  await db.interview.update({ where: { id }, data: { status: "CONFIRMED", confirmedSlotId: slot.id, responseNote: note || null } });
  // Meeting link (Zoom / Meet / Teams per the company's preference) and calendar events on both sides.
  let meetingUrl: string | null = null;
  const calendarEvents: Record<string, Record<string, string>> = {};
  if (iv.mode === "VIDEO") {
    const m = await createMeeting({ provider: (req.company.meetingProvider ?? "AUTO") as MeetingProvider, hostUserId: iv.proposedBy.id, topic: `Interview: ${req.title}`, startsAt: slot.startsAt, durationMin: iv.durationMin, attendees: [user.email, iv.proposedBy.email], description: `${req.company.name} × ${user.name} · CorpGurus` });
    if (m) { meetingUrl = m.url; if (m.calendarEventId) calendarEvents[iv.proposedBy.id] = { [m.provider === "MEET" ? "GOOGLE" : "MICROSOFT"]: m.calendarEventId }; }
  }
  const evInput = { title: `Interview: ${req.title}`, description: `${req.company.name} × ${user.name}${meetingUrl ? `\nJoin: ${meetingUrl}` : ""}${iv.location ? `\n${iv.location}` : ""}\n${appUrl()}/requirements/${req.id}`, start: slot.startsAt, end: new Date(slot.startsAt.getTime() + iv.durationMin * 60000), location: meetingUrl ?? iv.location ?? undefined };
  calendarEvents[user.id] = await pushEventToUser(user.id, evInput);
  if (!calendarEvents[iv.proposedBy.id]) calendarEvents[iv.proposedBy.id] = await pushEventToUser(iv.proposedBy.id, evInput);
  await db.interview.update({ where: { id }, data: { meetingUrl, meetingProvider: meetingUrl ? "auto" : null, calendarEvents } });
  const [meTz, propTz] = await Promise.all([db.user.findUnique({ where: { id: user.id }, select: { timezone: true } }), db.user.findUnique({ where: { id: iv.proposedBy.id }, select: { timezone: true } })]);
  const when = fmtSlot(slot.startsAt, meTz?.timezone);
  const whenProposer = fmtSlot(slot.startsAt, propTz?.timezone);
  const title = `Interview: ${req.title}`;
  const description = `${req.company.name} × ${user.name}\n${iv.mode === "VIDEO" ? "Video call" : iv.mode === "PHONE" ? "Phone call" : "In person"}${iv.location ? ` · ${iv.location}` : ""}\n${iv.note}\n\nManage: ${appUrl()}/requirements/${req.id}`;
  const ics = (organizer: { name: string; email: string }, attendee: { name: string; email: string }) => buildIcs({ uid: iv.id, title, description: meetingUrl ? `Join: ${meetingUrl}\n${description}` : description, location: meetingUrl ?? iv.location, start: slot.startsAt, durationMin: iv.durationMin, organizer, attendee, url: `${appUrl()}/requirements/${req.id}` });
  const body = `${when} · ${iv.durationMin} min · ${iv.mode === "VIDEO" ? "video" : iv.mode === "PHONE" ? "phone" : "in person"}${meetingUrl ? ` · ${meetingUrl}` : iv.location ? ` · ${iv.location}` : ""}`;
  await notify(members, "application", `${user.name} confirmed the interview`, body.replace(when, whenProposer), `/dashboard/requirements/${req.id}/applicants`);
  await notify(user.id, "application", "Interview confirmed", `${req.company.name} · ${body}`, `/requirements/${req.id}`);
  const { html, text } = renderEmail({ title: `Interview confirmed · ${when}`, body: `${req.title}\n${body}\n\nA calendar invite is attached.`, ctaHref: `/requirements/${req.id}`, ctaLabel: "Open on CorpGurus" });
  const organizer = { name: iv.proposedBy.name, email: iv.proposedBy.email }, attendee = { name: user.name, email: user.email };
  await Promise.all([
    sendEmail({ to: user.email, subject: `Interview confirmed · ${req.title}`, html, text, userId: user.id, attachments: [{ filename: "interview.ics", content: ics(organizer, attendee) }] }),
    sendEmail({ to: iv.proposedBy.email, subject: `${user.name} confirmed · ${req.title}`, html, text, userId: iv.proposedBy.id, attachments: [{ filename: "interview.ics", content: ics(organizer, attendee) }] }),
  ]);
  refresh(req.id);
  return { ok: `Confirmed for ${when}. Calendar invites have been emailed to both of you.` };
}

export async function cancelInterview(fd: FormData) {
  const user = await requireUser();
  const id = String(fd.get("id"));
  const iv = await db.interview.findUnique({ where: { id }, include: { application: { include: { requirement: { include: { company: { include: { members: { select: { userId: true, role: true } } } } } }, trainer: { select: { userId: true } } } } } });
  if (!iv) return;
  const req = iv.application.requirement;
  const isMember = memberCan(req.company.members, user.id, "hire");
  const isTrainer = iv.application.trainer.userId === user.id;
  if (!isMember && !isTrainer) return;
  await db.interview.update({ where: { id }, data: { status: "CANCELLED" } });
  { const ce = iv.calendarEvents as Record<string, Record<string, string>> | null; if (ce) for (const [uid, ids] of Object.entries(ce)) await removeEventsForUser(uid, ids); }
  await notify(isMember ? [iv.application.trainer.userId] : req.company.members.map((m) => m.userId), "application", "Interview cancelled", `${req.title} · cancelled by ${user.name}.`, isMember ? `/requirements/${req.id}` : `/dashboard/requirements/${req.id}/applicants`);
  refresh(req.id);
}
