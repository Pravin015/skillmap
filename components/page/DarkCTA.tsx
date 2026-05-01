// Dark CTA card used at the bottom of every static page.
import Link from "next/link";

interface DarkCTAProps {
  eyebrow?: string;
  title: React.ReactNode;
  body?: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}

export default function DarkCTA({ eyebrow = "Get started", title, body, primaryCta, secondaryCta }: DarkCTAProps) {
  return (
    <section className="px-4 pb-20">
      <div className="card-dark max-w-5xl mx-auto text-center" style={{ padding: "60px 24px" }}>
        <div className="section-eyebrow mx-auto" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}>
          {eyebrow}
        </div>
        <h2 className="font-semibold mb-4" style={{ color: "white" }}>{title}</h2>
        {body && (
          <p className="text-sm max-w-md mx-auto mb-8" style={{ color: "rgba(255,255,255,0.6)" }}>{body}</p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href={primaryCta.href} className="btn-primary">{primaryCta.label}</Link>
          {secondaryCta && (
            <Link href={secondaryCta.href} className="btn-outline" style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.15)", color: "white" }}>
              {secondaryCta.label}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
