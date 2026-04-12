/**
 * Convert array of objects to CSV string.
 * Handles commas, quotes, and newlines in values.
 */
export function toCSV(data: Record<string, unknown>[], columns?: { key: string; label: string }[]): string {
  if (data.length === 0) return "";

  const cols = columns || Object.keys(data[0]).map((k) => ({ key: k, label: k }));
  const header = cols.map((c) => escapeCSV(c.label)).join(",");

  const rows = data.map((row) =>
    cols.map((c) => escapeCSV(String(row[c.key] ?? ""))).join(",")
  );

  return [header, ...rows].join("\n");
}

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
