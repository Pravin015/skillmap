import { Search } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Button, Empty, Input, PageHeader, Select } from "@/components/ui";
import { TrainerCard } from "@/components/cards";
import { DELIVERY_MODES, modeLabel } from "@/lib/utils";
import { proTrainerUserIds } from "@/lib/billing";
import { recordSearchAppearances } from "@/lib/stats";

export const metadata = { title: "Trainers" };

type SP = { q?: string; skill?: string; city?: string; mode?: string; verified?: string; sort?: string };

export default async function TrainersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const showRate = !!user && user.role !== "TRAINER";

  const where: Prisma.TrainerProfileWhereInput = {
    user: { status: "ACTIVE" },
    ...(sp.q ? { OR: [{ headline: { contains: sp.q, mode: "insensitive" } }, { bio: { contains: sp.q, mode: "insensitive" } }, { user: { name: { contains: sp.q, mode: "insensitive" } } }, { skills: { some: { name: { contains: sp.q, mode: "insensitive" } } } }] } : {}),
    ...(sp.skill ? { skills: { some: { slug: sp.skill } } } : {}),
    ...(sp.city ? { cities: { has: sp.city } } : {}),
    ...(sp.mode ? { deliveryModes: { has: sp.mode as "ONSITE" | "VIRTUAL" | "HYBRID" } } : {}),
    ...(sp.verified ? { verifiedAt: { not: null } } : {}),
  };
  const [trainersRaw, skills, ratings, pro] = await Promise.all([
    db.trainerProfile.findMany({ where, include: { user: { select: { name: true, avatarUrl: true } }, skills: true }, orderBy: sp.sort === "experience" ? { yearsExperience: "desc" } : [{ verifiedAt: { sort: "desc", nulls: "last" } }, { createdAt: "asc" }] }),
    db.skill.findMany({ orderBy: { name: "asc" } }),
    db.rating.groupBy({ by: ["toUserId"], _avg: { score: true }, _count: true }),
    proTrainerUserIds(),
  ]);
  // Trainer Pro members are featured: they sort ahead of everyone else within the chosen order.
  const trainers = [...trainersRaw].sort((a, b) => Number(pro.has(b.userId)) - Number(pro.has(a.userId)));
  await recordSearchAppearances(trainers.slice(0, 24).map((t) => t.id));
  const cities = Array.from(new Set((await db.trainerProfile.findMany({ select: { cities: true } })).flatMap((t) => t.cities))).sort();
  const avg = new Map(ratings.map((r) => [r.toUserId, r._avg.score]));

  return (
    <div>
      <PageHeader eyebrow="Directory" title="Freelance corporate trainers" body="Verified instructors across cloud, security, networking, leadership, sales and compliance. Filter by skill, city and delivery mode." />
      <form className="mb-6 grid gap-3 rounded-2xl border border-line bg-white p-4 md:grid-cols-[1fr_180px_160px_140px_auto_auto]">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
          <Input name="q" defaultValue={sp.q} placeholder="Search by name, skill or keyword" className="pl-9" />
        </div>
        <Select name="skill" defaultValue={sp.skill ?? ""}><option value="">Any skill</option>{skills.map((s) => <option key={s.id} value={s.slug}>{s.name}</option>)}</Select>
        <Select name="city" defaultValue={sp.city ?? ""}><option value="">Any city</option>{cities.map((c) => <option key={c} value={c}>{c}</option>)}</Select>
        <Select name="mode" defaultValue={sp.mode ?? ""}><option value="">Any mode</option>{DELIVERY_MODES.map((m) => <option key={m} value={m}>{modeLabel[m]}</option>)}</Select>
        <label className="flex items-center gap-2 px-1 text-sm text-muted"><input type="checkbox" name="verified" value="1" defaultChecked={!!sp.verified} className="accent-cyan" /> Verified only</label>
        <Button type="submit" variant="secondary">Filter</Button>
      </form>
      <p className="mono mb-4 text-[11px] uppercase tracking-wider text-dim">{trainers.length} trainer{trainers.length === 1 ? "" : "s"}</p>
      {trainers.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {trainers.map((t) => <TrainerCard key={t.id} t={{ ...t, avg: avg.get(t.userId) ?? null, pro: pro.has(t.userId) }} showRate={showRate} />)}
        </div>
      ) : (
        <Empty title="No trainers match those filters" body="Try a broader skill or clear the city filter." />
      )}
    </div>
  );
}
