"use client";

const heading = "font-[family-name:var(--font-heading)]";

interface FormWrapperProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  submitted: boolean;
  successMessage: string;
}

export default function FormWrapper({ title, subtitle, children, submitted, successMessage }: FormWrapperProps) {
  return (
    <div className="min-h-[calc(100vh-4rem)] py-12 px-4 md:px-8" style={{ background: "var(--surface)" }}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className={`${heading} font-bold text-2xl md:text-3xl`}>{title}</h1>
          <p className="text-sm mt-2" style={{ color: "var(--muted)" }}>{subtitle}</p>
        </div>

        {submitted ? (
          <div className="rounded-2xl border bg-white p-12 text-center" style={{ borderColor: "var(--border)" }}>
            <div className="text-5xl mb-4">✅</div>
            <h2 className={`${heading} font-bold text-xl mb-2`}>Submitted Successfully</h2>
            <p className="text-sm" style={{ color: "var(--muted)" }}>{successMessage}</p>
          </div>
        ) : (
          <div className="rounded-2xl border bg-white p-6 md:p-8" style={{ borderColor: "var(--border)" }}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
