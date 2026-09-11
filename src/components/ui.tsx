import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn, initials } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "violet" | "outline";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold whitespace-nowrap transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none select-none";
const variants: Record<Variant, string> = {
  primary: "bg-cyan text-bg hover:bg-[#5ee2f5] shadow-[0_0_24px_rgba(34,211,238,0.28)] hover:shadow-[0_0_32px_rgba(34,211,238,0.45)]",
  violet: "bg-violet text-white hover:bg-[#9d74f8] shadow-[0_0_24px_rgba(139,92,246,0.3)]",
  secondary: "bg-surface-2 border border-line-2 text-ink hover:border-cyan/50 hover:bg-[#1b2237]",
  outline: "border border-line-2 text-ink hover:border-cyan/60 hover:text-cyan bg-transparent",
  ghost: "text-muted hover:text-ink hover:bg-white/5",
  danger: "bg-rose/10 text-rose border border-rose/30 hover:bg-rose/20",
};
const sizes: Record<Size, string> = { sm: "h-8 px-3 text-[13px]", md: "h-10 px-4 text-sm", lg: "h-12 px-6 text-[15px]" };

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra?: string) {
  return cn(base, variants[variant], sizes[size], extra);
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

const fieldBase =
  "w-full rounded-lg bg-bg-2 border border-line px-3.5 py-2.5 text-sm text-ink placeholder:text-dim transition focus:border-cyan/60 focus:outline-none focus:ring-2 focus:ring-cyan/15";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(fieldBase, className)} {...props} />;
}
export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(fieldBase, "min-h-28 leading-relaxed", className)} {...props} />;
}
export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select className={cn(fieldBase, "appearance-none pr-9 bg-no-repeat bg-[right_0.75rem_center]", className)}
      style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238c95ad' stroke-width='2'><path d='m6 9 6 6 6-6'/></svg>\")" }}
      {...props}>
      {children}
    </select>
  );
}

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-[12.5px] font-semibold uppercase tracking-[0.08em] text-muted">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-xs text-dim">{hint}</span> : null}
    </label>
  );
}

type Tone = "cyan" | "violet" | "amber" | "lime" | "rose" | "neutral";
const tones: Record<Tone, string> = {
  cyan: "bg-cyan/10 text-cyan border-cyan/25",
  violet: "bg-violet/10 text-[#b79cff] border-violet/30",
  amber: "bg-amber/10 text-amber border-amber/30",
  lime: "bg-lime/10 text-lime border-lime/30",
  rose: "bg-rose/10 text-rose border-rose/30",
  neutral: "bg-white/5 text-muted border-line-2",
};
export function Badge({ tone = "neutral", className, children, mono = true }: { tone?: Tone; className?: string; children: ReactNode; mono?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium", mono && "mono uppercase tracking-[0.06em]", tones[tone], className)}>
      {children}
    </span>
  );
}

export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full border border-line-2 bg-surface-2 px-2.5 py-0.5 text-xs text-ink/90", className)}>{children}</span>;
}

export function Card({ className, children, glow }: { className?: string; children: ReactNode; glow?: "cyan" | "violet" }) {
  return (
    <div className={cn("rounded-2xl border border-line bg-surface/80 backdrop-blur", glow === "cyan" && "ring-glow-cyan border-transparent", glow === "violet" && "ring-glow-violet border-transparent", className)}>
      {children}
    </div>
  );
}

export function Avatar({ name, src, size = 40, tone = "cyan", className }: { name: string; src?: string | null; size?: number; tone?: "cyan" | "violet" | "amber"; className?: string }) {
  const grad = tone === "cyan" ? "from-cyan/80 to-[#0e7490]" : tone === "violet" ? "from-violet to-[#4c1d95]" : "from-amber to-[#92400e]";
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={name} width={size} height={size} className={cn("rounded-full object-cover", className)} style={{ width: size, height: size }} />
  ) : (
    <span className={cn("inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-display font-semibold text-white", grad, className)} style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {initials(name)}
    </span>
  );
}

export function Empty({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line-2 px-6 py-12 text-center">
      <p className="font-display text-base font-semibold">{title}</p>
      {body ? <p className="mx-auto mt-1 max-w-md text-sm text-muted">{body}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function PageHeader({ eyebrow, title, body, actions }: { eyebrow?: string; title: string; body?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow ? <p className="mono mb-2 text-[11px] uppercase tracking-[0.14em] text-cyan">{eyebrow}</p> : null}
        <h1 className="text-3xl font-bold md:text-4xl">{title}</h1>
        {body ? <p className="mt-2 max-w-2xl text-muted">{body}</p> : null}
      </div>
      {actions ? <div className="flex gap-2">{actions}</div> : null}
    </div>
  );
}

export function Stat({ label, value, tone = "cyan" }: { label: string; value: string | number; tone?: "cyan" | "violet" | "amber" | "lime" }) {
  const c = { cyan: "text-cyan", violet: "text-[#b79cff]", amber: "text-amber", lime: "text-lime" }[tone];
  return (
    <div className="rounded-xl border border-line bg-surface/60 px-4 py-3">
      <p className="mono text-[11px] uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className={cn("mt-1 font-display text-2xl font-bold tabular-nums", c)}>{value}</p>
    </div>
  );
}

export function Alert({ tone = "rose", children }: { tone?: Tone; children: ReactNode }) {
  return <div className={cn("rounded-lg border px-3.5 py-2.5 text-sm", tones[tone])}>{children}</div>;
}
