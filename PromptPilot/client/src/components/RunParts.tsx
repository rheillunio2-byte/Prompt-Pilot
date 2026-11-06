import { useState } from "react";
import { AlertTriangle, Check, Copy, SlidersHorizontal } from "lucide-react";
import type { GenParams, Prompt, Snapshot, Usage } from "../types";
import { versionsFor } from "../lib/workspace";
import { formatDuration, formatTokens, wordCount } from "../lib/format";
import type { RunState } from "../lib/useRun";
import { Badge, Button, IconButton, Popover, Select, Skeleton, useToast } from "./ui";

export function ParamsPopover({ params, onChange }: { params: GenParams; onChange: (p: GenParams) => void }) {
  const active = Object.values(params).filter(v => v !== undefined).length;
  const rows: { key: keyof GenParams; label: string; min: number; max: number; step: number; def: number; hint: string }[] = [
    { key: "temperature", label: "Temperature", min: 0, max: 2, step: 0.1, def: 1, hint: "Lower is more focused, higher is more varied." },
    { key: "topP", label: "Top-p", min: 0, max: 1, step: 0.05, def: 0.95, hint: "Limits sampling to the most likely tokens." },
    { key: "maxOutputTokens", label: "Max output tokens", min: 1, max: 65536, step: 1, def: 2048, hint: "Gemini 2.5 models count reasoning tokens toward this limit, so very low values can return nothing." }
  ];
  return <Popover className="popover-panel" renderTrigger={p => <span ref={p.ref} className="trigger-wrap">
    <Button icon={<SlidersHorizontal size={14} />} aria-expanded={p.open} onClick={p.onClick}>Parameters{active > 0 && <Badge tone="accent">{active}</Badge>}</Button></span>}>
    {() => <div className="params-panel"><h3>Generation parameters</h3><p className="muted-text">Unchecked values use the model's defaults.</p>
      {rows.map(r => { const v = params[r.key]; const on = v !== undefined; const set = (n: number | undefined) => onChange({ ...params, [r.key]: n });
        return <div key={r.key} className="param-row"><label className="param-head"><input type="checkbox" checked={on} onChange={e => set(e.target.checked ? r.def : undefined)} /><span>{r.label}</span></label>
          <div className="param-control"><input type="range" aria-label={`${r.label} slider`} disabled={!on || r.key === "maxOutputTokens"} min={r.min} max={r.key === "maxOutputTokens" ? 8192 : r.max} step={r.step} value={on ? Math.min(v as number, r.key === "maxOutputTokens" ? 8192 : r.max) : r.def} onChange={e => set(Number(e.target.value))} />
            <input type="number" aria-label={r.label} className="input num-input" disabled={!on} min={r.min} max={r.max} step={r.step} value={on ? v : ""} placeholder="default"
              onChange={e => { const n = Number(e.target.value); if (e.target.value !== "" && !Number.isNaN(n)) set(Math.max(r.min, Math.min(r.max, r.key === "maxOutputTokens" ? Math.round(n) : n))); }} /></div>
          <small>{r.hint}</small></div>; })}
      {active > 0 && <Button size="sm" variant="ghost" onClick={() => onChange({})}>Reset to defaults</Button>}</div>}
  </Popover>;
}

export function UsageMeta({ durationMs, usage, model, output }: { durationMs?: number; usage?: Usage; model?: string; output?: string }) {
  return <dl className="usage"><div><dt>Time</dt><dd>{durationMs !== undefined ? formatDuration(durationMs) : "–"}</dd></div>
    <div><dt>Input tokens</dt><dd>{formatTokens(usage?.promptTokens)}</dd></div><div><dt>Output tokens</dt><dd>{formatTokens(usage?.outputTokens)}</dd></div>
    <div><dt>Total tokens</dt><dd>{formatTokens(usage?.totalTokens)}</dd></div>{output !== undefined && <div><dt>Words</dt><dd>{wordCount(output).toLocaleString()}</dd></div>}
    {model && <div className="usage-model"><dt>Model</dt><dd>{model}</dd></div>}</dl>;
}

export function CopyButton({ text, label = "Copy output" }: { text: string; label?: string }) {
  const toast = useToast(); const [done, setDone] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setDone(true); window.setTimeout(() => setDone(false), 1500); }
    catch { toast("Couldn't copy to the clipboard.", "error"); }
  };
  return <IconButton label={done ? "Copied" : label} onClick={copy}>{done ? <Check size={15} /> : <Copy size={15} />}</IconButton>;
}

export function OutputView({ state, elapsed, idleText }: { state: RunState; elapsed: number; idleText: string }) {
  if (state.status === "running") return <div className="out-state" role="status"><Skeleton lines={5} /><p className="muted-text">Waiting for the model… {formatDuration(elapsed)}</p></div>;
  if (state.status === "error") return <div className="out-error" role="alert"><AlertTriangle size={16} /><div><b>The run failed</b><p>{state.error}</p><small>Check that the server is running and that <code>server/.env</code> has a valid API key.</small></div></div>;
  if (state.status === "done") return <div className="out-text">{state.output}</div>;
  return <div className="out-state out-idle"><p>{state.stopped ? "Stopped. Nothing was recorded." : idleText}</p></div>;
}

export function LibraryPicker({ prompts, snapshots, onPick, label = "Load from library" }: { prompts: Prompt[]; snapshots: Snapshot[]; onPick: (body: string) => void; label?: string }) {
  return <Select aria-label={label} value="" disabled={!prompts.length} onChange={e => {
    const [pid, key] = e.target.value.split("|"); const p = prompts.find(x => x.id === pid); if (!p) return;
    const v = versionsFor(p.id, p, snapshots).find(x => x.key === key); if (v) onPick(v.body);
  }}><option value="">{prompts.length ? label : "Library is empty"}</option>
    {prompts.map(p => <optgroup key={p.id} label={p.title}>{versionsFor(p.id, p, snapshots).map(v => <option key={v.key} value={`${p.id}|${v.key}`}>{v.current ? `Current (v${v.number})` : `Version ${v.number}`}</option>)}</optgroup>)}</Select>;
}
