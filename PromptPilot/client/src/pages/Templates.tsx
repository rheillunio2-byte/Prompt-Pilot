import { useMemo, useState } from "react";
import { Layers3, Plus } from "lucide-react";
import { useApp } from "../lib/app";
import { TEMPLATES, TEMPLATE_CATEGORIES } from "../lib/templates";
import { extractVariables } from "../lib/format";
import { Badge, Button, EmptyState, PageHeader } from "../components/ui";
import { PromptPreview } from "../components/PromptField";

export default function Templates() {
  const app = useApp();
  const [cat, setCat] = useState<string>("All");
  const list = useMemo(() => TEMPLATES.filter(t => cat === "All" || t.category === cat), [cat]);
  const [sel, setSel] = useState<string>(TEMPLATES[0].id);
  const current = list.find(t => t.id === sel) ?? list[0];
  const use = () => current && app.newPrompt({ title: current.title, body: current.body, category: current.category, tags: current.tags });
  return <>
    <PageHeader title="Templates" description="Start from a proven structure, then make it yours." />
    <div className="tpl-layout">
      <nav className="tpl-cats" aria-label="Template categories">
        {["All", ...TEMPLATE_CATEGORIES].map(c => <button key={c} className={cat === c ? "is-active" : ""} aria-pressed={cat === c} onClick={() => setCat(c)}>
          <span>{c}</span><small>{c === "All" ? TEMPLATES.length : TEMPLATES.filter(t => t.category === c).length}</small></button>)}
      </nav>
      <ul className="tpl-list" aria-label="Templates">{list.map(t => <li key={t.id}><button className={current?.id === t.id ? "is-active" : ""} onClick={() => setSel(t.id)}>
        <b>{t.title}</b><span>{t.summary}</span></button></li>)}</ul>
      <section className="tpl-preview" aria-label="Template preview">
        {current ? <>
          <header><div><h2>{current.title}</h2><p>{current.summary}</p></div><Button variant="primary" icon={<Plus size={14} />} onClick={use}>Use template</Button></header>
          <div className="tpl-meta"><Badge tone="accent">{current.category}</Badge>{current.tags.map(t => <Badge key={t}>{t}</Badge>)}
            <span>{extractVariables(current.body).length} variables</span></div>
          <PromptPreview text={current.body} />
        </> : <EmptyState icon={<Layers3 size={18} />} title="No templates" text="Pick another category." />}
      </section>
    </div>
  </>;
}
