export const VAR_RE = /\{\{\s*([\w.-]+)\s*\}\}/g;
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-3);
export const nowIso = () => new Date().toISOString();

export function extractVariables(text: string): string[] {
  return [...new Set([...text.matchAll(VAR_RE)].map(m => m[1]))];
}
export function resolveVariables(text: string, values: Record<string, string>): string {
  return text.replace(VAR_RE, (_m, key: string) => values[key] ?? "");
}
export function missingVariables(text: string, values: Record<string, string>): string[] {
  return extractVariables(text).filter(k => !values[k]?.trim());
}
export const wordCount = (t: string) => (t.trim() ? t.trim().split(/\s+/).length : 0);

export function relativeTime(iso: string, now = Date.now()): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "Unknown";
  const s = Math.round((now - t) / 1000);
  if (s < 45) return "Just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.round(h / 24);
  if (d === 1) return "Yesterday";
  if (d < 14) return `${d} days ago`;
  return new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric", year: d > 300 ? "numeric" : undefined });
}
export const fullDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
};
export const formatDuration = (ms: number) => (ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(ms < 10000 ? 2 : 1)} s`);
export const formatTokens = (n?: number) => (n === undefined ? "–" : n.toLocaleString());

/** Line-level diff summary using a bounded LCS. Good enough to describe changes between prompt versions. */
export function lineDiff(oldText: string, newText: string): { added: number; removed: number } {
  const a = oldText.split("\n"), b = newText.split("\n");
  if (a.length * b.length > 250000) return { added: Math.max(0, b.length - a.length), removed: Math.max(0, a.length - b.length) };
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) {
    dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  }
  const common = dp[0][0];
  return { added: b.length - common, removed: a.length - common };
}

export const CATEGORIES = ["General", "Writing", "Programming", "Research", "Education", "Marketing", "Business", "Productivity", "Data Analysis"];
export const initials = (name: string) => (name.trim()[0] || "P").toUpperCase();
