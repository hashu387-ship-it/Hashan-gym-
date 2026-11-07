import { useId, type ReactNode } from 'react';

/** Donut ring: value out of max. */
export function Ring({ value, max, size = 112, stroke = 12, color = 'var(--green)', track = 'var(--track)', children, label }: {
  value: number; max: number; size?: number; stroke?: number; color?: string; track?: string; children?: ReactNode; label: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  return (
    <div className="ring" style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: 'stroke-dasharray .5s ease' }} />
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  );
}

function smoothPath(pts: [number, number][]): string {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i - 1] ?? pts[i];
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    const [x3, y3] = pts[i + 2] ?? pts[i + 1];
    const c1x = x1 + (x2 - x0) / 6;
    const c1y = y1 + (y2 - y0) / 6;
    const c2x = x2 - (x3 - x1) / 6;
    const c2y = y2 - (y3 - y1) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`;
  }
  return d;
}

const PLACEHOLDER = [0.35, 0.5, 0.42, 0.7, 0.55, 0.85, 0.6];

function scale(values: (number | null)[], h: number, pad = 6): { pts: [number, number][]; empty: boolean } {
  const real = values.filter((v): v is number => v !== null);
  const empty = real.length < 2;
  const vals = empty ? PLACEHOLDER : values.map((v) => v ?? Math.min(...real));
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const span = hi - lo || 1;
  const w = 100;
  return {
    empty,
    pts: vals.map((v, i) => [(i / (vals.length - 1)) * w, h - pad - ((v - lo) / span) * (h - pad * 2) * 0.8 - (h - pad * 2) * 0.1] as [number, number]),
  };
}

/** Soft area chart (sleep card). Shows a faint sample shape when there is no data yet. */
export function AreaSpark({ values, color, height = 64 }: { values: (number | null)[]; color: string; height?: number }) {
  const id = useId();
  const { pts, empty } = scale(values, height);
  const line = smoothPath(pts);
  return (
    <svg className="spark" viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" aria-hidden="true" style={{ opacity: empty ? 0.45 : 1 }}>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.85" />
          <stop offset="1" stopColor={color} stopOpacity="0.15" />
        </linearGradient>
      </defs>
      <path d={`${line} L100,${height} L0,${height} Z`} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** Step-shaped area chart (heart rate card). */
export function StepArea({ values, color, height = 64 }: { values: (number | null)[]; color: string; height?: number }) {
  const { pts, empty } = scale(values, height);
  const step = 100 / pts.length;
  let d = `M0,${height}`;
  pts.forEach(([, y], i) => {
    d += ` L${(i * step).toFixed(1)},${y.toFixed(1)} L${((i + 1) * step).toFixed(1)},${y.toFixed(1)}`;
  });
  d += ` L100,${height} Z`;
  return (
    <svg className="spark" viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" aria-hidden="true" style={{ opacity: empty ? 0.45 : 1 }}>
      <path d={d} fill={color} fillOpacity="0.75" />
    </svg>
  );
}

/** Small vertical bars (burn score card). */
export function MiniBars({ values, color, height = 44 }: { values: (number | null)[]; color: string; height?: number }) {
  const real = values.filter((v): v is number => v !== null);
  const vals = real.length ? values.map((v) => v ?? 0) : PLACEHOLDER;
  const hi = Math.max(...vals, 1);
  const w = 100 / vals.length;
  return (
    <svg className="spark" viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" aria-hidden="true" style={{ opacity: real.length ? 1 : 0.45 }}>
      {vals.map((v, i) => {
        const h = Math.max(4, (v / hi) * (height - 2));
        return <rect key={i} x={i * w + w * 0.3} y={height - h} width={w * 0.4} height={h} rx={w * 0.2} fill={color} />;
      })}
    </svg>
  );
}

/** Wavy line (drink-up card). */
export function Wave({ values, color, height = 44 }: { values: (number | null)[]; color: string; height?: number }) {
  const { pts, empty } = scale(values, height, 8);
  return (
    <svg className="spark" viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" aria-hidden="true" style={{ opacity: empty ? 0.45 : 1 }}>
      <path d={smoothPath(pts)} fill="none" stroke={color} strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
    </svg>
  );
}

export interface DayBar { label: string; value: number | null; today: boolean; future: boolean }

/** Weekly pill bars with a wavy pattern on today and future days (stats screen). */
export function WeekBars({ days, target, height = 150 }: { days: DayBar[]; target: number; height?: number }) {
  const id = useId().replace(/:/g, '');
  const max = Math.max(target, ...days.map((d) => d.value ?? 0)) * 1.05;
  const W = 330;
  const colW = W / days.length;
  const barW = colW * 0.72;
  const top = 34;
  const usable = height - top;
  return (
    <svg className="weekbars" viewBox={`0 0 ${W} ${height + 22}`} role="img" aria-label="Steps this week">
      <defs>
        <pattern id={`${id}-today`} width="12" height="10" patternUnits="userSpaceOnUse">
          <rect width="12" height="10" fill="var(--coral)" />
          <path d="M0 6 Q3 2 6 6 T12 6" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.3" />
        </pattern>
        <pattern id={`${id}-future`} width="12" height="10" patternUnits="userSpaceOnUse">
          <rect width="12" height="10" fill="var(--blue-soft)" />
          <path d="M0 6 Q3 2 6 6 T12 6" fill="none" stroke="var(--blue)" strokeWidth="1.3" />
        </pattern>
      </defs>
      {days.map((d, i) => {
        const x = i * colW + (colW - barW) / 2;
        const v = d.future ? max * 0.78 : Math.max(d.value ?? 0, max * 0.06);
        const h = (v / max) * usable;
        const fill = d.future ? `url(#${id}-future)` : d.today ? `url(#${id}-today)` : 'var(--peach)';
        return (
          <g key={d.label}>
            <rect x={x} y={top + usable - h} width={barW} height={h} rx={barW / 2} fill={fill}>
              <title>{d.value !== null ? `${d.label}: ${d.value.toLocaleString('en-US')} steps` : `${d.label}: no data`}</title>
            </rect>
            {d.today && d.value !== null && (
              <g transform={`translate(${x + barW / 2} ${top + usable - h - 8})`}>
                <rect x={-30} y={-24} width={60} height={22} rx={11} fill="var(--coral)" />
                <text x={0} y={-9} textAnchor="middle" className="bar-tip">{d.value.toLocaleString('en-US')}</text>
              </g>
            )}
            <text x={x + barW / 2} y={height + 16} textAnchor="middle" className="bar-label">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}
