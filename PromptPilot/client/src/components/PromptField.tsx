import { useId, type KeyboardEventHandler } from "react";
import { VAR_RE } from "../lib/format";

/** A textarea with {{variable}} highlighting. The textarea is transparent and stacked over a mirror that paints the tokens. */
export function renderTokens(text: string) {
  const out: (string | JSX.Element)[] = [];
  let last = 0, i = 0;
  for (const m of text.matchAll(VAR_RE)) {
    const at = m.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    out.push(<mark key={i++} className="var">{m[0]}</mark>);
    last = at + m[0].length;
  }
  out.push(text.slice(last));
  return out;
}

export function PromptField({ value, onChange, placeholder, minHeight = 160, label, autoFocus, onKeyDown, invalid }: {
  value: string; onChange: (v: string) => void; placeholder?: string; minHeight?: number; label: string;
  autoFocus?: boolean; onKeyDown?: KeyboardEventHandler<HTMLTextAreaElement>; invalid?: boolean;
}) {
  const id = useId();
  return <div className={`pf ${invalid ? "is-invalid" : ""}`} style={{ minHeight }}>
    <div className="pf-mirror" aria-hidden>{renderTokens(value)}{"\n"}</div>
    <textarea id={id} aria-label={label} className="pf-input" value={value} placeholder={placeholder} autoFocus={autoFocus} spellCheck={false}
      onChange={e => onChange(e.target.value)} onKeyDown={onKeyDown} />
  </div>;
}

export function PromptPreview({ text, className = "" }: { text: string; className?: string }) {
  return <pre className={`prompt-preview ${className}`}>{renderTokens(text)}</pre>;
}

export function VariableInputs({ names, values, onChange, missing = [] }: { names: string[]; values: Record<string, string>; onChange: (name: string, v: string) => void; missing?: string[] }) {
  if (!names.length) return null;
  return <div className="var-grid">{names.map(n => <label key={n} className={`var-field ${missing.includes(n) ? "is-missing" : ""}`}>
    <span className="var-name">{`{{${n}}}`}</span>
    <textarea rows={1} value={values[n] ?? ""} placeholder={`Value for ${n}`} onChange={e => onChange(n, e.target.value)} aria-invalid={missing.includes(n) || undefined} />
  </label>)}</div>;
}
