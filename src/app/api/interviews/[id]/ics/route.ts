import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { buildIcs } from "@/lib/ics";
import { appUrl } from "@/lib/oauth";

/** Calendar file for a confirmed interview, for either participant. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "sign in" }, { status: 401 });
  const { id } = await params;
  const iv = await db.interview.findUnique({ where: { id }, include: { slots: true, proposedBy: { select: { name: true, email: true } }, application: { include: { requirement: { include: { company: { include: { members: { select: { userId: true } } } } } }, trainer: { include: { user: { select: { id: true, name: true, email: true } } } } } } } });
  if (!iv || iv.status !== "CONFIRMED") return NextResponse.json({ error: "not found" }, { status: 404 });
  const req = iv.application.requirement;
  const allowed = iv.application.trainer.user.id === user.id || req.company.members.some((m) => m.userId === user.id);
  if (!allowed) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const slot = iv.slots.find((s) => s.id === iv.confirmedSlotId);
  if (!slot) return NextResponse.json({ error: "no slot" }, { status: 404 });
  const ics = buildIcs({ uid: iv.id, title: `Interview: ${req.title}`, description: `${req.company.name} × ${iv.application.trainer.user.name}\n${iv.note}`, location: iv.location, start: slot.startsAt, durationMin: iv.durationMin, organizer: iv.proposedBy, attendee: iv.application.trainer.user, url: `${appUrl()}/requirements/${req.id}` });
  return new NextResponse(ics, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="interview-${req.id}.ics"` } });
}
