import {
  createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState,
  type ButtonHTMLAttributes, type ReactNode, type Ref
} from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Check, ChevronDown, Info, MoreHorizontal, X } from "lucide-react";
import { modKey } from "../lib/hooks";

/* ---------- Buttons ---------- */
type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger"; size?: "sm" | "md"; icon?: ReactNode; loading?: boolean;
};
export function Button({ variant = "secondary", size = "md", icon, loading, children, className = "", disabled, ...rest }: BtnProps) {
  return <button type="button" {...rest} disabled={disabled || loading} className={`btn btn-${variant} btn-${size} ${className}`}>
    {loading ? <span className="spinner" aria-hidden /> : icon}{children}
  </button>;
}
export function IconButton({ label, children, active, className = "", ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; active?: boolean }) {
  return <Tooltip label={label}><button type="button" aria-label={label} {...rest} className={`icon-btn ${active ? "is-active" : ""} ${className}`}>{children}</button></Tooltip>;
}
export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  return <span className="tip" data-tip={label}>{children}</span>;
}
export const Kbd = ({ children }: { children: ReactNode }) => <kbd className="kbd">{children}</kbd>;
export const Spinner = () => <span className="spinner" role="status" aria-label="Loading" />;
export function Skeleton({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden>{Array.from({ length: lines }, (_, i) => <span key={i} style={{ width: `${i === lines - 1 ? 55 : 100 - ((i * 7) % 18)}%` }} />)}</div>;
}

/* ---------- Form controls ---------- */
export function Field({ label, hint, error, children, htmlFor }: { label: string; hint?: ReactNode; error?: string; children: ReactNode; htmlFor?: string }) {
  return <div className="field"><label className="field-label" htmlFor={htmlFor}>{label}</label>{children}{error ? <p className="field-error">{error}</p> : hint ? <p className="field-hint">{hint}</p> : null}</div>;
}
export function Input({ className = "", invalid, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return <input {...rest} aria-invalid={invalid || undefined} className={`input ${className}`} />;
}
export function Select({ className = "", children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <span className={`select ${className}`}><select {...rest}>{children}</select><ChevronDown size={14} aria-hidden /></span>;
}
export type BadgeTone = "neutral" | "accent" | "success" | "warn" | "danger" | "b";
export const Badge = ({ tone = "neutral", children, title }: { tone?: BadgeTone; children: ReactNode; title?: string }) => <span title={title} className={`badge badge-${tone}`}>{children}</span>;

export function Tabs<T extends string>({ value, onChange, items, label }: { value: T; onChange: (v: T) => void; items: { value: T; label?: string; icon?: ReactNode; title?: string }[]; label: string }) {
  return <div className="tabs" role="tablist" aria-label={label}>{items.map(i =>
    <button key={i.value} role="tab" type="button" aria-selected={value === i.value} aria-label={i.title ?? i.label} title={i.title}
      className={`tab ${value === i.value ? "is-active" : ""}`} onClick={() => onChange(i.value)}>{i.icon}{i.label}</button>)}</div>;
}

/* ---------- Layout ---------- */
export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return <div className="page-header"><div><h1>{title}</h1>{description && <p>{description}</p>}</div>{actions && <div className="page-actions">{actions}</div>}</div>;
}
export function Panel({ title, description, actions, children, className = "", flush }: { title?: ReactNode; description?: string; actions?: ReactNode; children: ReactNode; className?: string; flush?: boolean }) {
  return <section className={`panel ${className}`}>
    {(title || actions) && <header className="panel-head"><div>{title && <h2>{title}</h2>}{description && <p>{description}</p>}</div>{actions && <div className="panel-actions">{actions}</div>}</header>}
    <div className={flush ? "" : "panel-body"}>{children}</div>
  </section>;
}
export function EmptyState({ icon, title, text, children }: { icon?: ReactNode; title: string; text: string; children?: ReactNode }) {
  return <div className="empty">{icon && <span className="empty-icon">{icon}</span>}<h3>{title}</h3><p>{text}</p>{children && <div className="empty-actions">{children}</div>}</div>;
}

/* ---------- Overlays ---------- */
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function Dialog({ open, onClose, title, description, children, footer, size = "md" }: {
  open: boolean; onClose: () => void; title: string; description?: string; children: ReactNode; footer?: ReactNode; size?: "sm" | "md" | "lg";
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const node = ref.current;
    const first = node?.querySelector<HTMLElement>("[data-autofocus]") ?? node?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? node)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); return; }
      if (e.key !== "Tab" || !node) return;
      const items = [...node.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (!items.length) return;
      const firstEl = items[0], lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
    };
    document.addEventListener("keydown", onKey, true);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey, true); document.body.style.overflow = ""; previous?.focus?.(); };
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} className={`dialog dialog-${size}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}>
        <header className="dialog-head"><div><h2>{title}</h2>{description && <p>{description}</p>}</div>
          <IconButton label="Close" onClick={onClose}><X size={16} /></IconButton></header>
        <div className="dialog-body">{children}</div>
        {footer && <footer className="dialog-foot">{footer}</footer>}
      </div>
    </div>, document.body);
}

type ConfirmOptions = { title: string; body: ReactNode; confirmLabel?: string; danger?: boolean };
const ConfirmCtx = createContext<(o: ConfirmOptions) => Promise<boolean>>(() => Promise.resolve(false));
export const useConfirm = () => useContext(ConfirmCtx);
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);
  const confirm = useCallback((o: ConfirmOptions) => new Promise<boolean>(resolve => setState({ ...o, resolve })), []);
  const close = (v: boolean) => { state?.resolve(v); setState(null); };
  return <ConfirmCtx.Provider value={confirm}>{children}
    <Dialog open={!!state} onClose={() => close(false)} title={state?.title ?? ""} size="sm"
      footer={<><Button onClick={() => close(false)}>Cancel</Button>
        <Button variant={state?.danger ? "danger" : "primary"} data-autofocus onClick={() => close(true)}>{state?.confirmLabel ?? "Confirm"}</Button></>}>
      <p className="muted-text">{state?.body}</p>
    </Dialog></ConfirmCtx.Provider>;
}

/* ---------- Toasts ---------- */
type Tone = "success" | "error" | "info";
type ToastItem = { id: number; message: string; tone: Tone };
const ToastCtx = createContext<(message: string, tone?: Tone) => void>(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);
  const push = useCallback((message: string, tone: Tone = "success") => {
    const id = ++seq.current;
    setItems(l => [...l.slice(-3), { id, message, tone }]);
    window.setTimeout(() => setItems(l => l.filter(t => t.id !== id)), tone === "error" ? 6000 : 2600);
  }, []);
  return <ToastCtx.Provider value={push}>{children}
    <div className="toasts" role="status" aria-live="polite">{items.map(t => <div key={t.id} className={`toast toast-${t.tone}`}>
      {t.tone === "success" ? <Check size={14} /> : t.tone === "error" ? <AlertTriangle size={14} /> : <Info size={14} />}<span>{t.message}</span></div>)}</div>
  </ToastCtx.Provider>;
}

/* ---------- Popover, menus ---------- */
export type MenuItem = { label: string; icon?: ReactNode; onSelect: () => void; danger?: boolean; shortcut?: string; disabled?: boolean } | "separator";

function useClamp(open: boolean, x: number, y: number, deps: unknown[]) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x, top: y });
  useLayoutEffect(() => {
    if (!open || !ref.current) return;
    const r = ref.current.getBoundingClientRect(), pad = 8;
    setPos({ left: Math.max(pad, Math.min(x, window.innerWidth - r.width - pad)), top: Math.max(pad, Math.min(y, window.innerHeight - r.height - pad)) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, x, y, ...deps]);
  return { ref, pos };
}

function useDismiss(open: boolean, onClose: () => void, ref: React.RefObject<HTMLElement>) {
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); onClose(); } };
    const away = () => onClose();
    document.addEventListener("mousedown", down); document.addEventListener("keydown", key, true);
    window.addEventListener("resize", away); window.addEventListener("scroll", away, true);
    return () => { document.removeEventListener("mousedown", down); document.removeEventListener("keydown", key, true); window.removeEventListener("resize", away); window.removeEventListener("scroll", away, true); };
  }, [open, onClose, ref]);
}

export function Popover({ renderTrigger, children, align = "start", className = "" }: {
  renderTrigger: (p: { onClick: () => void; ref: Ref<HTMLSpanElement>; open: boolean }) => ReactNode;
  children: (close: () => void) => ReactNode; align?: "start" | "end"; className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState({ x: 0, y: 0, right: 0 });
  const wrap = useRef<HTMLSpanElement>(null);
  const close = useCallback(() => setOpen(false), []);
  const toggle = () => {
    const r = wrap.current?.getBoundingClientRect();
    if (r) setAnchor({ x: r.left, y: r.bottom + 6, right: r.right });
    setOpen(o => !o);
  };
  const { ref, pos } = useClamp(open, align === "end" ? anchor.right : anchor.x, anchor.y, []);
  const [w, setW] = useState(0);
  useLayoutEffect(() => { if (open && ref.current) setW(ref.current.offsetWidth); }, [open, ref]);
  const left = align === "end" ? Math.max(8, Math.min(anchor.right - w, window.innerWidth - w - 8)) : pos.left;
  useDismiss(open, close, ref as React.RefObject<HTMLElement>);
  return <>
    {renderTrigger({ onClick: toggle, ref: wrap, open })}
    {open && createPortal(<div ref={ref} className={`popover ${className}`} style={{ left, top: pos.top }}>{children(close)}</div>, document.body)}
  </>;
}

function MenuList({ items, onClose }: { items: MenuItem[]; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.querySelector<HTMLElement>('[role="menuitem"]:not([disabled])')?.focus(); }, []);
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const els = [...(ref.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])') ?? [])];
    const i = els.indexOf(document.activeElement as HTMLElement);
    els[(i + (e.key === "ArrowDown" ? 1 : -1) + els.length) % els.length]?.focus();
  };
  return <div ref={ref} role="menu" className="menu" onKeyDown={onKey}>{items.map((it, i) => it === "separator"
    ? <hr key={i} />
    : <button key={i} role="menuitem" type="button" disabled={it.disabled} className={it.danger ? "is-danger" : ""} onClick={() => { onClose(); it.onSelect(); }}>
      {it.icon}<span>{it.label}</span>{it.shortcut && <kbd className="kbd">{it.shortcut}</kbd>}</button>)}</div>;
}

export function Menu({ items, label = "More actions", trigger, align = "end" }: { items: MenuItem[]; label?: string; trigger?: (p: { onClick: () => void; ref: Ref<HTMLSpanElement>; open: boolean }) => ReactNode; align?: "start" | "end" }) {
  return <Popover align={align} className="popover-menu" renderTrigger={p => trigger ? trigger(p) :
    <span ref={p.ref} className="trigger-wrap"><IconButton label={label} aria-haspopup="menu" aria-expanded={p.open} onClick={p.onClick}><MoreHorizontal size={16} /></IconButton></span>}>
    {close => <MenuList items={items} onClose={close} />}
  </Popover>;
}

export function useContextMenu(items: MenuItem[]) {
  const [at, setAt] = useState<{ x: number; y: number } | null>(null);
  const close = useCallback(() => setAt(null), []);
  const { ref, pos } = useClamp(!!at, at?.x ?? 0, at?.y ?? 0, []);
  useDismiss(!!at, close, ref as React.RefObject<HTMLElement>);
  const onContextMenu = (e: React.MouseEvent) => { e.preventDefault(); setAt({ x: e.clientX, y: e.clientY }); };
  const menu = at ? createPortal(<div ref={ref} className="popover popover-menu" style={{ left: pos.left, top: pos.top }}><MenuList items={items} onClose={close} /></div>, document.body) : null;
  return { onContextMenu, menu };
}

export { modKey };
