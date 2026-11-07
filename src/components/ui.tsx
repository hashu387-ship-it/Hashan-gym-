import { useEffect, useState, type ReactNode } from 'react';

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  return (
    <div className="sheet-backdrop" onClick={onClose} role="presentation">
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2 style={{ margin: 0 }}>{title}</h2>
          <button className="btn secondary small" onClick={onClose}>Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Bar({ label, value, target, unit, allowOver = false }: { label: string; value: number; target: number; unit: string; allowOver?: boolean }) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  const over = !allowOver && value > target;
  return (
    <div className="bar">
      <div className="bar-head">
        <span>{label}</span>
        <span className="num">
          <strong>{Math.round(value).toLocaleString('en-US')}</strong>
          <span className="muted"> / {target.toLocaleString('en-US')} {unit}</span>
        </span>
      </div>
      <div className="bar-track" role="progressbar" aria-label={label} aria-valuenow={Math.round(value)} aria-valuemax={target}>
        <div className={`bar-fill${over ? ' over' : ''}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

let toastTimer: number | undefined;
let setToastGlobal: ((s: string | null) => void) | null = null;

export function showToast(msg: string): void {
  setToastGlobal?.(msg);
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => setToastGlobal?.(null), 2600);
}

export function ToastHost() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    setToastGlobal = setMsg;
    return () => {
      setToastGlobal = null;
    };
  }, []);
  return msg ? <div className="toast" role="status">{msg}</div> : null;
}

/** Number input that keeps empty text while typing and reports numbers (or undefined). */
export function NumInput({ value, onChange, placeholder, step = 'any', ariaLabel, min }: {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  placeholder?: string;
  step?: string;
  ariaLabel: string;
  min?: number;
}) {
  const [text, setText] = useState(value === undefined ? '' : String(value));
  useEffect(() => {
    setText((t) => (Number(t) === value || (t === '' && value === undefined) ? t : value === undefined ? '' : String(value)));
  }, [value]);
  return (
    <input
      type="number"
      inputMode="decimal"
      step={step}
      min={min}
      aria-label={ariaLabel}
      placeholder={placeholder}
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        const n = e.target.value === '' ? undefined : Number(e.target.value);
        onChange(n !== undefined && Number.isFinite(n) ? n : undefined);
      }}
    />
  );
}

export function fmtMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h ? `${h} h ${m} min` : `${m} min`;
}

export function timeAgo(iso: string, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.round(h / 24)} days ago`;
}
