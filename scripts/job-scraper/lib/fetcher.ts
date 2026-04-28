// Thin wrapper around fetch with UA rotation, retry, and timeout.
// We identify as a real browser; sources that want us blocked will still block us, but
// rotating UAs reduces noise on public pages.

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
];

const pickUA = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

export interface FetchOpts {
  headers?: Record<string, string>;
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
}

export async function fetchText(url: string, opts: FetchOpts = {}): Promise<string> {
  const { headers = {}, timeoutMs = 15000, retries = 2, retryDelayMs = 1500 } = opts;

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": pickUA(),
          "Accept-Language": "en-IN,en;q=0.9",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          ...headers,
        },
        signal: ctrl.signal,
      });
      clearTimeout(t);
      if (!res.ok) {
        // 429/503 → retry; other 4xx → bail (bad request, not worth retrying)
        if (res.status >= 500 || res.status === 429) {
          lastError = new Error(`HTTP ${res.status} ${res.statusText}`);
        } else {
          throw new Error(`HTTP ${res.status} ${res.statusText}`);
        }
      } else {
        return await res.text();
      }
    } catch (err) {
      clearTimeout(t);
      lastError = err;
    }
    if (attempt < retries) {
      await new Promise((r) => setTimeout(r, retryDelayMs * (attempt + 1)));
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export async function fetchJson<T = unknown>(url: string, opts: FetchOpts = {}): Promise<T> {
  const text = await fetchText(url, {
    ...opts,
    headers: { Accept: "application/json", ...(opts.headers ?? {}) },
  });
  return JSON.parse(text) as T;
}

// Sleep helper for per-source polite delays.
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
