"use client";
// Per-route error boundary — catches client-side render errors.
import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // In prod we'd ship this to Sentry; for now, console.error so it's visible in Railway logs.
    console.error("Route error:", error);
  }, [error]);

  return (
    <div className="blob-bg blob-bg-soft min-h-[70vh] flex items-center justify-center px-4" style={{ background: "var(--surface)" }}>
      <div className="text-center max-w-lg">
        <p className="text-6xl md:text-7xl mb-4">⚠️</p>
        <h1 className="text-2xl md:text-3xl font-semibold mb-3" style={{ color: "var(--ink)" }}>
          Something went wrong
        </h1>
        <p className="text-sm md:text-base mb-2" style={{ color: "var(--muted)" }}>
          We hit an unexpected error rendering this page. The team has been notified.
        </p>
        {error.digest && (
          <p className="text-[11px] font-mono mb-6" style={{ color: "var(--muted-2)" }}>
            Reference: {error.digest}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          <button onClick={reset} className="btn-primary">Try again</button>
          <Link href="/" className="btn-outline">Go home</Link>
        </div>
      </div>
    </div>
  );
}
