const heading = "font-[family-name:var(--font-heading)]";

interface Props {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export default function LegalPage({ title, lastUpdated, children }: Props) {
  return (
    <div className="min-h-[calc(100vh-4rem)]" style={{ background: "var(--surface)" }}>
      <section className="py-12 px-4 md:px-8" style={{ background: "var(--ink)" }}>
        <div className="max-w-3xl mx-auto">
          <h1 className={`${heading} font-extrabold text-2xl md:text-3xl text-white`}>{title}</h1>
          <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.4)" }}>Last updated: {lastUpdated}</p>
        </div>
      </section>
      <section className="py-10 px-4 md:px-8">
        <div className="max-w-3xl mx-auto rounded-2xl border bg-white p-6 md:p-10 legal-content" style={{ borderColor: "var(--border)" }}>
          {children}
        </div>
      </section>
    </div>
  );
}
