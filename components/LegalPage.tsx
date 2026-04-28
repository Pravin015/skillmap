import PageHero from "./page/PageHero";

interface Props {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export default function LegalPage({ title, lastUpdated, children }: Props) {
  return (
    <div className="min-h-[calc(100vh-4rem)]" style={{ background: "var(--surface)" }}>
      <PageHero
        eyebrow="Legal"
        title={title}
        subtitle={`Last updated: ${lastUpdated}`}
      />
      <section className="px-4 pb-20">
        <div className="max-w-3xl mx-auto rounded-3xl border bg-white p-6 md:p-10 legal-content shadow-sm" style={{ borderColor: "var(--border)" }}>
          {children}
        </div>
      </section>
    </div>
  );
}
