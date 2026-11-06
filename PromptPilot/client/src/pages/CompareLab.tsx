import { useEffect, useMemo, useRef, useState } from "react";
import { FlaskConical, Play, Square } from "lucide-react";
import { useApp, type CompareDraft } from "../lib/app";
import { useWorkspace } from "../lib/workspace";
import { KEYS } from "../lib/storage";
import { extractVariables, formatDuration, missingVariables, nowIso, relativeTime, resolveVariables, uid, wordCount } from "../lib/format";
import { useRun, usePersistentState, type RunState } from "../lib/useRun";
import type { GenParams, RunRecord } from "../types";
import { Badge, Button, EmptyState, PageHeader, Panel, Select, Tooltip, modKey, useToast } from "../components/ui";
import { PromptField, VariableInputs } from "../components/PromptField";
import { CopyButton, LibraryPicker, OutputView, ParamsPopover, UsageMeta } from "../components/RunParts";

type Side = "A" | "B";
const DEFAULTS: Omit<CompareDraft, "modelA" | "modelB"> = {
  base: "Compare these two approaches to {{topic}}: explain trade-offs, complexity, and use cases.",
  a: "Give a concise answer with three practical examples.",
  b: "Explain the topic step by step, include context, examples, and a short summary.",
  paramsA: {}, paramsB: {}, values: {}
};
const buildPrompt = (base: string, ins: string, values: Record<string, string>) => {
  const shared = resolveVariables(base, values);
  return ins.trim() ? `${shared}\n\nAdditional instructions:\n${ins}` : shared;
};

export default function CompareLab() {
  const app = useApp(); const ws = useWorkspace(); const toast = useToast();
  const [d, setD] = usePersistentState<CompareDraft>(KEYS.compareDraft, { ...DEFAULTS, modelA: app.models[0].id, modelB: (app.models[1] ?? app.models[0]).id });
  const ok = (m: string) => (app.models.some(x => x.id === m) ? m : app.models[0].id);
  const modelA = ok(d.modelA), modelB = ok(d.modelB);
  const A = useRun(); const B = useRun();
  const [missing, setMissing] = useState<string[]>([]);
  const round = useRef(uid());
  const names = useMemo(() => extractVariables(d.base), [d.base]);
  const groups = useMemo(() => {
    const map = new Map<string, RunRecord[]>();
    ws.runs.filter(r => r.compareId).forEach(r => map.set(r.compareId!, [...(map.get(r.compareId!) ?? []), r]));
    return [...map.values()].slice(0, 6);
  }, [ws.runs]);

  const validate = () => {
    if (!d.base.trim()) { toast("Write the shared prompt first.", "error"); return false; }
    const miss = missingVariables(d.base, d.values); setMissing(miss);
    if (miss.length) { toast(`Fill in ${miss.map(m => `{{${m}}}`).join(", ")} before running.`, "error"); return false; }
    return true;
  };
  const runSide = async (side: Side, compareId: string) => {
    const r = side === "A" ? A : B;
    const ins = side === "A" ? d.a : d.b, model = side === "A" ? modelA : modelB, params: GenParams = side === "A" ? d.paramsA : d.paramsB;
    const prompt = buildPrompt(d.base, ins, d.values);
    const res = await r.run({ prompt, model, params });
    if (!res) return;
    ws.addRuns([{ id: uid(), kind: "compare", compareId, side, prompt, template: d.base, instructions: ins, values: d.values, model: res.model || model, output: res.text, createdAt: nowIso(), durationMs: res.durationMs, params, usage: res.usage }]);
  };
  const runOne = (side: Side) => { if (validate()) runSide(side, uid()); };
  const runBoth = () => { if (A.state.status === "running" || B.state.status === "running" || !validate()) return; round.current = uid(); runSide("A", round.current); runSide("B", round.current); };
  const stopAll = () => { A.stop(); B.stop(); };
  const anyBusy = A.state.status === "running" || B.state.status === "running";

  const restore = (g: RunRecord[]) => {
    const a = g.find(r => r.side === "A"), b = g.find(r => r.side === "B"), any = g[0];
    setMissing([]);
    setD({ base: any.template ?? any.prompt, a: a?.instructions ?? d.a, b: b?.instructions ?? d.b, modelA: a?.model ?? modelA, modelB: b?.model ?? modelB, paramsA: a?.params ?? {}, paramsB: b?.params ?? {}, values: any.values ?? {} });
    const toState = (r?: RunRecord): RunState => r ? { status: "done", output: r.output, durationMs: r.durationMs, usage: r.usage, model: r.model } : { status: "idle" };
    A.show(toState(a)); B.show(toState(b));
  };

  const summary = (() => {
    if (A.state.status !== "done" || B.state.status !== "done") return null;
    const ta = A.state.durationMs ?? 0, tb = B.state.durationMs ?? 0;
    const wa = wordCount(A.state.output ?? ""), wb = wordCount(B.state.output ?? "");
    const faster = Math.abs(ta - tb) < 50 ? "Both finished at about the same time" : `${ta < tb ? "A" : "B"} finished ${formatDuration(Math.abs(ta - tb))} faster`;
    const longer = wa === wb ? "Outputs are the same length" : `${wa > wb ? "A" : "B"} is longer (${Math.max(wa, wb)} vs ${Math.min(wa, wb)} words)`;
    return `${faster}. ${longer}.`;
  })();

  const sideCard = (side: Side, r: ReturnType<typeof useRun>, ins: string, model: string, params: GenParams) => {
    const k = side === "A";
    return <section className={`side side-${k ? "a" : "b"}`} aria-label={`Approach ${side}`}>
      <header><span className="side-letter">{side}</span><h2>Approach {side}</h2>
        <Button size="sm" variant={r.state.status === "running" ? "secondary" : "ghost"} icon={r.state.status === "running" ? <Square size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
          onClick={() => r.state.status === "running" ? r.stop() : runOne(side)}>{r.state.status === "running" ? "Stop" : `Run ${side}`}</Button></header>
      <div className="side-controls">
        <Select aria-label={`Model for approach ${side}`} value={model} onChange={e => setD(x => ({ ...x, [k ? "modelA" : "modelB"]: e.target.value }))}>{app.models.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}</Select>
        <ParamsPopover params={params} onChange={p => setD(x => ({ ...x, [k ? "paramsA" : "paramsB"]: p }))} />
        <LibraryPicker prompts={ws.prompts} snapshots={ws.snapshots} label="Load instructions…" onPick={body => setD(x => ({ ...x, [k ? "a" : "b"]: body }))} />
      </div>
      <PromptField label={`Instructions for approach ${side}`} value={ins} minHeight={110} placeholder="Extra instructions added after the shared prompt." onChange={v => setD(x => ({ ...x, [k ? "a" : "b"]: v }))} />
      <div className="side-out">
        <div className="side-out-head"><b>Output</b>
          {r.state.status === "running" && <Badge tone="accent">Running {formatDuration(r.elapsed)}</Badge>}{r.state.status === "done" && <><Badge tone="success">{formatDuration(r.state.durationMs ?? 0)}</Badge><CopyButton text={r.state.output ?? ""} label={`Copy result ${side}`} /></>}{r.state.status === "error" && <Badge tone="danger">Failed</Badge>}</div>
        <OutputView state={r.state} elapsed={r.elapsed} idleText={`Run ${side} to see its output.`} />
        {r.state.status === "done" && <UsageMeta usage={r.state.usage} model={r.state.model} output={r.state.output} />}
      </div></section>;
  };

  const runRef = useRef<() => void>(() => {}); runRef.current = runBoth;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !document.querySelector('[role="dialog"]')) { e.preventDefault(); runRef.current(); } };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, []);
  return <div>
    <PageHeader title="Compare Lab" description="Run two approaches on the same task. Change one thing at a time for a fair comparison."
      actions={anyBusy ? <Button icon={<Square size={13} fill="currentColor" />} onClick={stopAll}>Stop both</Button>
        : <Tooltip label={`${modKey}+Enter`}><Button variant="primary" icon={<FlaskConical size={14} />} onClick={runBoth}>Run both</Button></Tooltip>} />
    <Panel title="Shared prompt" description="Both approaches receive this text and the same variable values." actions={<LibraryPicker prompts={ws.prompts} snapshots={ws.snapshots} onPick={body => { setMissing([]); setD(x => ({ ...x, base: body, values: {} })); }} />}>
      <PromptField label="Shared prompt" value={d.base} minHeight={110} onChange={v => { setD(x => ({ ...x, base: v })); setMissing([]); }} placeholder="The task both approaches should work on." />
      {names.length > 0 && <div className="var-section"><h3>Shared variables <Badge tone="accent">{names.length}</Badge></h3>
        <VariableInputs names={names} values={d.values} missing={missing} onChange={(n, v) => { setD(x => ({ ...x, values: { ...x.values, [n]: v } })); setMissing(m => m.filter(y => y !== n)); }} /></div>}
    </Panel>
    <div className="compare-grid">{sideCard("A", A, d.a, modelA, d.paramsA)}{sideCard("B", B, d.b, modelB, d.paramsB)}</div>
    {summary && <p className="compare-summary" role="status"><FlaskConical size={14} />{summary}</p>}
    <Panel title="Recent comparisons" description="Reopen any pair to restore its prompt, instructions and results." flush className="runs-panel">
      {groups.length ? <ul className="rows">{groups.map(g => { const a = g.find(r => r.side === "A"), b = g.find(r => r.side === "B"); const first = g[0];
        return <li key={first.compareId}><button className="row-btn" onClick={() => restore(g)}>
          <span className="row-main"><b>{(first.template ?? first.prompt).replace(/\s+/g, " ").slice(0, 90)}</b>
            <small>{a ? `A: ${a.model}, ${formatDuration(a.durationMs)}` : "A: not run"}   {b ? `B: ${b.model}, ${formatDuration(b.durationMs)}` : "B: not run"}</small></span>
          <span className="row-time">{relativeTime(first.createdAt)}</span></button></li>; })}</ul>
        : <EmptyState title="No comparisons yet" text="Run both approaches to start a history you can reopen later." />}
    </Panel>
  </div>;
}
