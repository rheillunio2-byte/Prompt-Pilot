import { useMemo } from "react";
import { ArrowUpRight, BookOpen, FilePlus2, FlaskConical, Layers3, Star, Terminal } from "lucide-react";
import { useApp } from "../lib/app";
import { useWorkspace } from "../lib/workspace";
import { formatDuration, relativeTime } from "../lib/format";
import { Badge, Button, EmptyState, PageHeader, Panel } from "../components/ui";

type Activity = { id: string; at: string; text: string; detail?: string; go: () => void };

export default function Overview() {
  const app = useApp(); const { prompts, snapshots, runs } = useWorkspace();
  const hour = new Date().getHours();
  const greeting = hour < 5 ? "Working late" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const comparisons = new Set(runs.filter(r => r.compareId).map(r => r.compareId)).size;
  const recent = useMemo(() => [...prompts].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, 5), [prompts]);
  const favorites = prompts.filter(p => p.favorite).slice(0, 5);

  const activity = useMemo<Activity[]>(() => {
    const titleOf = (id?: string) => prompts.find(p => p.id === id)?.title;
    const items: Activity[] = [
      ...prompts.map(p => ({ id: `p${p.id}`, at: p.updatedAt, text: `Edited “${p.title}”`, detail: p.category, go: () => app.navigate({ name: "editor", id: p.id }) })),
      ...snapshots.map(s => ({ id: `s${s.id}`, at: s.createdAt, text: `Saved a version of “${titleOf(s.promptId) ?? s.title}”`, go: () => app.navigate({ name: "versions", id: s.promptId || undefined }) })),
      ...runs.map(r => ({ id: `r${r.id}`, at: r.createdAt, text: r.kind === "compare" ? `Compared approach ${r.side ?? ""} on ${r.model}`.replace("  ", " ") : `Ran a prompt on ${r.model}`, detail: formatDuration(r.durationMs), go: () => app.navigate({ name: r.kind === "compare" ? "compare" : "playground" }) }))
    ];
    return items.sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, 8);
  }, [prompts, snapshots, runs, app]);

  const stats: [string, number][] = [["Prompts", prompts.length], ["Experiments", runs.length], ["Comparisons", comparisons], ["Saved versions", snapshots.length]];
  return <>
    <PageHeader title={greeting} description="Pick up where you left off, or start something new."
      actions={<><Button icon={<Terminal size={14} />} onClick={() => app.navigate({ name: "playground" })}>Playground</Button>
        <Button icon={<FlaskConical size={14} />} onClick={() => app.navigate({ name: "compare" })}>Compare Lab</Button>
        <Button variant="primary" icon={<FilePlus2 size={14} />} onClick={() => app.newPrompt()}>New prompt</Button></>} />
    <dl className="stat-row">{stats.map(([label, n]) => <div key={label}><dd>{n}</dd><dt>{label}</dt></div>)}</dl>
    <div className="split">
      <div className="stack">
        <Panel title="Recently edited" actions={<Button size="sm" variant="ghost" onClick={() => app.navigate({ name: "library" })}>Open library</Button>} flush>
          {recent.length ? <ul className="rows">{recent.map(p => <li key={p.id}><button className="row-btn" onClick={() => app.navigate({ name: "editor", id: p.id })}>
            <span className="row-main"><b>{p.title}</b><small>{p.body.replace(/\s+/g, " ").slice(0, 90)}</small></span>
            <Badge>{p.category}</Badge><span className="row-time">{relativeTime(p.updatedAt)}</span></button></li>)}</ul>
            : <EmptyState icon={<BookOpen size={18} />} title="No prompts yet" text="Write your first prompt or start from a template.">
              <Button variant="primary" onClick={() => app.newPrompt()}>New prompt</Button><Button icon={<Layers3 size={14} />} onClick={() => app.navigate({ name: "templates" })}>Browse templates</Button></EmptyState>}
        </Panel>
        <Panel title="Recent activity" description="Changes and runs, newest first" flush>
          {activity.length ? <ul className="rows">{activity.map(a => <li key={a.id}><button className="row-btn" onClick={a.go}>
            <span className="row-main"><b>{a.text}</b>{a.detail && <small>{a.detail}</small>}</span><span className="row-time">{relativeTime(a.at)}</span></button></li>)}</ul>
            : <EmptyState title="Nothing here yet" text="Edits, saved versions and experiment runs will appear here." />}
        </Panel>
      </div>
      <div className="stack">
        <Panel title="Favorites" flush>
          {favorites.length ? <ul className="rows">{favorites.map(p => <li key={p.id}><button className="row-btn" onClick={() => app.navigate({ name: "editor", id: p.id })}>
            <Star size={14} className="star-on" fill="currentColor" /><span className="row-main"><b>{p.title}</b></span><ArrowUpRight size={14} className="row-go" /></button></li>)}</ul>
            : <EmptyState title="No favorites" text="Star a prompt in the library to pin it here." />}
        </Panel>
        <Panel title="Jump in">
          <div className="quick-list">
            <button onClick={() => app.navigate({ name: "playground" })}><Terminal size={16} /><span><b>Playground</b><small>Run a prompt and inspect the output</small></span></button>
            <button onClick={() => app.navigate({ name: "compare" })}><FlaskConical size={16} /><span><b>Compare Lab</b><small>Test two approaches side by side</small></span></button>
            <button onClick={() => app.navigate({ name: "templates" })}><Layers3 size={16} /><span><b>Templates</b><small>Start from a proven structure</small></span></button>
          </div>
        </Panel>
      </div>
    </div>
  </>;
}
