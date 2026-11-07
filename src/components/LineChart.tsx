import { dayMonth, diffDays } from '../logic/dates';

export interface Point { date: string; value: number }

/** Simple SVG line chart with an optional dashed target line. */
export function LineChart({ points, target, from, to, unit, height = 200, label }: {
  points: Point[];
  target?: Point[];
  from: string;
  to: string;
  unit: string;
  height?: number;
  label: string;
}) {
  const W = 340;
  const H = height;
  const pad = { l: 34, r: 10, t: 10, b: 22 };
  const all = [...points, ...(target ?? [])].map((p) => p.value);
  if (all.length === 0) return null;
  let lo = Math.floor(Math.min(...all) - 1);
  let hi = Math.ceil(Math.max(...all) + 1);
  if (hi - lo < 4) { lo -= 2; hi += 2; }
  const span = Math.max(1, diffDays(to, from));
  const x = (d: string) => pad.l + (diffDays(d, from) / span) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + ((hi - v) / (hi - lo)) * (H - pad.t - pad.b);
  const path = (ps: Point[]) => ps.map((p, i) => `${i ? 'L' : 'M'}${x(p.date).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const ticks = [lo, Math.round((lo + hi) / 2), hi];
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const mid = new Date((new Date(from).getTime() + new Date(to).getTime()) / 2).toISOString().slice(0, 10);

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      {ticks.map((t) => (
        <g key={t}>
          <line className="axis" x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} />
          <text className="label" x={pad.l - 6} y={y(t) + 4} textAnchor="end">{t}</text>
        </g>
      ))}
      {[from, mid, to].map((d, i) => (
        <text key={d} className="label" x={x(d)} y={H - 6} textAnchor={i === 0 ? 'start' : i === 2 ? 'end' : 'middle'}>{dayMonth(d)}</text>
      ))}
      {target && target.length > 1 && <path className="target" d={path(target)} />}
      {sorted.length > 1 && <path className="line" d={path(sorted)} />}
      {sorted.map((p) => (
        <circle key={p.date} className="dot" cx={x(p.date)} cy={y(p.value)} r={3.5}>
          <title>{`${dayMonth(p.date)}: ${p.value} ${unit}`}</title>
        </circle>
      ))}
    </svg>
  );
}
