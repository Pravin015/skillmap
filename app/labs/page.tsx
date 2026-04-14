"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
const heading = "font-[family-name:var(--font-heading)]";

interface Lab { id: string; title: string; domain: string; description: string | null; difficulty: string; timeLimit: number; passingScore: number; status: string; _count: { problems: number } }

export default function LabsPage() {
  const { data: session } = useSession();
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/labs?status=PUBLISHED").then((r) => r.json()).then((d) => { setLabs(d.labs || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const diffColors: Record<string, string> = { EASY: "#10b981", MEDIUM: "#F59E0B", HARD: "#ef4444" };

  return (
    <div className="min-h-screen" style={{ background: "var(--surface)" }}>
      <section style={{ background: "#0C1A1A", paddingTop: "7rem", paddingBottom: "4rem" }}>
        <div className="mx-auto max-w-4xl px-4 text-center">
          <div className="section-eyebrow justify-center">SKILL ASSESSMENTS</div>
          <h1 className={`${heading} text-2xl md:text-4xl font-bold text-white mb-3`}>Lab Assessments</h1>
          <p className="text-sm md:text-base max-w-xl mx-auto" style={{ color: "#6B8F8F" }}>Timed, proctored MCQ assessments. Prove your skills to employers with results they can trust.</p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} /></div>
        ) : labs.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">🧪</div>
            <p className={`${heading} font-bold text-base mb-1`} style={{ color: "var(--ink)" }}>No labs available yet</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>Check back soon for new assessments.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {labs.map((lab) => (
              <div key={lab.id} className="card-dark" style={{ padding: "1.75rem" }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: `${diffColors[lab.difficulty]}15`, color: diffColors[lab.difficulty] }}>{lab.difficulty}</span>
                  <span className="text-[10px]" style={{ color: "#4A6363" }}>{lab.domain}</span>
                </div>
                <h3 className={`${heading} text-base font-bold mb-1`} style={{ color: "#fff" }}>{lab.title}</h3>
                {lab.description && <p className="text-xs mb-3" style={{ color: "#6B8F8F" }}>{lab.description}</p>}
                <div className="flex items-center gap-4 text-xs mb-4" style={{ color: "#4A6363" }}>
                  <span>{lab._count.problems} questions</span>
                  <span>{lab.timeLimit} min</span>
                  <span>Pass: {lab.passingScore}%</span>
                </div>
                {session ? (
                  <Link href={`/labs/${lab.id}`} className="btn-primary no-underline block text-center text-sm" style={{ padding: "0.6rem 1.25rem" }}>Start Assessment</Link>
                ) : (
                  <Link href="/auth/login" className="btn-primary no-underline block text-center text-sm" style={{ padding: "0.6rem 1.25rem" }}>Login to Start</Link>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
