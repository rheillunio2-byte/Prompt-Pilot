import { useMemo, useState } from "react";
import {
  ArrowUpDown, BookOpen, CopyPlus, Copy, Download, FlaskConical, History, Layers3, Pencil, Plus, Rows3, Search, Star, Table2, Terminal, Trash2, Upload, X
} from "lucide-react";
import { useApp } from "../lib/app";
import { useWorkspace } from "../lib/workspace";
import { useImporter } from "../lib/importer";
import { useMedia } from "../lib/hooks";
import { KEYS, load, save } from "../lib/storage";
import { extractVariables, fullDate, relativeTime, wordCount } from "../lib/format";
import type { Prompt } from "../types";
import { Badge, Button, EmptyState, IconButton, Input, Menu, PageHeader, Select, Tabs, useConfirm, useContextMenu, useToast, type MenuItem } from "../components/ui";
import { PromptPreview } from "../components/PromptField";

type View = "table" | "list"; type Sort = "updated" | "title" | "category";
const PREFS = "pp-library-prefs";

function Row({ p, view, selected, onSelect, onOpen, onFavorite, items }: {
  p: Prompt; view: View; selected: boolean; onSelect: () => void; onOpen: () => void; onFavorite: () => void; items: MenuItem[];
}) {
  const { onContextMenu, menu } = useContextMenu(items);
  const vars = extractVariables(p.body).length;
  const move = (e: React.KeyboardEvent<HTMLTableRowElement>) => {
    if (e.key === "Enter") { e.preventDefault(); onOpen(); }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = (e.key === "ArrowDown" ? e.currentTarget.nextElementSibling : e.currentTarget.previousElementSibling) as HTMLElement | null;
      next?.focus();
    }
  };
  return <><tr tabIndex={0} className={selected ? "is-selected" : ""} onClick={onSelect} onDoubleClick={onOpen} onKeyDown={move} onFocus={onSelect} onContextMenu={onContextMenu} data-prompt={p.id}>
    <td className="col-fav"><IconButton label={p.favorite ? "Remove from favorites" : "Add to favorites"} className={p.favorite ? "fav-on" : ""} onClick={e => { e.stopPropagation(); onFavorite(); }}>
      <Star size={15} fill={p.favorite ? "currentColor" : "none"} /></IconButton></td>
    <td className="col-title"><b>{p.title}</b>{view === "table" && <small>{p.body.replace(/\s+/g, " ").slice(0, 110)}</small>}</td>
    <td className="col-cat"><Badge>{p.category}</Badge></td>
    <td className="col-tags">{p.tags.slice(0, 2).map(t => <span key={t} className="tag">{t}</span>)}{p.tags.length > 2 && <span className="tag">+{p.tags.length - 2}</span>}</td>
    <td className="col-vars num">{vars || "–"}</td>
    <td className="col-time" title={fullDate(p.updatedAt)}>{relativeTime(p.updatedAt)}</td>
    <td className="col-menu" onClick={e => e.stopPropagation()}><Menu items={items} label={`Actions for ${p.title}`} /></td>
  </tr>{menu}</>;
}

export default function Library() {
  const app = useApp(); const ws = useWorkspace(); const toast = useToast(); const confirm = useConfirm(); const importer = useImporter();
  const wide = useMedia("(min-width: 1100px)");
  const stored = load<{ view?: View; sort?: Sort }>(PREFS, {});
  const [view, setViewState] = useState<View>(stored.view ?? "table");
  const [sort, setSortState] = useState<Sort>(stored.sort ?? "updated");
  const setView = (v: View) => { setViewState(v); save(PREFS, { view: v, sort }); };
  const setSort = (s: Sort) => { setSortState(s); save(PREFS, { view, sort: s }); };
  const [query, setQuery] = useState(""); const [category, setCategory] = useState("all"); const [tag, setTag] = useState("all"); const [favOnly, setFavOnly] = useState(false);
  const [selId, setSelId] = useState<string | null>(null);

  const categories = useMemo(() => [...new Set(ws.prompts.map(p => p.category))].sort(), [ws.prompts]);
  const tags = useMemo(() => [...new Set(ws.prompts.flatMap(p => p.tags))].sort(), [ws.prompts]);
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out = ws.prompts.filter(p => (category === "all" || p.category === category) && (tag === "all" || p.tags.includes(tag)) && (!favOnly || p.favorite)
      && (!q || `${p.title} ${p.body} ${p.category} ${p.tags.join(" ")}`.toLowerCase().includes(q)));
    return out.sort((a, b) => sort === "title" ? a.title.localeCompare(b.title) : sort === "category" ? a.category.localeCompare(b.category) || a.title.localeCompare(b.title) : Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  }, [ws.prompts, query, category, tag, favOnly, sort]);
  const filtering = query || category !== "all" || tag !== "all" || favOnly;
  const clear = () => { setQuery(""); setCategory("all"); setTag("all"); setFavOnly(false); };
  const selected = list.find(p => p.id === selId) ?? null;

  const open = (p: Prompt) => app.navigate({ name: "editor", id: p.id });
  const remove = async (p: Prompt) => {
    if (await confirm({ title: `Delete “${p.title}”?`, body: "The prompt is removed from your library. Its saved versions stay in Versions, where you can restore them.", confirmLabel: "Delete prompt", danger: true })) {
      ws.deletePrompt(p.id); toast("Prompt deleted."); if (selId === p.id) setSelId(null);
    }
  };
  const itemsFor = (p: Prompt): MenuItem[] => [
    { label: "Open", icon: <Pencil size={14} />, shortcut: "↵", onSelect: () => open(p) },
    { label: "Run in Playground", icon: <Terminal size={14} />, onSelect: () => app.runInPlayground({ text: p.body, promptId: p.id }) },
    { label: "Use in Compare Lab", icon: <FlaskConical size={14} />, onSelect: () => app.openCompare({ base: p.body }) },
    "separator",
    { label: p.favorite ? "Remove from favorites" : "Add to favorites", icon: <Star size={14} />, onSelect: () => ws.toggleFavorite(p.id) },
    { label: "Duplicate", icon: <CopyPlus size={14} />, onSelect: () => { ws.duplicatePrompt(p.id); toast("Prompt duplicated."); } },
    { label: "Copy prompt text", icon: <Copy size={14} />, onSelect: () => navigator.clipboard.writeText(p.body).then(() => toast("Copied to clipboard."), () => toast("Couldn't copy to the clipboard.", "error")) },
    { label: "Version history", icon: <History size={14} />, onSelect: () => app.navigate({ name: "versions", id: p.id }) },
    "separator",
    { label: "Delete…", icon: <Trash2 size={14} />, danger: true, onSelect: () => remove(p) }
  ];

  return <>
    {importer.input}
    <PageHeader title="Library" description={`${ws.prompts.length} saved prompt${ws.prompts.length === 1 ? "" : "s"}`}
      actions={<><Menu align="end" label="Backup options" items={[
        { label: "Export backup", icon: <Download size={14} />, onSelect: ws.exportBackup }, { label: "Import backup", icon: <Upload size={14} />, onSelect: importer.pick }]} />
        <Button variant="primary" icon={<Plus size={14} />} onClick={() => app.newPrompt()}>New prompt</Button></>} />
    {ws.prompts.length === 0 ? <EmptyState icon={<BookOpen size={18} />} title="Your library is empty" text="Save prompts here to reuse, version and test them. Start from scratch, a template, or a backup.">
      <Button variant="primary" onClick={() => app.newPrompt()}>New prompt</Button>
      <Button icon={<Layers3 size={14} />} onClick={() => app.navigate({ name: "templates" })}>Browse templates</Button>
      <Button icon={<Upload size={14} />} onClick={importer.pick}>Import backup</Button></EmptyState> : <>
      <div className="toolbar" role="search">
        <div className="search-field"><Search size={14} /><Input aria-label="Search prompts" placeholder="Search titles, content, tags" value={query} onChange={e => setQuery(e.target.value)} />
          {query && <IconButton label="Clear search" onClick={() => setQuery("")}><X size={14} /></IconButton>}</div>
        <Select aria-label="Category" value={category} onChange={e => setCategory(e.target.value)}><option value="all">All categories</option>{categories.map(c => <option key={c}>{c}</option>)}</Select>
        {tags.length > 0 && <Select aria-label="Tag" value={tag} onChange={e => setTag(e.target.value)}><option value="all">All tags</option>{tags.map(t => <option key={t}>{t}</option>)}</Select>}
        <Button variant={favOnly ? "primary" : "secondary"} aria-pressed={favOnly} icon={<Star size={14} fill={favOnly ? "currentColor" : "none"} />} onClick={() => setFavOnly(v => !v)}>Favorites</Button>
        <span className="toolbar-spacer" />
        <label className="sort-field"><ArrowUpDown size={14} /><Select aria-label="Sort by" value={sort} onChange={e => setSort(e.target.value as Sort)}>
          <option value="updated">Recently updated</option><option value="title">Title</option><option value="category">Category</option></Select></label>
        <Tabs label="Layout" value={view} onChange={setView} items={[{ value: "table", icon: <Table2 size={14} />, title: "Table view" }, { value: "list", icon: <Rows3 size={14} />, title: "Compact list view" }]} />
      </div>
      <div className={`lib-layout ${wide && selected ? "has-preview" : ""}`}>
        {list.length === 0 ? <EmptyState icon={<Search size={18} />} title="No prompts match" text="Try different words or remove a filter."><Button onClick={clear}>Clear filters</Button></EmptyState> :
          <div className="table-wrap"><table className={`table ${view === "list" ? "is-compact" : ""}`}>
            <thead><tr><th className="col-fav"><span className="sr-only">Favorite</span></th><th>Title</th><th className="col-cat">Category</th><th className="col-tags">Tags</th><th className="col-vars num">Vars</th><th className="col-time">Updated</th><th className="col-menu"><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>{list.map(p => <Row key={p.id} p={p} view={view} selected={wide && selId === p.id} items={itemsFor(p)}
              onSelect={() => wide ? setSelId(p.id) : open(p)} onOpen={() => open(p)} onFavorite={() => ws.toggleFavorite(p.id)} />)}</tbody>
          </table>{filtering && <p className="table-foot">{list.length} of {ws.prompts.length} shown</p>}</div>}
        {wide && selected && <aside className="lib-preview" aria-label="Prompt preview">
          <header><h2>{selected.title}</h2><IconButton label="Close preview" onClick={() => setSelId(null)}><X size={14} /></IconButton></header>
          <div className="tpl-meta"><Badge tone="accent">{selected.category}</Badge>{selected.tags.map(t => <Badge key={t}>{t}</Badge>)}</div>
          <dl className="meta-list"><div><dt>Updated</dt><dd>{fullDate(selected.updatedAt)}</dd></div><div><dt>Length</dt><dd>{wordCount(selected.body)} words</dd></div><div><dt>Variables</dt><dd>{extractVariables(selected.body).join(", ") || "None"}</dd></div></dl>
          <PromptPreview text={selected.body} />
          <div className="preview-actions"><Button variant="primary" onClick={() => open(selected)}>Open</Button>
            <Button icon={<Terminal size={14} />} onClick={() => app.runInPlayground({ text: selected.body, promptId: selected.id })}>Playground</Button></div>
        </aside>}
      </div></>}
  </>;
}
