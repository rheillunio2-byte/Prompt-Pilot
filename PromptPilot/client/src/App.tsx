import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppCtx, parseHash, routeHref, type PromptSeed, type Route } from "./lib/app";
import { fetchStatus, FALLBACK_MODELS } from "./api";
import { isTypingTarget, modKey } from "./lib/hooks";
import { KEYS, save } from "./lib/storage";
import { WorkspaceProvider } from "./lib/workspace";
import type { ApiStatus, ModelInfo } from "./types";
import { ConfirmProvider, Dialog, Kbd, ToastProvider, useConfirm } from "./components/ui";
import { FlightDeck, NAV } from "./components/FlightDeck";
import { CommandPalette } from "./components/CommandPalette";
import Overview from "./pages/Overview";
import Library from "./pages/Library";
import Editor from "./pages/Editor";
import Playground from "./pages/Playground";
import CompareLab from "./pages/CompareLab";
import Versions from "./pages/Versions";
import Templates from "./pages/Templates";
import Analytics from "./pages/Analytics";

const SHORTCUTS: [string, string[]][] = [
  ["Open the command palette", [modKey, "K"]], ["Create a prompt", ["N"]], ["Show this list", ["?"]],
  ["Save the prompt you're editing", [modKey, "S"]], ["Run in Playground or Compare Lab", [modKey, "↵"]],
  ["Go to Overview, Library, Versions", ["G", "O / L / V"]], ["Go to Templates, Playground, Compare, Analytics", ["G", "T / P / C / A"]]
];

function Shell() {
  const confirm = useConfirm();
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  const routeRef = useRef(route); routeRef.current = route;
  const dirty = useRef(false);
  const [handoff, setHandoff] = useState(0);
  const seed = useRef<PromptSeed | null>(null);
  const [palette, setPalette] = useState(false);
  const [shortcuts, setShortcuts] = useState(false);
  const [status, setStatus] = useState<ApiStatus>({ state: "checking" });

  const refreshStatus = useCallback(() => {
    fetchStatus().then(providers => setStatus({ state: "ready", providers })).catch(() => setStatus({ state: "offline" }));
  }, []);
  useEffect(() => {
    refreshStatus();
    window.addEventListener("focus", refreshStatus);
    return () => window.removeEventListener("focus", refreshStatus);
  }, [refreshStatus]);
  const models: ModelInfo[] = useMemo(() => {
    if (status.state !== "ready") return FALLBACK_MODELS;
    const all = status.providers.flatMap(p => p.models);
    return all.length ? all : FALLBACK_MODELS;
  }, [status]);

  // Hash routing with an unsaved-changes guard. replaceState never fires hashchange, so reverting is safe.
  useEffect(() => {
    const onHash = () => {
      const next = parseHash(window.location.hash), prev = routeRef.current;
      if (dirty.current && routeHref(next) !== routeHref(prev)) {
        history.replaceState(null, "", routeHref(prev));
        confirm({ title: "Discard unsaved changes?", body: "You have edits in this prompt that haven't been saved.", confirmLabel: "Discard changes", danger: true }).then(ok => {
          if (!ok) return;
          dirty.current = false; history.replaceState(null, "", routeHref(next)); setRoute(next);
        });
        return;
      }
      setRoute(next);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [confirm]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty.current) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  const navigate = useCallback((r: Route, opts?: { replace?: boolean }) => {
    const href = routeHref(r);
    if (opts?.replace) { history.replaceState(null, "", href); setRoute(r); return; }
    if (window.location.hash === href) { setHandoff(h => h + 1); return; }
    window.location.hash = href;
  }, []);

  const api = useMemo(() => ({
    route, navigate, status, refreshStatus, models,
    setDirty: (d: boolean) => { dirty.current = d; },
    openPalette: () => setPalette(true), openShortcuts: () => setShortcuts(true),
    newPrompt: (s?: PromptSeed) => { seed.current = s ?? null; if (route.name === "editor" && route.id === "new") setHandoff(h => h + 1); else navigate({ name: "editor", id: "new" }); },
    takeSeed: () => { const s = seed.current; seed.current = null; return s; },
    runInPlayground: (h: { text: string; promptId?: string; values?: Record<string, string> }) => {
      const prev = JSON.parse(localStorage.getItem(KEYS.playDraft) || "{}");
      save(KEYS.playDraft, { model: models[0]?.id, params: {}, ...prev, text: h.text, values: h.values ?? {}, promptId: h.promptId, lastRunId: undefined });
      navigate({ name: "playground" }); setHandoff(x => x + 1);
    },
    openCompare: (h?: { base?: string }) => {
      if (h?.base !== undefined) {
        const prev = JSON.parse(localStorage.getItem(KEYS.compareDraft) || "{}");
        save(KEYS.compareDraft, { ...prev, base: h.base, values: {} });
      }
      navigate({ name: "compare" }); setHandoff(x => x + 1);
    }
  }), [route, navigate, status, refreshStatus, models]);

  useEffect(() => {
    let pending = false, timer = 0;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPalette(v => !v); return; }
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target) || document.querySelector('[role="dialog"]')) return;
      if (pending) {
        pending = false; window.clearTimeout(timer);
        const hit = NAV.flatMap(g => g.items).find(i => i.keys === `g ${e.key.toLowerCase()}`);
        if (hit) { e.preventDefault(); navigate({ name: hit.name }); }
        return;
      }
      if (e.key === "g") { pending = true; timer = window.setTimeout(() => { pending = false; }, 900); }
      else if (e.key === "n") { e.preventDefault(); api.newPrompt(); }
      else if (e.key === "?") { e.preventDefault(); setShortcuts(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); window.clearTimeout(timer); };
  }, [navigate, api]);

  const key = `${route.name}:${route.id ?? ""}:${handoff}`;
  const page = (() => {
    switch (route.name) {
      case "library": return <Library />;
      case "editor": return <Editor id={route.id ?? "new"} />;
      case "playground": return <Playground />;
      case "compare": return <CompareLab />;
      case "versions": return <Versions promptId={route.id} />;
      case "templates": return <Templates />;
      case "analytics": return <Analytics />;
      default: return <Overview />;
    }
  })();

  return <AppCtx.Provider value={api}>
    <a className="skip-link" href="#main">Skip to content</a>
    <FlightDeck />
    <main id="main" className="main"><div className="page" key={key}>{page}</div></main>
    <CommandPalette open={palette} onClose={() => setPalette(false)} />
    <Dialog open={shortcuts} onClose={() => setShortcuts(false)} title="Keyboard shortcuts" size="sm">
      <dl className="shortcut-list">{SHORTCUTS.map(([label, keys]) => <div key={label}><dt>{label}</dt><dd>{keys.map(k => <Kbd key={k}>{k}</Kbd>)}</dd></div>)}</dl>
    </Dialog>
  </AppCtx.Provider>;
}

export default function App() {
  return <ToastProvider><ConfirmProvider><WorkspaceProvider><Shell /></WorkspaceProvider></ConfirmProvider></ToastProvider>;
}
