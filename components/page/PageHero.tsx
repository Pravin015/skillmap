// Shared page hero — eyebrow chip + heading + subhead + optional CTA.
// Use on every public/static page so they stay visually consistent.
import Link from "next/link";

interface Cta {
  label: string;
  href: string;
  variant?: "primary" | "outline" | "dark";
}

interface PageHeroProps {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: string;
  ctas?: Cta[];
}

export default function PageHero({ eyebrow, title, subtitle, ctas }: PageHeroProps) {
  return (
    <section className="blob-bg blob-bg-soft pt-12 pb-16 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="section-eyebrow mx-auto">{eyebrow}</div>
        <h1 className="font-semibold mb-5" style={{ color: "var(--ink)" }}>{title}</h1>
        {subtitle && (
          <p className="text-base max-w-2xl mx-auto" style={{ color: "var(--muted)" }}>
            {subtitle}
          </p>
        )}
        {ctas && ctas.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            {ctas.map((cta) => {
              const cls = cta.variant === "outline" ? "btn-outline" : cta.variant === "dark" ? "btn-dark" : "btn-primary";
              return (
                <Link key={cta.href} href={cta.href} className={cls}>
                  {cta.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
