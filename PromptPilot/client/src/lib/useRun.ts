import { useCallback, useEffect, useRef, useState } from "react";
import { generate } from "../api";
import type { GenParams, Usage } from "../types";
import { load, save } from "./storage";

export type RunState = { status: "idle" | "running" | "done" | "error"; output?: string; error?: string; durationMs?: number; usage?: Usage; model?: string; stopped?: boolean };
export type RunResult = { text: string; model: string; usage?: Usage; durationMs: number };

/** Runs one generation with cancel support and a live elapsed timer. Results still resolve if the page unmounts, so callers can always record them. */
export function useRun(initial?: RunState) {
  const [state, setState] = useState<RunState>(initial ?? { status: "idle" });
  const [elapsed, setElapsed] = useState(0);
  const ctl = useRef<AbortController | null>(null);
  const timer = useRef(0);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; window.clearInterval(timer.current); }; }, []);

  const run = useCallback(async (opts: { prompt: string; model: string; params?: GenParams }): Promise<RunResult | null> => {
    ctl.current?.abort();
    const mine = new AbortController(); ctl.current = mine;
    const t0 = performance.now();
    const live = () => mounted.current && ctl.current === mine;
    setElapsed(0); setState({ status: "running" });
    window.clearInterval(timer.current);
    timer.current = window.setInterval(() => { if (mounted.current) setElapsed(performance.now() - t0); }, 100);
    try {
      const res = await generate({ ...opts, signal: mine.signal });
      const durationMs = performance.now() - t0;
      const text = res.text || "The model returned an empty response.";
      if (live()) setState({ status: "done", output: text, durationMs, usage: res.usage, model: res.model });
      return { text, model: res.model, usage: res.usage, durationMs };
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") { if (live()) setState({ status: "idle", stopped: true }); return null; }
      if (live()) setState({ status: "error", error: e instanceof Error ? e.message : "Generation failed.", durationMs: performance.now() - t0 });
      return null;
    } finally { if (ctl.current === mine) window.clearInterval(timer.current); }
  }, []);
  const stop = useCallback(() => ctl.current?.abort(), []);
  const reset = useCallback(() => { ctl.current?.abort(); setState({ status: "idle" }); }, []);
  const show = useCallback((s: RunState) => setState(s), []);
  return { state, elapsed, run, stop, reset, show };
}

export function usePersistentState<T>(key: string, initial: T): [T, (u: T | ((p: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => ({ ...initial, ...load<Partial<T>>(key, {}) }));
  const update = useCallback((u: T | ((p: T) => T)) => {
    setValue(prev => { const next = typeof u === "function" ? (u as (p: T) => T)(prev) : u; save(key, next); return next; });
  }, [key]);
  return [value, update];
}
