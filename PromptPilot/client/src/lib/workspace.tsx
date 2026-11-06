import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Prompt, RunRecord, Snapshot } from "../types";
import { useToast } from "../components/ui";
import { KEYS, capRuns, load, loadPrompts, loadRuns, loadSnapshots, normalizePrompt, normalizeRun, normalizeSnapshot, save } from "./storage";
import { nowIso, uid } from "./format";

export type PromptDraft = { id?: string; title: string; body: string; category: string; tags: string[] };

type Workspace = {
  prompts: Prompt[]; snapshots: Snapshot[]; runs: RunRecord[]; workspaceName: string;
  setWorkspaceName: (n: string) => void;
  savePrompt: (d: PromptDraft) => Prompt;
  toggleFavorite: (id: string) => void;
  deletePrompt: (id: string) => void;
  duplicatePrompt: (id: string) => Prompt | null;
  restoreSnapshot: (snapshotId: string, mode: "in-place" | "as-new") => Prompt | null;
  addRuns: (r: RunRecord[]) => void;
  togglePin: (id: string) => void;
  clearRuns: () => void;
  exportBackup: () => void;
  importBackup: (file: File) => Promise<string>;
  resetWorkspace: () => void;
};
const Ctx = createContext<Workspace | null>(null);
export function useWorkspace(): Workspace {
  const v = useContext(Ctx);
  if (!v) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return v;
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const [prompts, setPrompts] = useState<Prompt[]>(loadPrompts);
  const [snapshots, setSnapshots] = useState<Snapshot[]>(loadSnapshots);
  const [runs, setRuns] = useState<RunRecord[]>(loadRuns);
  const [workspaceName, setName] = useState<string>(() => load<string>(KEYS.workspace, "Personal workspace"));
  const warned = useRef(false);
  const persist = (key: string, value: unknown) => {
    if (!save(key, value) && !warned.current) { warned.current = true; toast("Browser storage is full or unavailable. Export a backup so you don't lose work.", "error"); }
  };
  useEffect(() => persist(KEYS.prompts, prompts), [prompts]);
  useEffect(() => persist(KEYS.snapshots, snapshots), [snapshots]);
  useEffect(() => persist(KEYS.runs, runs), [runs]);
  useEffect(() => persist(KEYS.workspace, workspaceName), [workspaceName]);

  const savePrompt = (d: PromptDraft): Prompt => {
    const now = nowIso(), title = d.title.trim();
    const existing = d.id ? prompts.find(p => p.id === d.id) : undefined;
    if (!existing) {
      const p: Prompt = { id: d.id ?? uid(), title, body: d.body, category: d.category, tags: d.tags, favorite: false, createdAt: now, updatedAt: now };
      setPrompts(ps => [p, ...ps]);
      return p;
    }
    const contentChanged = existing.title !== title || existing.body !== d.body || existing.category !== d.category;
    const tagsChanged = existing.tags.join("\u0000") !== d.tags.join("\u0000");
    if (!contentChanged && !tagsChanged) return existing;
    if (contentChanged) {
      // The previous state becomes a numbered version dated from when it was last saved.
      setSnapshots(s => [{ id: uid(), promptId: existing.id, title: existing.title, body: existing.body, category: existing.category, createdAt: existing.updatedAt }, ...s]);
    }
    const next: Prompt = { ...existing, title, body: d.body, category: d.category, tags: d.tags, updatedAt: now };
    setPrompts(ps => ps.map(p => p.id === existing.id ? next : p));
    return next;
  };
  const toggleFavorite = (id: string) => setPrompts(ps => ps.map(p => p.id === id ? { ...p, favorite: !p.favorite } : p));
  const deletePrompt = (id: string) => setPrompts(ps => ps.filter(p => p.id !== id)); // versions are kept so they can be restored
  const duplicatePrompt = (id: string) => {
    const src = prompts.find(p => p.id === id); if (!src) return null;
    const now = nowIso();
    const copy: Prompt = { ...src, id: uid(), title: `${src.title} (copy)`, favorite: false, createdAt: now, updatedAt: now, tags: [...src.tags] };
    setPrompts(ps => [copy, ...ps]);
    return copy;
  };
  const restoreSnapshot = (snapshotId: string, mode: "in-place" | "as-new") => {
    const snap = snapshots.find(s => s.id === snapshotId); if (!snap) return null;
    const live = prompts.find(p => p.id === snap.promptId);
    if (mode === "in-place" && live) return savePrompt({ id: live.id, title: snap.title, body: snap.body, category: snap.category, tags: live.tags });
    const now = nowIso();
    const p: Prompt = { id: uid(), title: live || mode === "as-new" ? `${snap.title} (restored)` : snap.title, body: snap.body, category: snap.category, tags: [], favorite: false, createdAt: now, updatedAt: now };
    setPrompts(ps => [p, ...ps]);
    return p;
  };
  const addRuns = (r: RunRecord[]) => setRuns(h => capRuns([...r, ...h]));
  const togglePin = (id: string) => setRuns(h => capRuns(h.map(r => r.id === id ? { ...r, pinned: r.pinned ? undefined : true } : r)));
  const clearRuns = () => setRuns(h => h.filter(r => r.pinned));

  const exportBackup = () => {
    const payload = { app: "PromptPilot", version: 4, exportedAt: nowIso(), workspaceName, prompts, snapshots, runs };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const a = document.createElement("a"); a.href = url; a.download = `promptpilot-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    toast("Backup exported.");
  };
  const importBackup = async (file: File): Promise<string> => {
    let data: any;
    try { data = JSON.parse(await file.text()); } catch { throw new Error("That file isn't valid JSON."); }
    if (!data || !Array.isArray(data.prompts)) throw new Error("This file doesn't contain a PromptPilot prompt library.");
    // Imported prompts get fresh ids; versions and runs are re-pointed so nothing is orphaned.
    const idMap = new Map<string, string>();
    const incoming: Prompt[] = [];
    data.prompts.forEach((raw: unknown) => {
      const p = normalizePrompt(raw); if (!p) return;
      const fresh = uid(); idMap.set(p.id, fresh); incoming.push({ ...p, id: fresh });
    });
    const snaps = (Array.isArray(data.snapshots) ? data.snapshots : []).map((s: unknown, i: number) => normalizeSnapshot(s, i)).filter((s: Snapshot | null): s is Snapshot => !!s)
      .map((s: Snapshot) => ({ ...s, id: uid(), promptId: idMap.get(s.promptId) ?? s.promptId }));
    const incomingRuns = (Array.isArray(data.runs) ? data.runs : []).map((r: unknown, i: number) => normalizeRun(r, i)).filter((r: RunRecord | null): r is RunRecord => !!r)
      .map((r: RunRecord) => ({ ...r, id: uid(), promptId: r.promptId ? idMap.get(r.promptId) : undefined }));
    setPrompts(ps => [...incoming, ...ps]); setSnapshots(ss => [...snaps, ...ss]); setRuns(rs => capRuns([...incomingRuns, ...rs]));
    return `Imported ${incoming.length} prompt${incoming.length === 1 ? "" : "s"}, ${snaps.length} version${snaps.length === 1 ? "" : "s"} and ${incomingRuns.length} experiment${incomingRuns.length === 1 ? "" : "s"}.`;
  };
  const resetWorkspace = () => {
    setPrompts([]); setSnapshots([]); setRuns([]);
    try { localStorage.removeItem(KEYS.playDraft); localStorage.removeItem(KEYS.compareDraft); } catch { /* ignore */ }
  };

  return <Ctx.Provider value={{
    prompts, snapshots, runs, workspaceName, setWorkspaceName: n => setName(n.trim() || "Personal workspace"),
    savePrompt, toggleFavorite, deletePrompt, duplicatePrompt, restoreSnapshot, addRuns, togglePin, clearRuns, exportBackup, importBackup, resetWorkspace
  }}>{children}</Ctx.Provider>;
}

/** Version helpers shared by Versions, Editor and Overview. Versions are numbered oldest → newest per prompt. */
export type VersionEntry = { key: string; number: number; title: string; body: string; category: string; at: string; current: boolean; snapshotId?: string };
export function versionsFor(promptId: string, prompt: Prompt | undefined, snapshots: Snapshot[]): VersionEntry[] {
  const mine = snapshots.filter(s => s.promptId === promptId).map((s, i) => ({ s, i }))
    .sort((a, b) => Date.parse(a.s.createdAt) - Date.parse(b.s.createdAt) || b.i - a.i);
  const list: VersionEntry[] = mine.map(({ s }, idx) => ({ key: s.id, number: idx + 1, title: s.title, body: s.body, category: s.category, at: s.createdAt, current: false, snapshotId: s.id }));
  if (prompt) list.push({ key: "current", number: list.length + 1, title: prompt.title, body: prompt.body, category: prompt.category, at: prompt.updatedAt, current: true });
  return list.reverse(); // newest first
}
