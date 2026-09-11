import "server-only";
import { db } from "./db";

/** Messaging is allowed between connected users, or between a company member and a trainer with an application at that company. */
export async function canMessage(a: string, b: string) {
  const conn = await db.connection.findFirst({ where: { status: "ACCEPTED", OR: [{ requesterId: a, addresseeId: b }, { requesterId: b, addresseeId: a }] } });
  if (conn) return true;
  const [ua, ub] = await Promise.all([
    db.user.findUnique({ where: { id: a }, include: { trainerProfile: { select: { id: true } }, membership: { select: { companyId: true } } } }),
    db.user.findUnique({ where: { id: b }, include: { trainerProfile: { select: { id: true } }, membership: { select: { companyId: true } } } }),
  ]);
  const trainer = ua?.trainerProfile ? ua : ub?.trainerProfile ? ub : null;
  const member = ua?.membership ? ua : ub?.membership ? ub : null;
  if (!trainer?.trainerProfile || !member?.membership) return false;
  const app = await db.application.findFirst({ where: { trainerId: trainer.trainerProfile.id, requirement: { companyId: member.membership.companyId } } });
  return !!app;
}
