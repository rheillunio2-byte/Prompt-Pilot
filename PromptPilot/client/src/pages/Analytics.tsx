import { useMemo } from "react";
import { Gauge, Trash2 } from "lucide-react";
import { useApp } from "../lib/app";
import { useWorkspace } from "../lib/workspace";
import { RUN_LIMIT } from "../lib/storage";
import { formatDuration, formatTokens, relativeTime } from "../lib/format";
import { Button, EmptyState, PageHeader, Panel, useConfirm, useToast } from "../components/ui";

const DAY = 86_400_000;
const dayKey = (t: number) => { const d = new Date(t); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; };

export default function Analytics() {
  const app = useApp(); const ws = useWorkspace(); const confirm = useConfirm(); const toast = useToast();
  const runs = ws.runs;
  const data = useMemo(() => {
    const timed = runs.filter(r => r.durationMs > 0);
    const avg = timed.length ? timed.reduce((s, r) => s + r.durationMs, 0) / timed.length : 0;
    const withUsage = runs.filter(r => r.usage?.totalTokens !== undefined);
    const tokens = withUsage.reduce((s, r) => s + (r.usage?.totalTokens ?? 0), 0);
    const byModel = new Map<string, { n: number; ms: number; timed: number; tok: number; tokRuns: number }>();
    runs.forEach(r => { const m = byModel.get(r.model) ?? { n: 0, ms: 0, timed: 0, tok: 0, tokRuns: 0 }; m.n++; if (r.durationMs > 0) { m.ms += r.durationMs; m.timed++; } if (r.usage?.totalTokens !== undefined) { m.tok += r.usage.totalTokens; m.tokRuns++; } byModel.set(r.model, m); });
    const models = [...byModel.entries()].map(([model, m]) => ({ model, ...m })).sort((a, b) => b.n - a.n);
    const byPrompt = new Map<string, number>();
    runs.forEach(r => { if (r.promptId) byPrompt.set(r.promptId, (byPrompt.get(r.promptId) ?? 0) + 1); });
    const topPrompts = [...byPrompt.entries()].map(([id, n]) => ({ id, n, title: ws.prompts.find(p => p.id === id)?.title })).filter(x => x.title).sort((a, b) => b.n - a.n).slice(0, 5);
    const pairs = new Map<string, typeof runs>();
    runs.filter(r => r.compareId).forEach(r => pairs.set(r.compareId!, [...(pairs.get(r.compareId!) ?? []), r]));
    const completePairs = [...pairs.values()].filter(g => g.some(r => r.side === "A") && g.some(r => r.side === "B"));
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const days = Array.from({ length: 14 }, (_, i) => { const t = today.getTime() - (13 - i) * DAY; return { t, n: runs.filter(r => dayKey(Date.parse(r.createdAt)) === dayKey(t)).length }; });
    return { avg, tokens, tokenRuns: withUsage.length, models, topPrompts, pairs: [...pairs.values()].slice(0, 5), comparisons: completePairs.length, days, activeDays: days.filter(d => d.n > 0).length, saved: runs.filter(r => r.pinned) };
  }, [runs, ws.prompts]);

  const clear = async () => {
    if (await confirm({ title: "Clear experiment history?", body: "All runs are removed from this browser except saved experiments. Your prompts and versions are not affected.", confirmLabel: "Clear history", danger: true })) { ws.clearRuns(); toast("Experiment history cleared."); }
  };
  if (!runs.length) return <><PageHeader title="Analytics" description="Usage insights from your own experiments." />
    <EmptyState icon={<Gauge size={18} />} title="No experiment data yet" text="Run a prompt in the Playground or compare two approaches. Charts and totals will build from your real runs.">
      <Button variant="primary" onClick={() => app.navigate({ name: "playground" })}>Open Playground</Button><Button onClick={() => app.navigate({ name: "compare" })}>Open Compare Lab</Button></EmptyState></>;

  const max = Math.max(...data.days.map(d => d.n), 1);
  const W = 560, H = 120, bw = W / data.days.length;
  return <>
    <PageHeader title="Analytics" description={`Based on the ${runs.length} runs stored in this browser (the latest ${RUN_LIMIT} plus saved experiments).`} actions={<Button icon={<Trash2 size={14} />} onClick={clear}>Clear history</Button>} />
    <dl className="stat-row">
      <div><dd>{runs.length}</dd><dt>Experiments</dt></div><div><dd>{data.comparisons}</dd><dt>Comparisons</dt></div>
      <div><dd>{data.avg ? formatDuration(data.avg) : "–"}</dd><dt>Average run time</dt></div>
      <div><dd>{data.tokenRuns ? data.tokens.toLocaleString() : "–"}</dd><dt>{data.tokenRuns ? `Tokens (${data.tokenRuns} runs reported usage)` : "Tokens (not reported yet)"}</dt></div></dl>
    <div className="split">
      <div className="stack">
        <Panel title="Activity, last 14 days">
          {data.activeDays >= 2 ? <svg className="chart" viewBox={`0 0 ${W} ${H + 22}`} role="img" aria-label={`Runs per day over the last 14 days. Peak ${max} in one day.`}>
            {data.days.map((d, i) => { const h = d.n ? Math.max(3, (d.n / max) * H) : 1; return <g key={d.t}><title>{`${new Date(d.t).toLocaleDateString()}: ${d.n} run${d.n === 1 ? "" : "s"}`}</title>
              <rect x={i * bw + 4} y={H - h} width={bw - 8} height={h} rx="2" className={d.n ? "bar" : "bar-empty"} />
              {(i === 0 || i === 13 || i === 7) && <text x={i * bw + bw / 2} y={H + 16} textAnchor="middle">{new Date(d.t).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</text>}</g>; })}</svg>
            : <p className="muted-text">Runs happened on {data.activeDays} day so far. A timeline appears once you have activity on at least two different days.</p>}
        </Panel>
        <Panel title="Models" flush><div className="table-wrap"><table className="table is-compact"><thead><tr><th>Model</th><th className="num">Runs</th><th className="num">Average time</th><th className="num">Average tokens</th></tr></thead>
          <tbody>{data.models.map(m => <tr key={m.model}><td className="col-title"><b>{m.model}</b><span className="share"><i style={{ width: `${(m.n / runs.length) * 100}%` }} /></span></td><td className="num">{m.n}</td>
            <td className="num">{m.timed ? formatDuration(m.ms / m.timed) : "–"}</td><td className="num">{m.tokRuns ? formatTokens(Math.round(m.tok / m.tokRuns)) : "–"}</td></tr>)}</tbody></table></div></Panel>
        <Panel title="Comparison history" flush>{data.pairs.length ? <ul className="rows">{data.pairs.map(g => <li key={g[0].compareId}><button className="row-btn" onClick={() => app.navigate({ name: "compare" })}>
          <span className="row-main"><b>{(g[0].template ?? g[0].prompt).replace(/\s+/g, " ").slice(0, 90)}</b><small>{g.map(r => `${r.side ?? "?"}: ${r.model}, ${formatDuration(r.durationMs)}`).join("   ")}</small></span><span className="row-time">{relativeTime(g[0].createdAt)}</span></button></li>)}</ul>
          : <EmptyState title="No comparisons yet" text="Runs from Compare Lab are listed here." />}</Panel>
      </div>
      <div className="stack">
        <Panel title="Most-used prompts" description="Runs started from a library prompt" flush>{data.topPrompts.length ? <ul className="rows">{data.topPrompts.map(p => <li key={p.id}><button className="row-btn" onClick={() => app.navigate({ name: "editor", id: p.id })}>
          <span className="row-main"><b>{p.title}</b></span><span className="row-time">{p.n} run{p.n === 1 ? "" : "s"}</span></button></li>)}</ul>
          : <EmptyState title="Nothing to rank yet" text="Open a library prompt in the Playground and run it to see it here." />}</Panel>
        <Panel title="Saved experiments" description="Kept beyond the history limit" flush>{data.saved.length ? <ul className="rows">{data.saved.slice(0, 6).map(r => <li key={r.id}><button className="row-btn" onClick={() => app.runInPlayground({ text: r.template ?? r.prompt, values: r.values, promptId: r.promptId })}>
          <span className="row-main"><b>{(r.template ?? r.prompt).replace(/\s+/g, " ").slice(0, 70)}</b><small>{r.model}, {formatDuration(r.durationMs)}</small></span><span className="row-time">{relativeTime(r.createdAt)}</span></button></li>)}</ul>
          : <EmptyState title="None saved" text="Use “Save experiment” in the Playground to keep a run." />}</Panel>
      </div>
    </div>
  </>;
}
