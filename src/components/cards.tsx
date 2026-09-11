import Link from "next/link";
import { BadgeCheck, Building2, CalendarDays, MapPin, Users } from "lucide-react";
import type { Company, DeliveryMode, Requirement, ReqStatus, Skill, TrainerProfile, User } from "@prisma/client";
import { Avatar, Badge, Chip } from "./ui";
import { dateRange, modeLabel, rateRange, reqStatusLabel, timeAgo } from "@/lib/utils";

export const reqTone: Record<ReqStatus, "cyan" | "amber" | "violet" | "lime" | "rose" | "neutral"> = {
  OPEN: "cyan", SHORTLISTING: "amber", AWARDED: "violet", COMPLETED: "lime", CANCELLED: "rose",
};

export function TrainerCard({ t, showRate }: {
  t: TrainerProfile & { user: Pick<User, "name" | "avatarUrl">; skills: Skill[]; _count?: { applications: number }; avg?: number | null; ratings?: number };
  showRate: boolean;
}) {
  return (
    <Link href={`/trainers/${t.slug}`} className="group block rounded-2xl border border-line bg-surface/70 p-5 transition hover:-translate-y-0.5 hover:border-cyan/40 hover:shadow-[0_8px_40px_rgba(34,211,238,0.08)]">
      <div className="flex items-start gap-3">
        <Avatar name={t.user.name} src={t.user.avatarUrl} size={48} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 font-display font-semibold">
            <span className="truncate">{t.user.name}</span>
            {t.verifiedAt ? <BadgeCheck size={16} className="shrink-0 text-cyan" aria-label="Verified" /> : null}
          </p>
          <p className="line-clamp-2 text-sm text-muted">{t.headline}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {t.skills.slice(0, 4).map((s) => <Chip key={s.id}>{s.name}</Chip>)}
        {t.skills.length > 4 ? <Chip className="text-muted">+{t.skills.length - 4}</Chip> : null}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        <span className="flex items-center gap-1"><MapPin size={12} />{t.cities.slice(0, 2).join(", ") || "Anywhere"}</span>
        <span>{t.deliveryModes.map((m) => modeLabel[m]).join(" · ")}</span>
        <span>{t.yearsExperience} yrs</span>
        {t.avg ? <span className="text-amber">★ {t.avg.toFixed(1)}</span> : null}
      </div>
      <div className="mono mt-3 text-xs text-cyan">{showRate ? rateRange(t.dayRateMin, t.dayRateMax, t.currency) : "Sign in as a company to see rates"}</div>
    </Link>
  );
}

export function RequirementCard({ r }: {
  r: Requirement & { company: Pick<Company, "name" | "slug" | "type" | "logoUrl" | "domainVerifiedAt">; skills: Skill[]; _count: { applications: number; comments: number } };
}) {
  return (
    <Link href={`/requirements/${r.id}`} className="group block rounded-2xl border border-line bg-surface/70 p-5 transition hover:-translate-y-0.5 hover:border-violet/50 hover:shadow-[0_8px_40px_rgba(139,92,246,0.1)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <Building2 size={12} />{r.company.name}
            {r.company.domainVerifiedAt ? <BadgeCheck size={12} className="text-violet" /> : null}
            {r.company.type === "TRAINING_PARTNER" ? <Badge tone="violet">partner</Badge> : null}
            {r.visibility === "INVITE_ONLY" ? <Badge tone="amber">invite-only</Badge> : null}
          </p>
          <h3 className="mt-1 line-clamp-2 font-display text-[15px] font-semibold leading-snug group-hover:text-[#b79cff]">{r.title}</h3>
        </div>
        <Badge tone={reqTone[r.status]}>{reqStatusLabel[r.status]}</Badge>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">{r.skills.slice(0, 4).map((s) => <Chip key={s.id}>{s.name}</Chip>)}</div>
      <div className="mt-4 grid grid-cols-2 gap-y-1 text-xs text-muted sm:grid-cols-4">
        <span className="flex items-center gap-1"><CalendarDays size={12} />{dateRange(r.startDate, r.endDate)}</span>
        <span className="flex items-center gap-1"><MapPin size={12} />{r.mode === "VIRTUAL" ? "Virtual" : `${r.city} · ${modeLabel[r.mode as DeliveryMode]}`}</span>
        <span className="flex items-center gap-1"><Users size={12} />{r.participants} participants</span>
        <span className="mono text-cyan">{rateRange(r.budgetMin, r.budgetMax, r.currency)}</span>
      </div>
      <div className="mono mt-3 flex gap-4 text-[11px] uppercase tracking-wider text-dim">
        <span>{r._count.applications} applied</span><span>{r._count.comments} comments</span><span className="ml-auto">{timeAgo(r.createdAt)}</span>
      </div>
    </Link>
  );
}
