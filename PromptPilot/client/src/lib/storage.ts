import type { Prompt, RunRecord, Snapshot } from "../types";
import { nowIso, uid } from "./format";

export const KEYS = {
  prompts: "pp-prompts", snapshots: "pp-snapshots", runs: "pp-runs", workspace: "pp-workspace-name",
  playDraft: "pp-draft-play", compareDraft: "pp-draft-compare"
} as const;
export const RUN_LIMIT = 100;
const DAY = 86_400_000;

export function load<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) as T : fallback; } catch { return fallback; }
}
export function save(key: string, value: unknown): boolean {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}
export const hasKey = (key: string) => { try { return localStorage.getItem(key) !== null; } catch { return false; } };

const isObj = (x: unknown): x is Record<string, any> => typeof x === "object" && x !== null;
const str = (x: unknown, d = "") => (typeof x === "string" ? x : d);

function legacyUpdated(s: unknown, now: number): string {
  if (typeof s !== "string") return new Date(now).toISOString();
  const t = s.toLowerCase();
  if (t.includes("just now")) return new Date(now).toISOString();
  if (t === "yesterday") return new Date(now - DAY).toISOString();
  const m = t.match(/(\d+)\s*day/);
  if (m) return new Date(now - Number(m[1]) * DAY).toISOString();
  const p = Date.parse(s);
  return new Date(Number.isNaN(p) ? now : p).toISOString();
}
const validIso = (x: unknown): string | null => (typeof x === "string" && !Number.isNaN(Date.parse(x)) ? new Date(x).toISOString() : null);

/** Accepts 3.0 and 4.0 prompt shapes. 3.0 stored "updated" as free text, so timestamps are reconstructed. */
export function normalizePrompt(raw: unknown, now = Date.now()): Prompt | null {
  if (!isObj(raw) || typeof raw.title !== "string" || typeof raw.body !== "string") return null;
  const updatedAt = validIso(raw.updatedAt) ?? legacyUpdated(raw.updated, now);
  const category = str(raw.category, "General");
  return {
    id: str(raw.id) || uid(), title: raw.title, category: category === "Development" ? "Programming" : category,
    // The 3.0 seed data stored a literal backslash-n instead of a newline.
    body: ["p2", "p4"].includes(str(raw.id)) ? raw.body.replace(/\\n/g, "\n") : raw.body,
    tags: Array.isArray(raw.tags) ? raw.tags.filter((t: unknown) => typeof t === "string") : [],
    favorite: Boolean(raw.favorite), createdAt: validIso(raw.createdAt) ?? updatedAt, updatedAt
  };
}
export function normalizeSnapshot(raw: unknown, index = 0, now = Date.now()): Snapshot | null {
  if (!isObj(raw) || typeof raw.body !== "string") return null;
  const created = validIso(raw.createdAt) ?? validIso(raw.created) ?? new Date(now - index * 60_000).toISOString();
  return { id: str(raw.id) || uid(), promptId: str(raw.promptId), title: str(raw.title, "Untitled prompt"), body: raw.body, category: str(raw.category, "General"), createdAt: created };
}
export function normalizeRun(raw: unknown, index = 0, now = Date.now()): RunRecord | null {
  if (!isObj(raw) || typeof raw.prompt !== "string" || typeof raw.output !== "string" || typeof raw.model !== "string") return null;
  return {
    id: str(raw.id) || uid(), kind: raw.kind === "compare" ? "compare" : "playground", prompt: raw.prompt, model: raw.model, output: raw.output,
    createdAt: validIso(raw.createdAt) ?? validIso(raw.created) ?? new Date(now - index * 60_000).toISOString(),
    durationMs: typeof raw.durationMs === "number" ? raw.durationMs : 0,
    template: typeof raw.template === "string" ? raw.template : undefined,
    values: isObj(raw.values) ? raw.values as Record<string, string> : undefined,
    instructions: typeof raw.instructions === "string" ? raw.instructions : undefined,
    params: isObj(raw.params) ? raw.params : undefined, usage: isObj(raw.usage) ? raw.usage : undefined,
    promptId: typeof raw.promptId === "string" ? raw.promptId : undefined,
    compareId: typeof raw.compareId === "string" ? raw.compareId : undefined,
    side: raw.side === "A" || raw.side === "B" ? raw.side : undefined, pinned: raw.pinned === true ? true : undefined
  };
}

export function capRuns(runs: RunRecord[]): RunRecord[] {
  let unpinned = 0;
  return runs.filter(r => r.pinned || ++unpinned <= RUN_LIMIT);
}

export function seedPrompts(): Prompt[] {
  const now = Date.now(), at = (days: number) => new Date(now - days * DAY).toISOString();
  const mk = (id: string, title: string, category: string, body: string, favorite: boolean, days: number): Prompt =>
    ({ id, title, body, category, tags: [], favorite, createdAt: at(days), updatedAt: at(days) });
  return [
    mk("p1", "Explain a CS concept", "Education", "Explain {{concept}} to a first-year computer science student. Use a simple analogy, a practical example, and a short recap.", true, 0),
    mk("p2", "Review code clearly", "Programming", "Review this {{language}} code. Identify bugs, explain why they happen, and suggest a corrected version.\n\nCode:\n{{code}}", false, 1),
    mk("p3", "Research outline builder", "Research", "Create a structured research outline about {{topic}}. Include the problem context, objectives, methodology, and credible source suggestions.", false, 2),
    mk("p4", "Improve a draft", "Writing", "Improve the following {{content_type}} while keeping the original meaning and a natural tone:\n\n{{draft}}", true, 3)
  ];
}

export function loadPrompts(): Prompt[] {
  if (!hasKey(KEYS.prompts)) return seedPrompts();
  const raw = load<unknown[]>(KEYS.prompts, []);
  return (Array.isArray(raw) ? raw : []).map(r => normalizePrompt(r)).filter((p): p is Prompt => p !== null);
}
export function loadSnapshots(): Snapshot[] {
  const raw = load<unknown[]>(KEYS.snapshots, []);
  return (Array.isArray(raw) ? raw : []).map((r, i) => normalizeSnapshot(r, i)).filter((s): s is Snapshot => s !== null);
}
export function loadRuns(): RunRecord[] {
  const raw = load<unknown[]>(KEYS.runs, []);
  return capRuns((Array.isArray(raw) ? raw : []).map((r, i) => normalizeRun(r, i)).filter((r): r is RunRecord => r !== null));
}
export { nowIso };
