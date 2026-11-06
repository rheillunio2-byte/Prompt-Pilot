import { useEffect, useMemo, useRef, useState } from "react";
import { Check, FlaskConical, History, Save, Star, Terminal, X } from "lucide-react";
import { useApp } from "../lib/app";
import { useWorkspace } from "../lib/workspace";
import { CATEGORIES, extractVariables, fullDate, relativeTime, resolveVariables, wordCount } from "../lib/format";
import { Badge, Button, EmptyState, Field, Input, PageHeader, Select, Tooltip, modKey, useToast } from "../components/ui";
import { PromptField, PromptPreview, VariableInputs } from "../components/PromptField";

export default function Editor({ id }: { id: string }) {
  const app = useApp(); const ws = useWorkspace(); const toast = useToast();
  const isNew = id === "new";
  const prompt = isNew ? undefined : ws.prompts.find(p => p.id === id);
  const seed = useRef(isNew ? app.takeSeed() : null).current;
  const [title, setTitle] = useState(prompt?.title ?? seed?.title ?? "");
  const [body, setBody] = useState(prompt?.body ?? seed?.body ?? "");
  const [category, setCategory] = useState(prompt?.category ?? seed?.category ?? "General");
  const [tags, setTags] = useState<string[]>(prompt?.tags ?? seed?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [triedSave, setTriedSave] = useState(false);

  const dirty = prompt
    ? title.trim() !== prompt.title || body !== prompt.body || category !== prompt.category || tags.join("\u0000") !== prompt.tags.join("\u0000")
    : Boolean(title.trim() || body.trim());
  useEffect(() => { app.setDirty(dirty); }, [dirty]);
  useEffect(() => () => app.setDirty(false), []);

  const saveRef = useRef<() => void>(() => {});
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") { e.preventDefault(); saveRef.current(); } };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, []);
  const names = useMemo(() => extractVariables(body), [body]);
  const versionCount = prompt ? ws.snapshots.filter(s => s.promptId === prompt.id).length + 1 : 0;
  const categories = CATEGORIES.includes(category) ? CATEGORIES : [...CATEGORIES, category];

  if (!isNew && !prompt) return <EmptyState title="Prompt not found" text="It may have been deleted. Its saved versions, if any, are still in Versions.">
    <Button onClick={() => app.navigate({ name: "library" })}>Back to library</Button><Button onClick={() => app.navigate({ name: "versions" })}>Open versions</Button></EmptyState>;

  const addTag = (raw: string) => {
    const t = raw.trim().toLowerCase().replace(/[,]+/g, "");
    if (t && !tags.includes(t) && tags.length < 8) setTags([...tags, t]);
    setTagInput("");
  };
  const valid = title.trim() && body.trim();
  const doSave = () => {
    setTriedSave(true);
    if (!valid) { toast("Add a title and some instructions before saving.", "error"); return; }
    const saved = ws.savePrompt({ id: prompt?.id, title, body, category, tags });
    toast("Prompt saved.");
    if (!prompt) { app.setDirty(false); app.navigate({ name: "editor", id: saved.id }, { replace: true }); }
  };
  saveRef.current = doSave;
  const status = !prompt ? "Not saved yet" : dirty ? "Unsaved changes" : `Saved ${relativeTime(prompt.updatedAt)}`;

  return <div>
    <PageHeader title={prompt ? "Edit prompt" : "New prompt"} description="Write instructions and mark reusable inputs with {{variables}}."
      actions={<>
        <span className={`save-status ${dirty ? "is-dirty" : ""}`} role="status">{!dirty && prompt ? <Check size={13} /> : <i className="dot dot-warn" />}{status}</span>
        {prompt && <Button icon={<History size={14} />} onClick={() => app.navigate({ name: "versions", id: prompt.id })}>History{versionCount > 1 ? ` (${versionCount})` : ""}</Button>}
        <Button icon={<Terminal size={14} />} disabled={!body.trim()} onClick={() => app.runInPlayground({ text: body, promptId: prompt?.id, values })}>Playground</Button>
        <Tooltip label={`${modKey}+S`}><Button variant="primary" icon={<Save size={14} />} onClick={doSave} disabled={!dirty && !!prompt}>Save</Button></Tooltip></>} />
    <div className="editor-layout">
      <section className="editor-main" aria-label="Prompt content">
        <input className="title-input" aria-label="Prompt title" placeholder="Untitled prompt" value={title} maxLength={120} onChange={e => setTitle(e.target.value)} aria-invalid={triedSave && !title.trim() || undefined} />
        <PromptField label="Prompt instructions" value={body} onChange={setBody} minHeight={360} autoFocus={isNew && !seed} placeholder={"Write your prompt here.\nUse {{variables}} for anything that changes between runs."} invalid={triedSave && !body.trim()} />
        <div className="editor-foot"><span>{wordCount(body)} words</span><span>{body.length.toLocaleString()} characters</span><span>{names.length} variable{names.length === 1 ? "" : "s"}</span></div>
      </section>
      <aside className="editor-side" aria-label="Prompt details">
        <section><h2>Details</h2>
          <Field label="Category" htmlFor="cat"><Select id="cat" value={category} onChange={e => setCategory(e.target.value)}>{categories.map(c => <option key={c}>{c}</option>)}</Select></Field>
          <Field label="Tags" hint="Press Enter or comma to add. Up to 8.">
            <div className="tag-input">{tags.map(t => <span className="tag tag-removable" key={t}>{t}<button type="button" aria-label={`Remove tag ${t}`} onClick={() => setTags(tags.filter(x => x !== t))}><X size={11} /></button></span>)}
              <input aria-label="Add tag" value={tagInput} placeholder={tags.length ? "" : "Add a tag"} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput); } else if (e.key === "Backspace" && !tagInput && tags.length) setTags(tags.slice(0, -1)); }} onBlur={() => addTag(tagInput)} /></div>
          </Field>
          {prompt && <Button size="sm" icon={<Star size={13} fill={prompt.favorite ? "currentColor" : "none"} />} aria-pressed={prompt.favorite} onClick={() => ws.toggleFavorite(prompt.id)}>{prompt.favorite ? "Favorited" : "Add to favorites"}</Button>}
          {prompt && <dl className="meta-list"><div><dt>Created</dt><dd>{fullDate(prompt.createdAt)}</dd></div><div><dt>Last saved</dt><dd>{fullDate(prompt.updatedAt)}</dd></div><div><dt>Versions</dt><dd>{versionCount}</dd></div></dl>}
        </section>
        <section><div className="side-head"><h2>Variables</h2><Badge tone={names.length ? "accent" : "neutral"}>{names.length}</Badge></div>
          {names.length ? <><p className="muted-text">Preview values only. They aren't saved with the prompt.</p>
            <VariableInputs names={names} values={values} onChange={(n, v) => setValues(s => ({ ...s, [n]: v }))} />
            {Object.values(values).some(v => v.trim()) && <details className="preview-details"><summary>Preview with values</summary><PromptPreview text={resolveVariables(body, Object.fromEntries(names.map(n => [n, values[n] || `{{${n}}}`])))} /></details>}
            <Button size="sm" icon={<FlaskConical size={13} />} onClick={() => app.openCompare({ base: body })}>Use in Compare Lab</Button></>
            : <p className="muted-text">No variables yet. Type <code>{"{{topic}}"}</code> in your prompt to create one.</p>}
        </section>
      </aside>
    </div>
  </div>;
}
