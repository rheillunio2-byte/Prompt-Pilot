import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
  BookOpen, ChevronDown, Command, Database, Download, FlaskConical, Gauge, History, Keyboard, Layers3,
  LayoutDashboard, Plus, Search, Terminal, Trash2, Upload, User
} from "lucide-react";
import { useApp, type RouteName } from "../lib/app";
import { useWorkspace } from "../lib/workspace";
import { useImporter } from "../lib/importer";
import { initials } from "../lib/format";
import { Button, Input, Kbd, Menu, Popover, Skeleton, modKey, useConfirm, useToast } from "./ui";

export const NAV: { group?: string; items: { name: RouteName; label: string; icon: ReactNode; keys: string }[] }[] = [
  { items: [{ name: "overview", label: "Overview", icon: <LayoutDashboard size={15} />, keys: "g o" }] },
  { group: "Prompts", items: [
    { name: "library", label: "Library", icon: <BookOpen size={15} />, keys: "g l" },
    { name: "versions", label: "Versions", icon: <History size={15} />, keys: "g v" },
    { name: "templates", label: "Templates", icon: <Layers3 size={15} />, keys: "g t" }] },
  { group: "Experiments", items: [
    { name: "playground", label: "Playground", icon: <Terminal size={15} />, keys: "g p" },
    { name: "compare", label: "Compare Lab", icon: <FlaskConical size={15} />, keys: "g c" },
    { name: "analytics", label: "Analytics", icon: <Gauge size={15} />, keys: "g a" }] }
];

function Logo() {
  return <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden><rect width="22" height="22" rx="6" fill="var(--accent)" />
    <path d="M6.5 14.8 11 6l4.5 8.8M8.4 12.6h5.2" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function ProviderStatus() {
  const { status, refreshStatus } = useApp();
  const provider = status.state === "ready" ? status.providers[0] : undefined;
  const tone = status.state === "checking" ? "checking" : status.state === "offline" ? "bad" : provider?.configured ? "ok" : "warn";
  const text = status.state === "checking" ? "Checking" : status.state === "offline" ? "API offline" : !provider ? "No provider" : provider.configured ? `${provider.name.replace("Google ", "")} ready` : "Key missing";
  return <Popover align="end" className="popover-panel" renderTrigger={p => <span ref={p.ref} className="trigger-wrap">
    <button type="button" className="status-pill" aria-expanded={p.open} onClick={() => { p.onClick(); refreshStatus(); }}>
      <i className={`dot dot-${tone}`} /><span className="status-text">{text}</span></button></span>}>
    {() => <div className="status-panel">
      <h3>Model providers</h3>
      {status.state === "checking" && <Skeleton lines={2} />}
      {status.state === "offline" && <p className="muted-text">The PromptPilot server isn't responding. Run <code>npm run dev</code> from the project root, then reopen this panel.</p>}
      {status.state === "ready" && status.providers.map(p => <div key={p.id} className="status-row">
        <div><b>{p.name}</b><small>{p.models.map(m => m.label).join(", ")}</small></div>
        <span className={`badge badge-${p.configured ? "success" : "warn"}`}>{p.configured ? "Configured" : "Key missing"}</span></div>)}
      {status.state === "ready" && status.providers.some(p => !p.configured) && <p className="muted-text">Add <code>GEMINI_API_KEY</code> to <code>server/.env</code> and restart the server. The key never reaches the browser.</p>}
    </div>}
  </Popover>;
}

export function FlightDeck() {
  const app = useApp(); const ws = useWorkspace(); const toast = useToast(); const confirm = useConfirm(); const importer = useImporter();
  const active: RouteName = app.route.name === "editor" ? "library" : app.route.name;

  const scroller = useRef<HTMLDivElement>(null);
  const buttons = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [ind, setInd] = useState({ left: 0, width: 0, ready: false });
  const measure = () => {
    const el = buttons.current[active], box = scroller.current;
    if (!el || !box) return;
    setInd(prev => ({ left: el.offsetLeft, width: el.offsetWidth, ready: prev.ready || prev.width > 0 }));
  };
  useLayoutEffect(measure, [active]);
  useEffect(() => {
    const box = scroller.current; if (!box) return;
    const ro = new ResizeObserver(measure); ro.observe(box);
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, [active]);
  useEffect(() => {
    const el = buttons.current[active], box = scroller.current;
    if (el && box && box.scrollWidth > box.clientWidth) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      box.scrollTo({ left: el.offsetLeft - (box.clientWidth - el.offsetWidth) / 2, behavior: reduce ? "auto" : "smooth" });
    }
  }, [active]);

  const [nameDraft, setNameDraft] = useState(ws.workspaceName);
  const reset = async () => {
    if (await confirm({ title: "Clear all local data?", body: "This removes every prompt, version and experiment stored in this browser. Export a backup first if you might need them again.", confirmLabel: "Clear everything", danger: true })) {
      ws.resetWorkspace(); toast("Workspace cleared."); app.navigate({ name: "overview" });
    }
  };

  return <header className="flightdeck">
    {importer.input}
    <div className="commandbar">
      <a className="brand" href="#/overview" aria-label="PromptPilot home"><Logo /><span>PromptPilot</span></a>
      <Popover className="popover-panel" renderTrigger={p => <span ref={p.ref} className="trigger-wrap">
        <button type="button" className="workspace-btn" aria-expanded={p.open} onClick={() => { setNameDraft(ws.workspaceName); p.onClick(); }}>
          <span className="ws-mark">{initials(ws.workspaceName)}</span><span className="ws-name">{ws.workspaceName}</span><ChevronDown size={14} /></button></span>}>
        {close => <div className="ws-panel">
          <label className="field-label" htmlFor="ws-name">Workspace name</label>
          <Input id="ws-name" value={nameDraft} maxLength={40} onChange={e => setNameDraft(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { ws.setWorkspaceName(nameDraft); close(); } }} />
          <div className="ws-actions"><Button size="sm" variant="primary" onClick={() => { ws.setWorkspaceName(nameDraft); close(); }}>Rename</Button></div>
          <p className="muted-text"><Database size={13} /> This workspace is stored in this browser only. Use backups to move it between devices.</p>
          <div className="ws-links">
            <button onClick={() => { close(); ws.exportBackup(); }}><Download size={14} />Export backup</button>
            <button onClick={() => { close(); importer.pick(); }}><Upload size={14} />Import backup</button>
          </div>
        </div>}
      </Popover>
      <button type="button" className="search-trigger" onClick={app.openPalette} aria-label="Search or run a command">
        <Search size={14} /><span>Search prompts or run a command</span><span className="kbd-group"><Kbd>{modKey}</Kbd><Kbd>K</Kbd></span></button>
      <div className="commandbar-end">
        <button type="button" className="icon-btn search-icon" aria-label="Search" onClick={app.openPalette}><Search size={16} /></button>
        <ProviderStatus />
        <Menu align="end" label="Account menu" trigger={p => <span ref={p.ref} className="trigger-wrap"><button type="button" className="avatar" aria-label="Profile menu" aria-haspopup="menu" aria-expanded={p.open} onClick={p.onClick}>{initials(ws.workspaceName) || <User size={14} />}</button></span>}
          items={[
            { label: "Keyboard shortcuts", icon: <Keyboard size={14} />, shortcut: "?", onSelect: app.openShortcuts },
            { label: "Command palette", icon: <Command size={14} />, shortcut: `${modKey} K`, onSelect: app.openPalette },
            "separator",
            { label: "Export backup", icon: <Download size={14} />, onSelect: ws.exportBackup },
            { label: "Import backup", icon: <Upload size={14} />, onSelect: importer.pick },
            "separator",
            { label: "Clear all local data", icon: <Trash2 size={14} />, danger: true, onSelect: reset }
          ]} />
      </div>
    </div>
    <div className="deckbar">
      <nav className="deck" aria-label="Flight Deck">
        <div className="deck-scroll" ref={scroller}>
          <div className="deck-track">
            {NAV.map((g, gi) => <div className="deck-group" role="group" aria-label={g.group ?? "Workspace"} key={gi}>
              {g.group && <span className="deck-group-label">{g.group}</span>}
              {g.items.map(it => <a key={it.name} ref={el => { buttons.current[it.name] = el; }} href={`#/${it.name}`}
                className={`deck-item ${active === it.name ? "is-active" : ""}`} aria-current={active === it.name ? "page" : undefined}>{it.icon}{it.label}</a>)}
            </div>)}
            <span className={`deck-indicator ${ind.ready ? "is-ready" : ""}`} style={{ transform: `translateX(${ind.left}px)`, width: ind.width }} aria-hidden />
          </div>
        </div>
      </nav>
      <Button variant="primary" size="sm" className="deck-new" icon={<Plus size={14} />} onClick={() => app.newPrompt()}>New prompt</Button>
    </div>
  </header>;
}
