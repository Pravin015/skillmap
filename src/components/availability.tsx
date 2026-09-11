import type { AvailabilityBlock } from "@prisma/client";
import { cn, dateRange } from "@/lib/utils";

const kindLabel = { BOOKED: "Booked", UNAVAILABLE: "Unavailable", TENTATIVE: "Tentative" } as const;
const kindClass = { BOOKED: "bg-navy", UNAVAILABLE: "bg-dim", TENTATIVE: "bg-amber" } as const;

/** Twelve-week strip: one cell per day, shaded by block kind. Pure server markup, no JS. */
export function AvailabilityStrip({ blocks, weeks = 12, from = new Date() }: { blocks: Pick<AvailabilityBlock, "startDate" | "endDate" | "kind">[]; weeks?: number; from?: Date }) {
  const start = new Date(from); start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); // Monday
  const days: { d: Date; kind: keyof typeof kindLabel | null }[] = [];
  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(start.getTime() + i * 86400000);
    const hit = blocks.find((b) => d >= new Date(new Date(b.startDate).setHours(0, 0, 0, 0)) && d <= new Date(new Date(b.endDate).setHours(23, 59, 59, 999)));
    days.push({ d, kind: hit?.kind ?? null });
  }
  const months = Array.from(new Set(days.map((x) => x.d.toLocaleString("en-IN", { month: "short" }))));
  return (
    <div>
      <div className="mono mb-1 flex justify-between text-[10px] uppercase tracking-wider text-dim">{months.map((m) => <span key={m}>{m}</span>)}</div>
      <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))` }}>
        {Array.from({ length: weeks }).map((_, w) => (
          <div key={w} className="grid grid-rows-7 gap-[3px]">
            {days.slice(w * 7, w * 7 + 7).map((x) => {
              const past = x.d < new Date(new Date().setHours(0, 0, 0, 0));
              return <span key={x.d.toISOString()} title={`${x.d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}${x.kind ? ` · ${kindLabel[x.kind]}` : " · Available"}`} className={cn("aspect-square rounded-[2px]", x.kind ? kindClass[x.kind] : "bg-lime/25", past && "opacity-30")} />;
            })}
          </div>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted">
        <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-[2px] bg-lime/25" />Available</span>
        <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-[2px] bg-navy" />Booked</span>
        <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-[2px] bg-amber" />Tentative</span>
        <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-[2px] bg-dim" />Unavailable</span>
      </div>
    </div>
  );
}

export function BlockList({ blocks, action }: { blocks: (AvailabilityBlock & { requirement?: { title: string } | null })[]; action?: (b: AvailabilityBlock) => React.ReactNode }) {
  if (!blocks.length) return <p className="text-sm text-muted">No blocked dates. You appear available for the whole period.</p>;
  return (
    <ul className="divide-y divide-line rounded-xl border border-line">
      {blocks.map((b) => (
        <li key={b.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-sm">
          <span className={cn("h-2.5 w-2.5 rounded-full", kindClass[b.kind])} />
          <span className="font-medium">{dateRange(b.startDate, b.endDate)}</span>
          <span className="text-muted">{kindLabel[b.kind]}{b.requirement ? ` · ${b.requirement.title}` : b.note ? ` · ${b.note}` : ""}</span>
          {action ? <span className="ml-auto">{action(b)}</span> : null}
        </li>
      ))}
    </ul>
  );
}

/** Blocks overlapping a date range, used to warn before applying. */
export function overlapping<T extends Pick<AvailabilityBlock, "startDate" | "endDate">>(blocks: T[], start: Date, end: Date) {
  return blocks.filter((b) => new Date(b.startDate) <= end && new Date(b.endDate) >= start);
}
