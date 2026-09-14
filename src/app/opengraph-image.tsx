import { ImageResponse } from "next/og";

export const alt = "CorpGurus · Hire verified freelance corporate trainers in India";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default social card for pages without their own image. */
export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 64, background: "linear-gradient(135deg, #f7f6fb 0%, #ede9fe 60%, #ddd6fe 100%)", fontFamily: "sans-serif", color: "#15111f" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "#6d28d9", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700 }}>CG</div>
          <div style={{ display: "flex", fontSize: 36, fontWeight: 700 }}>Corp<span style={{ color: "#6d28d9" }}>Gurus</span></div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2, maxWidth: 1000 }}>Hire verified freelance corporate trainers in India.</div>
          <div style={{ fontSize: 28, color: "#5d5872", maxWidth: 960 }}>Post a requirement with dates, mode and budget. Verified trainers apply with day rates. Signed work orders, escrow and certificates included.</div>
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          {["Cloud & DevOps", "Cybersecurity", "Networking", "Data & AI", "Leadership", "Compliance"].map((s) => (
            <div key={s} style={{ padding: "10px 18px", borderRadius: 999, background: "#fff", border: "1px solid #cfc8df", fontSize: 22, color: "#4c1d95" }}>{s}</div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
