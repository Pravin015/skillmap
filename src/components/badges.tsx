import type { Badge as BadgeT } from "@/lib/badges";
import { BadgeCheck, ShieldCheck, Star, Heart, Award, Sparkles, Building2, Receipt, Handshake, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

const icons: Record<string, React.ReactNode> = {
  identity: <ShieldCheck size={13} />, certified: <BadgeCheck size={13} />, top: <Star size={13} />, learners: <Heart size={13} />, experienced: <Award size={13} />, pro: <Sparkles size={13} />,
  domain: <Building2 size={13} />, gst: <Receipt size={13} />, trusted: <Handshake size={13} />, active: <Layers size={13} />, partner: <Sparkles size={13} />, growth: <Sparkles size={13} />,
};
const tones = {
  cyan: "bg-cyan/8 text-cyan border-cyan/25", violet: "bg-violet/8 text-violet border-violet/25", lime: "bg-lime/10 text-lime border-lime/30", amber: "bg-amber/10 text-amber border-amber/30", neutral: "bg-surface-2 text-muted border-line-2",
};

/** Row of earned badges with hover explanations. */
export function BadgeRow({ badges, className, size = "sm" }: { badges: BadgeT[]; className?: string; size?: "sm" | "md" }) {
  if (!badges.length) return null;
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {badges.map((b) => (
        <span key={b.key} title={b.description} className={cn("inline-flex items-center gap-1 rounded-md border font-display font-semibold", size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs", tones[b.tone])}>
          {icons[b.key]}{b.label}
        </span>
      ))}
    </div>
  );
}

/** Full explanation list, for the Overview tab. */
export function BadgeList({ badges }: { badges: BadgeT[] }) {
  if (!badges.length) return <p className="text-sm text-muted">No badges yet. Verified certifications, completed engagements and high ratings earn them automatically.</p>;
  return (
    <ul className="divide-y divide-line rounded-xl border border-line bg-white">
      {badges.map((b) => (
        <li key={b.key} className="flex items-start gap-3 px-4 py-3">
          <span className={cn("mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border", tones[b.tone])}>{icons[b.key]}</span>
          <div><p className="text-sm font-semibold">{b.label}</p><p className="text-xs text-muted">{b.description}</p></div>
        </li>
      ))}
    </ul>
  );
}
