import { useEffect, useMemo, useRef, useState } from "react";
import { Bookmark, Play, Save, Square, Trash2 } from "lucide-react";
import { useApp, type PlayDraft } from "../lib/app";
import { useWorkspace } from "../lib/workspace";
import { KEYS } from "../lib/storage";
import { extractVariables, formatDuration, formatTokens, missingVariables, relativeTime, resolveVariables, uid, nowIso } from "../lib/format";
import { useRun, usePersistentState } from "../lib/useRun";
import type { RunRecord } from "../types";
import { Badge, Button, EmptyState, IconButton, PageHeader, Panel, Select, Tooltip, modKey, useToast } from "../components/ui";
import { PromptField, VariableInputs } from "../components/PromptField";
import { CopyButton, LibraryPicker, OutputView, ParamsPopover, UsageMeta } from "../components/RunParts";

const DEFAULT_TEXT = "Explain {{concept}} to a first-year computer science student. Use a simple analogy, a practical example, and a short recap.";

export default function Playground() {
  const app = useApp(); const ws = useWorkspace(); const toast = useToast();
  const [draft, setDraft] = usePersistentState<PlayDraft>(KEYS.playDraft, { text: DEFAULT_TEXT, model: app.models[0].id, params: {}, values: {} });
  const model = app.models.some(m => m.id === draft.model) ? draft.model : app.models[0].id;
  const lastRun = ws.runs.find(r => r.id === draft.lastRunId);
  const { state, elapsed, run, stop, reset, show } = useRun(lastRun ? { status: "done", output: lastRun.output, durationMs: lastRun.durationMs, usage: lastRun.usage, model: lastRun.model } : undefined);
  const [missing, setMissing] = useState<string[]>([]);
  const names = useMemo(() => extractVariables(draft.text), [draft.text]);
  const history = useMemo(() => ws.runs.filter(r => r.kind === "playground").slice(0, 8), [ws.runs]);
  const currentRun = ws.runs.find(r => r.id === draft.lastRunId);
  const busy = state.status === "running";

  const execute = async () => {
    if (busy) return;
    if (!draft.text.trim()) { toast("Write a prompt first.", "error"); return; }
    const miss = missingVariables(draft.text, draft.values);
    setMissing(miss);
    if (miss.length) { toast(`Fill in ${miss.map(m => `{{${m}}}`).join(", ")} before running.`, "error"); return; }
    const resolved = resolveVariables(draft.text, draft.values);
    const params = draft.params;
    const res = await run({ prompt: resolved, model, params });
    if (!res) return;
    const rec: RunRecord = { id: uid(), kind: "playground", prompt: resolved, template: draft.text, values: draft.values, model: res.model || model, output: res.text, createdAt: nowIso(), durationMs: res.durationMs, params, usage: res.usage, promptId: draft.promptId };
    ws.addRuns([rec]);
    setDraft(d => ({ ...d, lastRunId: rec.id }));
  };
  const load = (r: RunRecord) => {
    setMissing([]);
    setDraft(d => ({ ...d, text: r.template ?? r.prompt, values: r.values ?? {}, model: r.model, params: r.params ?? {}, promptId: r.promptId, lastRunId: r.id }));
    show({ status: "done", output: r.output, durationMs: r.durationMs, usage: r.usage, model: r.model });
  };

  const runRef = useRef<() => void>(() => {}); runRef.current = execute;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !document.querySelector('[role="dialog"]')) { e.preventDefault(); runRef.current(); } };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, []);
  return <div>
    <PageHeader title="Playground" description="Write a prompt, run it against a model, and inspect the result." />
    <div className="lab-grid">
      <Panel title="Input" actions={<>
        <LibraryPicker prompts={ws.prompts} snapshots={ws.snapshots} onPick={body => { setMissing([]); setDraft(d => ({ ...d, text: body, values: {}, lastRunId: undefined })); reset(); }} />
        <Button size="sm" icon={<Save size={13} />} disabled={!draft.text.trim()} onClick={() => app.newPrompt({ title: "", body: draft.text, category: "General", tags: [] })}>Save as prompt</Button></>}>
        <PromptField label="Prompt" value={draft.text} minHeight={200} placeholder="Write your prompt. Use {{variables}} for values you want to change between runs."
          onChange={v => { setDraft(d => ({ ...d, text: v })); setMissing([]); }} />
        {names.length > 0 && <div className="var-section"><h3>Variables <Badge tone="accent">{names.length}</Badge></h3>
          <VariableInputs names={names} values={draft.values} missing={missing} onChange={(n, v) => { setDraft(d => ({ ...d, values: { ...d.values, [n]: v } })); setMissing(m => m.filter(x => x !== n)); }} /></div>}
        <div className="run-bar">
          <Select aria-label="Model" value={model} onChange={e => setDraft(d => ({ ...d, model: e.target.value }))}>{app.models.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}</Select>
          <ParamsPopover params={draft.params} onChange={p => setDraft(d => ({ ...d, params: p }))} />
          <span className="toolbar-spacer" />
          {busy ? <Button icon={<Square size={13} fill="currentColor" />} onClick={stop}>Stop</Button>
            : <Tooltip label={`${modKey}+Enter`}><Button variant="primary" icon={<Play size={13} fill="currentColor" />} onClick={execute}>Run</Button></Tooltip>}
        </div>
      </Panel>
      <Panel title="Output" className="output-panel" actions={<>
        <Badge tone={state.status === "done" ? "success" : state.status === "error" ? "danger" : state.status === "running" ? "accent" : "neutral"}>
          {state.status === "running" ? `Running ${formatDuration(elapsed)}` : state.status === "done" ? "Completed" : state.status === "error" ? "Failed" : "Ready"}</Badge>
        {state.status === "done" && state.output && <>
          <CopyButton text={state.output} />
          <Button size="sm" icon={<Bookmark size={13} fill={currentRun?.pinned ? "currentColor" : "none"} />} disabled={!currentRun} aria-pressed={!!currentRun?.pinned}
            onClick={() => { if (currentRun) { ws.togglePin(currentRun.id); toast(currentRun.pinned ? "Removed from saved experiments." : "Experiment saved. It won't be removed from history."); } }}>{currentRun?.pinned ? "Saved" : "Save experiment"}</Button>
          <IconButton label="Clear output" onClick={() => { reset(); setDraft(d => ({ ...d, lastRunId: undefined })); }}><Trash2 size={15} /></IconButton></>}</>}>
        <OutputView state={state} elapsed={elapsed} idleText="Run the prompt to see the model's response here." />
        {state.status === "done" && <UsageMeta durationMs={state.durationMs} usage={state.usage} model={state.model} output={state.output} />}
      </Panel>
    </div>
    <Panel title="Recent runs" description="Every run is stored in this browser. Saved experiments are kept beyond the history limit." flush className="runs-panel">
      {history.length ? <div className="table-wrap"><table className="table is-compact"><thead><tr><th>Prompt</th><th>Model</th><th className="num">Time</th><th className="num">Tokens</th><th className="col-time">When</th></tr></thead>
        <tbody>{history.map(r => <tr key={r.id} tabIndex={0} className={draft.lastRunId === r.id ? "is-selected" : ""} onClick={() => load(r)} onKeyDown={e => { if (e.key === "Enter") load(r); }}>
          <td className="col-title"><b>{(r.template ?? r.prompt).replace(/\s+/g, " ").slice(0, 80)}</b></td><td>{r.model}</td><td className="num">{formatDuration(r.durationMs)}</td><td className="num">{formatTokens(r.usage?.totalTokens)}</td>
          <td className="col-time">{r.pinned && <Bookmark size={12} className="pin-mark" fill="currentColor" />} {relativeTime(r.createdAt)}</td></tr>)}</tbody></table></div>
        : <EmptyState title="No runs yet" text="Your runs will be listed here so you can reopen any of them." />}
    </Panel>
  </div>;
}
