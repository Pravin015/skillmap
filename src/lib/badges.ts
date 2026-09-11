import "server-only";
import { db } from "./db";
import { ACTIVE_STATUSES } from "./billing";

export type Badge = { key: string; label: string; description: string; tone: "cyan" | "violet" | "lime" | "amber" | "neutral" };

/** Every badge a trainer has earned, in display order. */
export async function trainerBadges(trainerId: string) {
  const p = await db.trainerProfile.findUnique({
    where: { id: trainerId },
    select: {
      verifiedAt: true, userId: true,
      user: { select: { identityVerifiedAt: true, ratingsReceived: { select: { score: true } }, subscriptions: { where: { plan: "TRAINER_PRO", status: { in: ACTIVE_STATUSES } }, select: { id: true } } } },
      applications: { where: { status: "AWARDED", requirement: { status: "COMPLETED" } }, select: { id: true } },
      certifications: { where: { status: "VERIFIED" }, select: { id: true } },
    },
  });
  if (!p) return [] as Badge[];
  const learners = await db.feedbackResponse.aggregate({ where: { link: { trainerId } }, _avg: { score: true }, _count: true });
  const ratings = p.user.ratingsReceived;
  const avg = ratings.length ? ratings.reduce((n, r) => n + r.score, 0) / ratings.length : 0;
  const out: Badge[] = [];
  if (p.user.identityVerifiedAt) out.push({ key: "identity", label: "Identity verified", description: "Government ID checked by CorpGurus staff.", tone: "lime" });
  if (p.verifiedAt && p.certifications.length) out.push({ key: "certified", label: `${p.certifications.length} verified cert${p.certifications.length > 1 ? "s" : ""}`, description: "Certifications reviewed against the issuer by CorpGurus staff.", tone: "cyan" });
  if (avg >= 4.5 && ratings.length >= 3) out.push({ key: "top", label: "Top rated", description: `Average ${avg.toFixed(1)} from ${ratings.length} client ratings.`, tone: "amber" });
  if ((learners._avg.score ?? 0) >= 4.5 && learners._count >= 10) out.push({ key: "learners", label: "Learner favourite", description: `${learners._avg.score!.toFixed(1)} from ${learners._count} anonymous participant responses.`, tone: "lime" });
  if (p.applications.length >= 3) out.push({ key: "experienced", label: `${p.applications.length} completed on CorpGurus`, description: "Engagements awarded and completed through the platform.", tone: "neutral" });
  if (p.user.subscriptions.length) out.push({ key: "pro", label: "Trainer Pro", description: "Subscribed member with featured placement.", tone: "cyan" });
  return out;
}

export async function companyBadges(companyId: string) {
  const c = await db.company.findUnique({
    where: { id: companyId },
    select: { domainVerifiedAt: true, gstVerifiedAt: true, type: true, requirements: { where: { status: "COMPLETED" }, select: { id: true } }, subscriptions: { where: { status: { in: ACTIVE_STATUSES } }, select: { plan: true } }, members: { select: { userId: true } } },
  });
  if (!c) return [] as Badge[];
  const ratings = await db.rating.findMany({ where: { toUserId: { in: c.members.map((m) => m.userId) } }, select: { score: true } });
  const avg = ratings.length ? ratings.reduce((n, r) => n + r.score, 0) / ratings.length : 0;
  const out: Badge[] = [];
  if (c.domainVerifiedAt) out.push({ key: "domain", label: "Domain verified", description: "Company email domain confirmed by CorpGurus staff.", tone: "violet" });
  if (c.gstVerifiedAt) out.push({ key: "gst", label: "GST verified", description: "GSTIN checked by CorpGurus staff.", tone: "lime" });
  if (avg >= 4.5 && ratings.length >= 3) out.push({ key: "trusted", label: "Trusted hirer", description: `Average ${avg.toFixed(1)} from ${ratings.length} trainer ratings.`, tone: "amber" });
  if (c.requirements.length >= 3) out.push({ key: "active", label: `${c.requirements.length} engagements completed`, description: "Requirements awarded and completed through the platform.", tone: "neutral" });
  if (c.subscriptions.some((s) => s.plan === "PARTNER")) out.push({ key: "partner", label: "Training partner plan", description: "Subscribed training partner.", tone: "violet" });
  else if (c.subscriptions.length) out.push({ key: "growth", label: "Growth plan", description: "Subscribed company.", tone: "violet" });
  return out;
}
