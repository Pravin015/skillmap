import { configuredProviders, PROVIDER_LIST, providerName, type Provider } from "@/lib/oauth";
import { cn } from "@/lib/utils";

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.8 6C12.4 13.5 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 7.1-10 7.1-17.5z" />
      <path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.8-6C1 16.4 0 20.1 0 24s1 7.6 2.7 10.7l7.8-6z" />
      <path fill="#34A853" d="M24 48c6.2 0 11.6-2 15.4-5.6l-7.5-5.8c-2 1.4-4.7 2.3-7.9 2.3-6.3 0-11.6-4-13.5-9.7l-7.8 6C6.6 42.6 14.6 48 24 48z" />
    </svg>
  );
}
function LinkedInMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <rect width="24" height="24" rx="3" fill="#0A66C2" />
      <path fill="#fff" d="M7.1 9.6h2.4V17H7.1V9.6zm1.2-3.9a1.4 1.4 0 1 1 0 2.8 1.4 1.4 0 0 1 0-2.8zM11 9.6h2.3v1c.3-.6 1.1-1.2 2.4-1.2 2.5 0 3 1.6 3 3.8V17h-2.4v-3.4c0-.8 0-1.9-1.2-1.9s-1.3.9-1.3 1.8V17H11V9.6z" />
    </svg>
  );
}
function MicrosoftMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="1" y="1" width="10" height="10" fill="#F25022" /><rect x="13" y="1" width="10" height="10" fill="#7FBA00" /><rect x="1" y="13" width="10" height="10" fill="#00A4EF" /><rect x="13" y="13" width="10" height="10" fill="#FFB900" />
    </svg>
  );
}
const marks: Record<Provider, () => React.JSX.Element> = { google: GoogleMark, linkedin: LinkedInMark, microsoft: MicrosoftMark };

/** "Continue with Google / LinkedIn" buttons. Providers without keys in .env render disabled with a hint. */
export function OAuthButtons({ as, next, label = "Continue with", divider = true }: { as?: "trainer" | "company"; next?: string; label?: string; divider?: boolean }) {
  const live = new Set(configuredProviders());
  const q = new URLSearchParams();
  if (as) q.set("as", as);
  if (next) q.set("next", next);
  const qs = q.toString() ? `?${q}` : "";
  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-3">
        {PROVIDER_LIST.map((p) => {
          const Mark = marks[p];
          const cls = cn("inline-flex h-11 items-center justify-center gap-2.5 rounded-lg border bg-white font-display text-sm font-semibold transition", live.has(p) ? "border-line-2 text-ink hover:bg-surface-2 hover:border-dim shadow-sm" : "cursor-not-allowed border-line text-dim");
          return live.has(p) ? (
            <a key={p} href={`/api/auth/${p}/start${qs}`} className={cls}><Mark /> {label} {providerName(p)}</a>
          ) : (
            <span key={p} className={cls} title={`Add ${p === "microsoft" ? "MS" : p.toUpperCase()}_CLIENT_ID and ${p === "microsoft" ? "MS" : p.toUpperCase()}_CLIENT_SECRET to .env to enable`} aria-disabled="true"><span className="opacity-50"><Mark /></span> {label} {providerName(p)}</span>
          );
        })}
      </div>
      {live.size < PROVIDER_LIST.length ? (
        <p className="text-center text-xs text-dim">{live.size === 0 ? "Google, LinkedIn and Microsoft sign-in activate once their app keys are added to .env." : "Greyed providers activate once their app keys are added to .env."}</p>
      ) : null}
      {divider ? <div className="flex items-center gap-3 py-1 text-xs text-dim"><span className="hairline flex-1" />or with email<span className="hairline flex-1" /></div> : null}
    </div>
  );
}
