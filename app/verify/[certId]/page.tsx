"use client";
import { useState, useEffect, use } from "react";
const heading = "font-[family-name:var(--font-heading)]";

interface Cert { id: string; userName: string; courseTitle: string; certificateId: string; issuedAt: string }

export default function VerifyCertPage({ params }: { params: Promise<{ certId: string }> }) {
  const { certId } = use(params);
  const [cert, setCert] = useState<Cert | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/verify/${certId}`).then((r) => { if (!r.ok) { setNotFound(true); setLoading(false); return null; } return r.json(); }).then((d) => { if (d?.certificate) setCert(d.certificate); else setNotFound(true); setLoading(false); }).catch(() => { setNotFound(true); setLoading(false); });
  }, [certId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: "#0F0E14" }}><div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} /></div>;

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0F0E14" }}>
      <div className="text-center">
        <div className="text-5xl mb-4">❌</div>
        <h1 className={`${heading} text-xl font-bold text-white mb-2`}>Certificate Not Found</h1>
        <p style={{ color: "#6B6776" }}>The certificate ID <strong className="text-white">{certId}</strong> does not exist or is invalid.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0F0E14" }}>
      <div className="max-w-lg w-full">
        {/* Certificate Card */}
        <div className="card-dark text-center" style={{ padding: "3rem 2rem", borderTop: "3px solid var(--primary)" }}>
          <div className="text-4xl mb-3">🏆</div>
          <div className="section-eyebrow justify-center mb-4">VERIFIED CERTIFICATE</div>

          <h1 className={`${heading} text-xl font-bold text-white mb-1`}>{cert!.courseTitle}</h1>
          <p className="text-sm mb-6" style={{ color: "#6B6776" }}>Completed by</p>

          <div className={`${heading} text-2xl font-bold mb-1`} style={{ color: "var(--primary)" }}>{cert!.userName}</div>

          <div className="mt-6 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex justify-between text-xs" style={{ color: "#9A95A6" }}>
              <span>Certificate ID</span>
              <span className="font-mono text-white">{cert!.certificateId}</span>
            </div>
            <div className="flex justify-between text-xs mt-2" style={{ color: "#9A95A6" }}>
              <span>Issued On</span>
              <span className="text-white">{new Date(cert!.issuedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
            </div>
            <div className="flex justify-between text-xs mt-2" style={{ color: "#9A95A6" }}>
              <span>Platform</span>
              <span className="text-white">AstraaHire</span>
            </div>
          </div>

          <div className="mt-6 rounded-lg p-3" style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)" }}>
            <p className="text-xs font-medium" style={{ color: "#7C3AED" }}>✓ This certificate is authentic and verified by AstraaHire.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
