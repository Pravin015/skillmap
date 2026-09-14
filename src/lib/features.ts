import "server-only";
import { db } from "@/lib/db";

/** Feature flags stored as Setting rows `feature_<key>` ("1" on, "0" off). Missing rows mean on. */
export const FEATURES: { key: string; label: string; blurb: string }[] = [
  { key: "escrow", label: "Escrow / managed payments", blurb: "Companies can fund work orders with CorpGurus and release after delivery." },
  { key: "teams", label: "Trainer teams", blurb: "Trainers form teams and apply jointly." },
  { key: "learning_paths", label: "Learning paths", blurb: "Companies plan multi-step programmes and post steps as requirements." },
  { key: "api", label: "Public API and webhooks", blurb: "Companies create API keys and webhook endpoints." },
  { key: "certificates", label: "Completion certificates", blurb: "Issue verifiable participant certificates from the requirement page." },
  { key: "referrals", label: "Referral rewards", blurb: "Members earn a free month for qualified referrals." },
];

export async function featureEnabled(key: string) {
  const row = await db.setting.findUnique({ where: { key: `feature_${key}` } });
  return row ? row.value !== "0" : true;
}

export async function featureMap() {
  const rows = await db.setting.findMany({ where: { key: { startsWith: "feature_" } } });
  const map = new Map(rows.map((r) => [r.key.replace("feature_", ""), r.value !== "0"]));
  return Object.fromEntries(FEATURES.map((f) => [f.key, map.get(f.key) ?? true])) as Record<string, boolean>;
}
