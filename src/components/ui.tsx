import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn, initials } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "violet" | "outline" | "dark";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none select-none font-display";
const variants: Record<Variant, string> = {
  primary: "bg-cyan text-white hover:bg-violet shadow-[0_6px_20px_rgba(109,40,217,0.25)]",
  violet: "bg-violet text-white hover:bg-plum shadow-sm",
  dark: "bg-navy text-white hover:bg-cyan shadow-sm",
  secondary: "bg-white border border-line-2 text-ink hover:bg-surface-2 hover:border-dim shadow-sm",
  outline: "border border-cyan text-cyan hover:bg-cyan/5 bg-transparent",
  ghost: "text-muted hover:text-ink hover:bg-surface-2",
  danger: "bg-white text-rose border border-rose/40 hover:bg-rose/5",
};
const sizes: Record<Size, string> = { sm: "h-8 px-3.5 text-[13px]", md: "h-10 px-5 text-sm", lg: "h-12 px-7 text-[15px]" };

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra?: string) {
  return cn(base, variants[variant], sizes[size], extra);
}

export function Button({ variant = "primary", size = "md", className, ...props }: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({ variant = "primary", size = "md", className, ...props }: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

const fieldBase =
  "w-full rounded-xl bg-white border border-line-2 px-3.5 py-2.5 text-sm text-ink placeholder:text-dim transition focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/15 disabled:bg-surface-2 disabled:text-dim";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(fieldBase, className)} {...props} />;
}
export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(fieldBase, "min-h-28 leading-relaxed", className)} {...props} />;
}
export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select className={cn(fieldBase, "appearance-none pr-9 bg-no-repeat bg-[right_0.75rem_center]", className)}
      style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2356637a' stroke-width='2'><path d='m6 9 6 6 6-6'/></svg>\")" }}
      {...props}>
      {children}
    </select>
  );
}

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block font-display text-[13px] font-semibold text-ink">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

type Tone = "cyan" | "violet" | "amber" | "lime" | "rose" | "neutral";
const tones: Record<Tone, string> = {
  cyan: "bg-cyan/8 text-cyan border-cyan/20",
  violet: "bg-violet/8 text-violet border-violet/20",
  amber: "bg-amber/10 text-[#7a4b06] border-amber/25",
  lime: "bg-lime/10 text-lime border-lime/25",
  rose: "bg-rose/8 text-rose border-rose/25",
  neutral: "bg-surface-2 text-muted border-line-2",
};
export function Badge({ tone = "neutral", className, children, mono = true }: { tone?: Tone; className?: string; children: ReactNode; mono?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", mono && "font-display uppercase tracking-[0.04em]", tones[tone], className)}>
      {children}
    </span>
  );
}

export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full border border-line-2 bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-ink/90", className)}>{children}</span>;
}

export function Card({ className, children, glow }: { className?: string; children: ReactNode; glow?: "cyan" | "violet" }) {
  return (
    <div className={cn("rounded-2xl border border-line bg-white shadow-[0_2px_12px_rgba(46,16,101,0.05)]", glow === "cyan" && "border-t-4 border-t-cyan", glow === "violet" && "border-t-4 border-t-violet", className)}>
      {children}
    </div>
  );
}

export function Avatar({ name, src, size = 40, tone = "cyan", className }: { name: string; src?: string | null; size?: number; tone?: "cyan" | "violet" | "amber"; className?: string }) {
  const bg = tone === "cyan" ? "bg-cyan" : tone === "violet" ? "bg-violet" : "bg-amber";
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={name} width={size} height={size} loading="lazy" decoding="async" className={cn("rounded-full object-cover", className)} style={{ width: size, height: size }} />
  ) : (
    <span className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-display font-semibold text-white", bg, className)} style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {initials(name)}
    </span>
  );
}

export function Empty({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line-2 bg-white px-6 py-12 text-center">
      <p className="font-display text-base font-semibold">{title}</p>
      {body ? <p className="mx-auto mt-1 max-w-md text-sm text-muted">{body}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function PageHeader({ eyebrow, title, body, actions }: { eyebrow?: ReactNode; title: string; body?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
      <div>
        {eyebrow ? <p className="mono mb-1.5 text-[12px] uppercase tracking-[0.08em] text-cyan">{eyebrow}</p> : null}
        <h1 className="text-[28px] font-bold leading-tight md:text-[34px]">{title}</h1>
        {body ? <p className="mt-2 max-w-2xl text-muted">{body}</p> : null}
      </div>
      {actions ? <div className="flex gap-2">{actions}</div> : null}
    </div>
  );
}

export function Stat({ label, value, tone = "cyan" }: { label: string; value: string | number; tone?: "cyan" | "violet" | "amber" | "lime" }) {
  const c = { cyan: "text-cyan", violet: "text-violet", amber: "text-amber", lime: "text-lime" }[tone];
  return (
    <div className="rounded-2xl border border-line bg-white px-4 py-3 shadow-[0_2px_12px_rgba(46,16,101,0.05)]">
      <p className="mono text-[11px] uppercase tracking-[0.08em] text-muted">{label}</p>
      <p className={cn("mt-1 font-display text-2xl font-bold tabular-nums", c)}>{value}</p>
    </div>
  );
}

export function Alert({ tone = "rose", children }: { tone?: Tone; children: ReactNode }) {
  return <div className={cn("rounded-xl border px-3.5 py-2.5 text-sm", tones[tone])}>{children}</div>;
}
