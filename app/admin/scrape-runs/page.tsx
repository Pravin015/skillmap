"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface JobSource {
  id: string;
  slug: string;
  displayName: string;
  baseUrl: string;
  enabled: boolean;
  vertical: "INTERNSHIP" | "FULLTIME";
  lastRunAt: string | null;
  lastStatus: string | null;
  minIntervalMin: number;
  defaultQuery: Record<string, unknown> | null;
}

interface ScrapeRun {
  id: string;
  sourceId: string;
  source: { slug: string; displayName: string };
  status: "RUNNING" | "SUCCESS" | "PARTIAL" | "FAILED";
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  itemsFound: number;
  itemsInserted: number;
  itemsUpdated: number;
  itemsSkipped: number;
  triggeredBy: string | null;
  errorMessage: string | null;
}

interface JobStat { sourceId: string; vertical: string; _count: { _all: number } }

const statusColor: Record<string, string> = {
  RUNNING: "bg-blue-500/20 text-blue-300",
  SUCCESS: "bg-green-500/20 text-green-300",
  PARTIAL: "bg-yellow-500/20 text-yellow-300",
  FAILED: "bg-red-500/20 text-red-300",
};

const heading = "font-[family-name:var(--font-heading)]";

export default function ScrapeRunsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sources, setSources] = useState<JobSource[]>([]);
  const [runs, setRuns] = useState<ScrapeRun[]>([]);
  const [jobStats, setJobStats] = useState<JobStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");

  const role = (session?.user as { role?: string } | undefined)?.role;

  useEffect(() => {
    if (status === "loading") return;
    if (!session || role !== "ADMIN") router.push("/");
  }, [session, status, role, router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/scrape-runs");
      const data = await res.json();
      setSources(data.sources || []);
      setRuns(data.runs || []);
      setJobStats(data.jobStats || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (role === "ADMIN") load(); }, [role, load]);

  const trigger = async (slug: string) => {
    setTriggering(slug);
    setMessage(`Running ${slug}...`);
    try {
      const res = await fetch("/api/admin/scrape-runs/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: slug, maxItems: 40 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "trigger failed");
      const s = data.summary;
      setMessage(`${slug}: ${s.status} — found ${s.itemsFound}, inserted ${s.itemsInserted}, updated ${s.itemsUpdated}, skipped ${s.itemsSkipped} in ${s.durationMs}ms`);
      await load();
    } catch (err) {
      setMessage(`${slug}: error — ${(err as Error).message}`);
    } finally {
      setTriggering(null);
    }
  };

  const toggle = async (id: string, enabled: boolean) => {
    await fetch(`/api/admin/scrape-runs/source/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    await load();
  };

  const jobCountFor = (sourceId: string) => jobStats.filter((s) => s.sourceId === sourceId).reduce((acc, s) => acc + s._count._all, 0);

  if (status === "loading" || (role === "ADMIN" && loading)) {
    return <div className="min-h-screen flex items-center justify-center text-white/60">Loading...</div>;
  }
  if (role !== "ADMIN") return null;

  return (
    <div className="min-h-screen bg-black text-white px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-baseline justify-between mb-8">
          <div>
            <h1 className={`${heading} text-3xl font-bold`}>Job Scraper</h1>
            <p className="text-white/60 text-sm mt-1">External job sources — scrape, monitor, tune.</p>
          </div>
          <button onClick={load} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm">Refresh</button>
        </div>

        {message && (
          <div className="mb-6 p-3 bg-white/5 border border-white/10 rounded-lg text-sm font-mono">{message}</div>
        )}

        <section className="mb-10">
          <h2 className={`${heading} text-lg font-semibold mb-3`}>Sources</h2>
          <div className="grid gap-3">
            {sources.length === 0 && (
              <div className="p-4 bg-white/5 border border-white/10 rounded-lg text-white/60 text-sm">
                No sources yet. Run <code className="bg-black/40 px-1.5 py-0.5 rounded">npm run scrape:seed</code> to register them.
              </div>
            )}
            {sources.map((s) => (
              <div key={s.id} className="p-4 bg-white/5 border border-white/10 rounded-lg">
                <div className="flex flex-wrap items-center gap-3 justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-mono ${s.vertical === "INTERNSHIP" ? "bg-purple-500/20 text-purple-300" : "bg-cyan-500/20 text-cyan-300"}`}>{s.vertical}</span>
                    <span className="font-semibold">{s.displayName}</span>
                    <span className="text-white/40 text-xs font-mono">{s.slug}</span>
                    {s.lastStatus && <span className={`px-2 py-0.5 rounded text-xs ${statusColor[s.lastStatus] ?? "bg-white/10"}`}>{s.lastStatus}</span>}
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-white/60">{jobCountFor(s.id)} active</span>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={s.enabled} onChange={(e) => toggle(s.id, e.target.checked)} />
                      <span className="text-xs">{s.enabled ? "enabled" : "disabled"}</span>
                    </label>
                    <button
                      onClick={() => trigger(s.slug)}
                      disabled={triggering !== null}
                      className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 rounded text-xs font-semibold"
                    >
                      {triggering === s.slug ? "Running..." : "Run now"}
                    </button>
                  </div>
                </div>
                <div className="text-xs text-white/40 mt-2">
                  {s.lastRunAt ? `Last run: ${new Date(s.lastRunAt).toLocaleString()}` : "Never run"}
                  {" · "}min interval: {s.minIntervalMin}m
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className={`${heading} text-lg font-semibold mb-3`}>Recent runs</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-white/10 rounded-lg overflow-hidden">
              <thead className="bg-white/5 text-white/60 text-left">
                <tr>
                  <th className="px-3 py-2">Source</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Found</th>
                  <th className="px-3 py-2">New</th>
                  <th className="px-3 py-2">Updated</th>
                  <th className="px-3 py-2">Skipped</th>
                  <th className="px-3 py-2">Duration</th>
                  <th className="px-3 py-2">When</th>
                  <th className="px-3 py-2">Trigger</th>
                </tr>
              </thead>
              <tbody>
                {runs.length === 0 && (
                  <tr><td colSpan={9} className="px-3 py-6 text-center text-white/40">No runs yet.</td></tr>
                )}
                {runs.map((r) => (
                  <tr key={r.id} className="border-t border-white/5">
                    <td className="px-3 py-2 font-mono text-xs">{r.source.displayName}</td>
                    <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded text-xs ${statusColor[r.status] ?? "bg-white/10"}`}>{r.status}</span></td>
                    <td className="px-3 py-2">{r.itemsFound}</td>
                    <td className="px-3 py-2 text-green-300">{r.itemsInserted}</td>
                    <td className="px-3 py-2 text-blue-300">{r.itemsUpdated}</td>
                    <td className="px-3 py-2 text-white/40">{r.itemsSkipped}</td>
                    <td className="px-3 py-2 text-white/60">{r.durationMs ? `${r.durationMs}ms` : "—"}</td>
                    <td className="px-3 py-2 text-white/40 text-xs">{new Date(r.startedAt).toLocaleString()}</td>
                    <td className="px-3 py-2 text-white/40 text-xs">{r.triggeredBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {runs.some((r) => r.errorMessage) && (
            <div className="mt-4 space-y-2">
              {runs.filter((r) => r.errorMessage).map((r) => (
                <div key={r.id} className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs font-mono text-red-300">
                  <span className="font-semibold">{r.source.displayName}:</span> {r.errorMessage}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
