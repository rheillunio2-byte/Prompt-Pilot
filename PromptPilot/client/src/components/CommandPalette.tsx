import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { BookOpen, Download, Keyboard, Layers3, Plus, Search, Terminal } from "lucide-react";
import { useApp } from "../lib/app";
import { useWorkspace } from "../lib/workspace";
import { TEMPLATES } from "../lib/templates";
import { NAV } from "./FlightDeck";
import { Kbd, modKey } from "./ui";

type Cmd = { id: string; group: string; label: string; hint?: string; icon: ReactNode; run: () => void; keys?: string };

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const app = useApp(); const ws = useWorkspace();
  const [q, setQ] = useState(""); const [idx, setIdx] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (open) { setQ(""); setIdx(0); } }, [open]);

  const commands = useMemo<Cmd[]>(() => {
    const go = (fn: () => void) => () => { onClose(); fn(); };
    const base: Cmd[] = [
      ...NAV.flatMap(g => g.items).map(i => ({ id: `nav-${i.name}`, group: "Go to", label: i.label, icon: i.icon, keys: i.keys, run: go(() => app.navigate({ name: i.name })) })),
      { id: "new", group: "Actions", label: "New prompt", icon: <Plus size={15} />, keys: "n", run: go(() => app.newPrompt()) },
      { id: "play", group: "Actions", label: "Start a blank Playground run", icon: <Terminal size={15} />, run: go(() => app.runInPlayground({ text: "" })) },
      { id: "export", group: "Actions", label: "Export workspace backup", icon: <Download size={15} />, run: go(ws.exportBackup) },
      { id: "keys", group: "Actions", label: "Keyboard shortcuts", icon: <Keyboard size={15} />, keys: "?", run: go(app.openShortcuts) }
    ];
    const needle = q.trim().toLowerCase();
    if (!needle) return base;
    const match = (s: string) => s.toLowerCase().includes(needle);
    const prompts: Cmd[] = ws.prompts.filter(p => match(`${p.title} ${p.category} ${p.tags.join(" ")} ${p.body}`)).slice(0, 6)
      .map(p => ({ id: `p-${p.id}`, group: "Prompts", label: p.title, hint: p.category, icon: <BookOpen size={15} />, run: go(() => app.navigate({ name: "editor", id: p.id })) }));
    const templates: Cmd[] = TEMPLATES.filter(t => match(`${t.title} ${t.category} ${t.summary}`)).slice(0, 4)
      .map(t => ({ id: `t-${t.id}`, group: "Templates", label: `Use template: ${t.title}`, hint: t.category, icon: <Layers3 size={15} />, run: go(() => app.newPrompt({ title: t.title, body: t.body, category: t.category === "Programming" ? "Programming" : t.category, tags: t.tags })) }));
    return [...base.filter(c => match(c.label)), ...prompts, ...templates];
  }, [q, ws.prompts, app, ws.exportBackup, onClose]);

  useEffect(() => setIdx(0), [q]);
  useEffect(() => { listRef.current?.querySelector<HTMLElement>(`[data-idx="${idx}"]`)?.scrollIntoView({ block: "nearest" }); }, [idx]);
  if (!open) return null;

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setIdx(i => Math.min(i + 1, commands.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); commands[idx]?.run(); }
    else if (e.key === "Escape") { e.preventDefault(); onClose(); }
  };
  let lastGroup = "";
  return createPortal(<div className="overlay overlay-top" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="palette" role="dialog" aria-modal="true" aria-label="Command palette" onKeyDown={onKey}>
      <div className="palette-input"><Search size={16} />
        <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search prompts, templates, or commands" aria-label="Search" role="combobox" aria-expanded="true" aria-controls="palette-list" aria-activedescendant={commands[idx] ? `cmd-${commands[idx].id}` : undefined} />
        <Kbd>Esc</Kbd></div>
      <div className="palette-list" id="palette-list" role="listbox" ref={listRef}>
        {commands.length === 0 && <p className="palette-empty">No matches for “{q}”.</p>}
        {commands.map((c, i) => {
          const header = c.group !== lastGroup ? <div className="palette-group" key={`g-${c.group}`}>{c.group}</div> : null; lastGroup = c.group;
          return <div key={c.id}>{header}<button id={`cmd-${c.id}`} role="option" aria-selected={i === idx} data-idx={i} className={`palette-item ${i === idx ? "is-active" : ""}`}
            onMouseMove={() => setIdx(i)} onClick={c.run}>{c.icon}<span className="palette-label">{c.label}</span>{c.hint && <span className="palette-hint">{c.hint}</span>}{c.keys && <span className="kbd-group">{c.keys.split(" ").map(k => <Kbd key={k}>{k}</Kbd>)}</span>}</button></div>;
        })}
      </div>
      <div className="palette-foot"><span><Kbd>↑</Kbd><Kbd>↓</Kbd> navigate</span><span><Kbd>↵</Kbd> select</span><span><Kbd>{modKey}</Kbd><Kbd>K</Kbd> toggle</span></div>
    </div></div>, document.body);
}
