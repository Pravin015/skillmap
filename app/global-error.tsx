"use client";
// Last-resort error boundary — catches errors that escape the root layout
// itself (rare). Must include its own <html> and <body>.

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body style={{ margin: 0, padding: 0, fontFamily: "Poppins, system-ui, sans-serif", background: "#FAF7F2", color: "#0F0E14" }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ maxWidth: 500, textAlign: "center" }}>
            <p style={{ fontSize: 64, margin: "0 0 12px" }}>⚠️</p>
            <h1 style={{ fontSize: 24, fontWeight: 600, margin: "0 0 8px" }}>Something went seriously wrong</h1>
            <p style={{ fontSize: 14, color: "#6B6776", margin: "0 0 20px" }}>
              The whole app failed to load. This is rare — please refresh, or try again in a few minutes.
            </p>
            {error.digest && (
              <p style={{ fontSize: 11, fontFamily: "monospace", color: "#9A95A6", margin: "0 0 20px" }}>
                Reference: {error.digest}
              </p>
            )}
            <button
              onClick={reset}
              style={{ background: "#7C3AED", color: "white", fontWeight: 500, fontSize: 14, padding: "10px 24px", borderRadius: 999, border: "none", cursor: "pointer" }}
            >
              Refresh app
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
