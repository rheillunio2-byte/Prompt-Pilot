import { useMemo, useState } from "react";
import { ArrowUpRight, Eye, History, RotateCcw } from "lucide-react";
import { useApp } from "../lib/app";
import { versionsFor, useWorkspace, type VersionEntry } from "../lib/workspace";
import { fullDate, lineDiff, relativeTime } from "../lib/format";
import { Badge, Button, Dialog, EmptyState, PageHeader, Select, useConfirm, useToast } from "../components/ui";
import { PromptPreview } from "../components/PromptField";

export default function Versions({ promptId }: { promptId?: string }) {
  const app = useApp(); const ws = useWorkspace(); const toast = useToast(); const confirm = useConfirm();
  const [filter, setFilter] = useState(promptId ?? "");
  const [preview, setPreview] = useState<{ groupId: string; v: VersionEntry } | null>(null);

  const groups = useMemo(() => {
    const ids = [...new Set([...ws.prompts.map(p => p.id), ...ws.snapshots.map(s => s.promptId)])];
    return ids.map(id => {
      const prompt = ws.prompts.find(p => p.id === id);
      const vs = versionsFor(id, prompt, ws.snapshots);
      return { id, prompt, vs, hasHistory: vs.some(v => !v.current), name: prompt?.title ?? vs[0]?.title ?? "Untitled prompt" };
    }).filter(g => g.vs.length && (filter ? g.id === filter : g.hasHistory))
      .sort((a, b) => Date.parse(b.vs[0].at) - Date.parse(a.vs[0].at));
  }, [ws.prompts, ws.snapshots, filter]);
  const selectable = useMemo(() => {
    const ids = new Set(ws.snapshots.map(s => s.promptId));
    return [...ids].map(id => ({ id, name: ws.prompts.find(p => p.id === id)?.title ?? ws.snapshots.find(s => s.promptId === id)?.title ?? "Untitled prompt" })).sort((a, b) => a.name.localeCompare(b.name));
  }, [ws.prompts, ws.snapshots]);

  const restore = async (groupId: string, v: VersionEntry) => {
    if (!v.snapshotId) return;
    const live = ws.prompts.some(p => p.id === groupId);
    const ok = await confirm({
      title: live ? `Restore version ${v.number}?` : "Restore as a new prompt?",
      body: live ? "The current text is saved as a new version first, so you can always come back to it." : "The original prompt was deleted, so this version will be added to your library as a new prompt.",
      confirmLabel: live ? "Restore version" : "Create prompt"
    });
    if (!ok) return;
    const p = ws.restoreSnapshot(v.snapshotId, "in-place");
    setPreview(null);
    if (p) { toast(live ? `Restored version ${v.number}.` : "Prompt restored to your library."); if (!live) app.navigate({ name: "editor", id: p.id }); }
  };

  return <>
    <PageHeader title="Versions" description="Every time you save changes to a prompt, the previous text is kept here."
      actions={selectable.length > 0 && <Select aria-label="Filter by prompt" value={filter} onChange={e => setFilter(e.target.value)}><option value="">All prompts with history</option>{selectable.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>} />
    {groups.length === 0 ? <EmptyState icon={<History size={18} />} title="No version history yet" text="Edit and save an existing prompt and its earlier text will appear here.">
      <Button onClick={() => app.navigate({ name: "library" })}>Open library</Button></EmptyState> :
      <div className="stack">{groups.map(g => <section className="panel" key={g.id} aria-label={g.name}>
        <header className="panel-head"><div><h2>{g.name}</h2><p>{g.hasHistory ? `${g.vs.length} versions` : "No earlier versions yet. Saved changes will appear here."}{!g.prompt && "  This prompt was deleted."}</p></div>
          <div className="panel-actions">{!g.prompt && <Badge tone="warn">Deleted</Badge>}{g.prompt && <Button size="sm" variant="ghost" icon={<ArrowUpRight size={13} />} onClick={() => app.navigate({ name: "editor", id: g.id })}>Open prompt</Button>}</div></header>
        <ol className="timeline">{g.vs.map((v, i) => {
          const older = g.vs[i + 1];
          const diff = older ? lineDiff(older.body, v.body) : null;
          const notes = [older ? (diff && (diff.added || diff.removed) ? `+${diff.added} −${diff.removed} lines` : older.body === v.body ? "" : "Wording changed") : "Earliest saved version", older && older.title !== v.title ? "Renamed" : "", older && older.category !== v.category ? "Category changed" : ""].filter(Boolean);
          return <li key={v.key} className={v.current ? "is-current" : ""}>
            <span className="tl-dot" aria-hidden />
            <div className="tl-main"><div className="tl-title"><b>Version {v.number}</b>{v.current && <Badge tone="accent">Current</Badge>}<span className="tl-time" title={fullDate(v.at)}>{relativeTime(v.at)}</span></div>
              <p className="tl-notes">{notes.join(", ") || "No text changes"}</p><p className="tl-excerpt">{v.body.replace(/\s+/g, " ").slice(0, 140)}</p></div>
            <div className="tl-actions"><Button size="sm" icon={<Eye size={13} />} onClick={() => setPreview({ groupId: g.id, v })}>Preview</Button>
              {!v.current && <Button size="sm" icon={<RotateCcw size={13} />} onClick={() => restore(g.id, v)}>{g.prompt ? "Restore" : "Restore as new"}</Button>}</div>
          </li>; })}</ol>
      </section>)}</div>}
    <Dialog open={!!preview} onClose={() => setPreview(null)} size="lg" title={preview ? `${preview.v.title}, version ${preview.v.number}` : ""} description={preview ? `${fullDate(preview.v.at)}  ${preview.v.category}` : undefined}
      footer={preview && <><Button onClick={() => setPreview(null)}>Close</Button>{!preview.v.current && <Button variant="primary" icon={<RotateCcw size={14} />} onClick={() => restore(preview.groupId, preview.v)}>{ws.prompts.some(p => p.id === preview.groupId) ? "Restore this version" : "Restore as new prompt"}</Button>}</>}>
      {preview && <PromptPreview text={preview.v.body} />}
    </Dialog>
  </>;
}
