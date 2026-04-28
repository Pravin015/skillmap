// Section wrapper with optional eyebrow + title + subtitle.
interface SectionProps {
  eyebrow?: string;
  title?: React.ReactNode;
  subtitle?: string;
  align?: "left" | "center";
  children: React.ReactNode;
  className?: string;
}

export default function Section({ eyebrow, title, subtitle, align = "center", children, className = "" }: SectionProps) {
  const alignClass = align === "center" ? "text-center" : "";
  return (
    <section className={`px-4 py-16 md:py-20 ${className}`}>
      <div className="max-w-5xl mx-auto">
        {(eyebrow || title || subtitle) && (
          <div className={`mb-10 ${alignClass}`}>
            {eyebrow && <div className={`section-eyebrow ${align === "center" ? "mx-auto" : ""}`}>{eyebrow}</div>}
            {title && <h2 className="font-semibold mb-3" style={{ color: "var(--ink)" }}>{title}</h2>}
            {subtitle && (
              <p className={`text-sm md:text-base max-w-2xl ${align === "center" ? "mx-auto" : ""}`} style={{ color: "var(--muted)" }}>
                {subtitle}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
