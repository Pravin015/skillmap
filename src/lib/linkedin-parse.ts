/**
 * Heuristic parser for LinkedIn "Save to PDF" exports (text extracted by pdf-parse).
 * Layout: a sidebar (Contact, Top Skills, Languages, Certifications, Honors) is printed first, then the name,
 * headline and location, then Summary, Experience and Education. Everything is best-effort and the trainer
 * reviews each field before it is applied.
 */

export type ParsedExperience = { title: string; organisation: string; start?: string; end?: string; current: boolean; description: string };
export type ParsedProfile = {
  name?: string; headline?: string; location?: string; summary?: string;
  skills: string[]; languages: string[]; certifications: { name: string; issuer?: string }[];
  experiences: ParsedExperience[]; yearsExperience?: number; raw: string;
};

const HEADINGS = ["Contact", "Top Skills", "Skills", "Languages", "Certifications", "Licenses & Certifications", "Honors-Awards", "Honors & Awards", "Publications", "Summary", "About", "Experience", "Education", "Patents", "Courses", "Projects"];
const BODY_START = ["Summary", "About", "Experience"];
const MONTHS = "January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec";
const DATE_RANGE = new RegExp(`^((?:${MONTHS})\\s+\\d{4}|\\d{4})\\s*[-–]\\s*((?:${MONTHS})\\s+\\d{4}|\\d{4}|Present)\\s*(?:\\(([^)]*)\\))?$`, "i");
const NAME = /^[A-Z][A-Za-z.'-]+(\s+[A-Z][A-Za-z.'-]+){1,3}$/;

const isHeading = (l: string) => HEADINGS.find((x) => x.toLowerCase() === l.toLowerCase());
const monthIndex = (m: string) => ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].indexOf(m.slice(0, 3).toLowerCase());

export function toIsoMonth(s?: string) {
  if (!s) return undefined;
  const m = s.match(new RegExp(`^(${MONTHS})\\s+(\\d{4})$`, "i"));
  if (m) return `${m[2]}-${String(monthIndex(m[1]) + 1).padStart(2, "0")}-01`;
  const y = s.match(/^(\d{4})$/);
  return y ? `${y[1]}-01-01` : undefined;
}

function clean(lines: string[]) {
  return lines.map((l) => l.replace(/\s+/g, " ").trim()).filter((l) => l && !/^Page \d+ of \d+$/i.test(l));
}

/** Name / headline / location sit immediately before the first body heading. Pull them out so they don't pollute the sidebar sections. */
function extractIdentity(lines: string[]) {
  const bodyIdx = lines.findIndex((l) => BODY_START.includes(isHeading(l) ?? ""));
  if (bodyIdx < 1) return { lines, name: undefined, headline: undefined, location: undefined };
  // The block is [name, headline, location?] right before the body. Try name at -3 (with location) then -2 (without).
  const start = [bodyIdx - 3, bodyIdx - 2].find((i) => i >= 0 && NAME.test(lines[i]) && !isHeading(lines[i]));
  if (start === undefined) return { lines, name: undefined, headline: undefined, location: undefined };
  const block = lines.slice(start, bodyIdx);
  const name = block[0];
  const location = block.length === 3 && /,/.test(block[2]) ? block[2] : undefined;
  const headline = block[1];
  return { lines: [...lines.slice(0, start), ...lines.slice(bodyIdx)], name, headline, location };
}

function sections(lines: string[]) {
  const out = new Map<string, string[]>();
  let current = "_top";
  out.set(current, []);
  for (const l of lines) {
    const h = isHeading(l);
    if (h) { current = h; if (!out.has(current)) out.set(current, []); continue; }
    out.get(current)!.push(l);
  }
  return out;
}

/** Each role: [organisation, title, date range, (location), description...]. Some exports print title then organisation; we keep the order LinkedIn uses most. */
function parseExperience(lines: string[]): ParsedExperience[] {
  const dateIdx = lines.map((l, i) => (DATE_RANGE.test(l) ? i : -1)).filter((i) => i >= 0);
  const out: ParsedExperience[] = [];
  let prevEnd = 0; // first line that belongs to the current role's header
  for (let k = 0; k < dateIdx.length; k++) {
    const d = dateIdx[k];
    const headStart = Math.max(prevEnd, d - 2);
    const head = lines.slice(headStart, d);
    const m = lines[d].match(DATE_RANGE)!;
    const nextD = dateIdx[k + 1];
    const bodyEnd = nextD !== undefined ? Math.max(d + 1, nextD - 2) : lines.length;
    const body = lines.slice(d + 1, bodyEnd);
    if (body[0] && body[0].length < 60 && !/[.!?]$/.test(body[0]) && (/,/.test(body[0]) || body[0].split(" ").length <= 3)) body.shift();
    const organisation = head.length === 2 ? head[0] : (head[0] ?? "");
    const title = head.length === 2 ? head[1] : (head[0] ?? "");
    if (organisation || title) out.push({ organisation, title, start: toIsoMonth(m[1]), end: /present/i.test(m[2]) ? undefined : toIsoMonth(m[2]), current: /present/i.test(m[2]), description: body.join(" ").slice(0, 600) });
    prevEnd = bodyEnd;
  }
  return out;
}

export function parseLinkedInText(text: string): ParsedProfile {
  const cleaned = clean(text.split(/\r?\n/));
  const { lines, name, headline, location } = extractIdentity(cleaned);
  const sec = sections(lines);
  const skills = (sec.get("Top Skills") ?? sec.get("Skills") ?? []).filter((l) => l.length < 60);
  const languages = (sec.get("Languages") ?? []).map((l) => l.replace(/\s*\((Native|Professional|Elementary|Limited|Full)[^)]*\)\s*$/i, "")).filter((l) => l.length < 40);
  const certifications = (sec.get("Certifications") ?? sec.get("Licenses & Certifications") ?? []).filter((l) => l.length < 120).map((l) => ({ name: l }));
  const summary = (sec.get("Summary") ?? sec.get("About") ?? []).join(" ").trim();
  const experiences = parseExperience(sec.get("Experience") ?? []);
  const years = experiences.map((e) => e.start).filter((s): s is string => !!s).map((s) => Number(s.slice(0, 4)));
  const yearsExperience = years.length ? Math.max(0, new Date().getFullYear() - Math.min(...years)) : undefined;
  return { name, headline, location, summary: summary || undefined, skills, languages, certifications, experiences, yearsExperience, raw: text.slice(0, 20000) };
}
