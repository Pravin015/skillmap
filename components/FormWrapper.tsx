"use client";
// Shared form-page wrapper. Cream blob hero + white card.
// All 7 form pages (/forms/*) inherit this layout.
import PageHero from "./page/PageHero";

interface FormWrapperProps {
  title: string;
  subtitle: string;
  eyebrow?: string;
  children: React.ReactNode;
  submitted: boolean;
  successMessage: string;
}

export default function FormWrapper({ title, subtitle, eyebrow = "Get in touch", children, submitted, successMessage }: FormWrapperProps) {
  return (
    <div className="min-h-[calc(100vh-4rem)]" style={{ background: "var(--surface)" }}>
      <PageHero eyebrow={eyebrow} title={title} subtitle={subtitle} />

      <section className="px-4 pb-20 -mt-6">
        <div className="max-w-3xl mx-auto">
          {submitted ? (
            <div className="card text-center" style={{ padding: "60px 24px" }}>
              <div className="text-5xl mb-4">✅</div>
              <h2 className="font-semibold text-xl mb-3" style={{ color: "var(--ink)" }}>Submitted successfully</h2>
              <p className="text-sm max-w-md mx-auto" style={{ color: "var(--muted)" }}>{successMessage}</p>
            </div>
          ) : (
            <div className="card" style={{ padding: "32px" }}>
              {children}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
