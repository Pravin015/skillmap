// 404 page — rendered for every unknown route under app/.
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="blob-bg blob-bg-soft min-h-[80vh] flex items-center justify-center px-4" style={{ background: "var(--surface)" }}>
      <div className="text-center max-w-lg">
        <p className="text-7xl md:text-8xl font-semibold mb-4" style={{ color: "var(--primary)" }}>404</p>
        <h1 className="text-2xl md:text-3xl font-semibold mb-3" style={{ color: "var(--ink)" }}>
          We couldn&apos;t find that page
        </h1>
        <p className="text-sm md:text-base mb-8" style={{ color: "var(--muted)" }}>
          The link might be broken, or the page may have moved. Try one of these instead:
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/" className="btn-primary">Go home</Link>
          <Link href="/jobs" className="btn-outline">Browse jobs</Link>
          <Link href="/contact" className="btn-outline">Contact support</Link>
        </div>
      </div>
    </div>
  );
}
