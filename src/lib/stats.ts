import "server-only";
import { db } from "./db";

const today = () => { const d = new Date(); d.setUTCHours(0, 0, 0, 0); return d; };

/** Fire-and-forget counters. Errors are swallowed so analytics never break a page. */
export async function recordProfileView(trainerId: string) {
  try {
    await db.trainerStatDaily.upsert({ where: { trainerId_date: { trainerId, date: today() } }, create: { trainerId, date: today(), profileViews: 1 }, update: { profileViews: { increment: 1 } } });
  } catch { /* ignore */ }
}

export async function recordSearchAppearances(trainerIds: string[]) {
  if (!trainerIds.length) return;
  const date = today();
  try {
    await db.$transaction(trainerIds.map((trainerId) => db.trainerStatDaily.upsert({ where: { trainerId_date: { trainerId, date } }, create: { trainerId, date, searchAppearances: 1 }, update: { searchAppearances: { increment: 1 } } })));
  } catch { /* ignore */ }
}

export async function trainerStats(trainerId: string, days = 30) {
  const since = new Date(today().getTime() - (days - 1) * 86400000);
  const rows = await db.trainerStatDaily.findMany({ where: { trainerId, date: { gte: since } }, orderBy: { date: "asc" } });
  const byDay = new Map(rows.map((r) => [r.date.toISOString().slice(0, 10), r]));
  const series: { date: string; views: number; searches: number }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(since.getTime() + i * 86400000).toISOString().slice(0, 10);
    const r = byDay.get(d);
    series.push({ date: d, views: r?.profileViews ?? 0, searches: r?.searchAppearances ?? 0 });
  }
  return { series, views: series.reduce((n, r) => n + r.views, 0), searches: series.reduce((n, r) => n + r.searches, 0) };
}

/** Anonymous learner feedback aggregated across all of a trainer's engagements. */
export async function learnerScore(trainerId: string) {
  const agg = await db.feedbackResponse.aggregate({ where: { link: { trainerId } }, _avg: { score: true }, _count: true });
  const recommend = agg._count ? await db.feedbackResponse.count({ where: { link: { trainerId }, wouldRecommend: true } }) : 0;
  return { avg: agg._avg.score, count: agg._count, recommendPct: agg._count ? Math.round((recommend / agg._count) * 100) : 0 };
}
