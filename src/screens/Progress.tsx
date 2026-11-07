import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { LineChart } from '../components/LineChart';
import { NumInput, Sheet, showToast } from '../components/ui';
import { db, type DayLog, type WorkoutLog } from '../db/db';
import { bmi, dayTotals, targetWeightAt } from '../logic/checks';
import { dayContext } from '../logic/context';
import { addDays, dayMonth, diffDays } from '../logic/dates';
import { bestE1rm } from '../logic/strength';
import { EXERCISE_BY_ID } from '../plan/exercises';
import { SESSIONS } from '../plan/program';
import { useApp } from '../state';

const MAIN_LIFTS = ['bench-press', 'back-squat', 'lat-pulldown', 'trap-bar-deadlift'];
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const fmt = (v: number | null, digits = 0) => (v === null ? '-' : v.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits }));

export function ProgressScreen() {
  const { settings, today } = useApp();
  const weighIns = useLiveQuery(() => db.weighIns.orderBy('date').toArray(), []) ?? [];
  const days = useLiveQuery(() => db.days.toArray(), []) ?? [];
  const workouts = useLiveQuery(() => db.workouts.toArray(), []) ?? [];
  const adjustments = useLiveQuery(() => db.adjustments.orderBy('date').reverse().toArray(), []) ?? [];
  const [adding, setAdding] = useState(false);

  const latest = weighIns.at(-1);
  const lost = latest ? Math.round((settings.startWeightKg - latest.kg) * 10) / 10 : 0;
  const chartEnd = '2027-04-15';
  const targetLine = [settings.startDate, addDays(settings.startDate, 90), settings.ramadanEnd, chartEnd].map((d) => ({ date: d, value: targetWeightAt(d, settings) }));
  const points = [{ date: settings.startDate, value: settings.startWeightKg }, ...weighIns.filter((w) => w.date > settings.startDate).map((w) => ({ date: w.date, value: w.kg }))];
  const waist = weighIns.filter((w) => w.waistCm).map((w) => ({ date: w.date, value: w.waistCm! }));

  return (
    <div>
      <h1>Progress</h1>
      <div className="grid3" style={{ marginTop: 12 }}>
        <div className="stat"><div className="v">{latest ? latest.kg : settings.startWeightKg}</div><div className="k">kg now</div></div>
        <div className="stat"><div className="v">{lost > 0 ? `-${lost}` : lost}</div><div className="k">kg since 96</div></div>
        <div className="stat"><div className="v">{bmi(latest?.kg ?? settings.startWeightKg, settings.heightCm)}</div><div className="k">BMI</div></div>
      </div>

      <section className="card">
        <div className="spread">
          <h2 style={{ margin: 0 }}>Weight</h2>
          <button className="btn small" onClick={() => setAdding(true)}>+ Weigh-in</button>
        </div>
        <p className="small muted">Dots are your Friday weigh-ins. The dashed line is the plan: 83 kg by 6 Feb, 78 kg by mid-April. Target today: {targetWeightAt(today, settings)} kg.</p>
        <LineChart label="Weight chart" points={points} target={targetLine} from={settings.startDate} to={chartEnd} unit="kg" />
        {weighIns.length > 0 && (
          <ul className="list" style={{ marginTop: 8 }}>
            {[...weighIns].reverse().slice(0, 6).map((w) => (
              <li key={w.date} className="small">
                <span className="grow">{dayMonth(w.date)}</span>
                <span className="num"><strong>{w.kg} kg</strong>{w.waistCm ? ` - waist ${w.waistCm} cm` : ''}</span>
                <button className="btn ghost small" aria-label={`Delete weigh-in ${w.date}`} onClick={() => db.weighIns.delete(w.date)}>Delete</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {waist.length > 1 && (
        <section className="card">
          <h2>Waist</h2>
          <LineChart label="Waist chart" points={waist} from={waist[0].date} to={waist.at(-1)!.date} unit="cm" height={150} />
        </section>
      )}

      <WeeklyTable days={days} workouts={workouts} />
      <StrengthCards workouts={workouts} />

      {adjustments.length > 0 && (
        <section className="card">
          <h2>Two-week checks</h2>
          <ul className="list">
            {adjustments.map((a) => (
              <li key={a.date} className="small">
                <span className="grow">{dayMonth(a.date)} - lost {a.rate} kg/week</span>
                <span>{a.accepted ? (a.toKcal !== a.fromKcal ? `${a.fromKcal} -> ${a.toKcal} kcal` : a.stepsDelta ? `+${a.stepsDelta} steps` : 'On track') : 'Ignored'}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {adding && <AddWeighIn today={today} onClose={() => setAdding(false)} />}
    </div>
  );
}

function WeeklyTable({ days, workouts }: { days: DayLog[]; workouts: WorkoutLog[] }) {
  const { settings, today } = useApp();
  const byDate = new Map(days.map((d) => [d.date, d]));
  const currentWeek = Math.floor(diffDays(today, settings.startDate) / 7);
  if (currentWeek < 0) {
    return <section className="card"><h2>Weekly averages</h2><p className="small muted">Your weekly numbers appear here once the plan starts on Sunday 8 Nov.</p></section>;
  }
  const rows = [];
  for (let w = currentWeek; w >= Math.max(0, currentWeek - 7); w--) {
    const start = addDays(settings.startDate, w * 7);
    const dates = Array.from({ length: 7 }, (_, i) => addDays(start, i)).filter((d) => d <= today);
    const logs = dates.map((d) => byDate.get(d)).filter((d): d is DayLog => !!d);
    const eaten = logs.filter((d) => d.meals.length).map((d) => dayTotals(d.meals));
    const planned = dates.filter((d) => SESSIONS[dayContext(d, settings).sessionId].kind !== 'rest').length;
    const done = new Set(workouts.filter((x) => dates.includes(x.date) && x.sets.some((s) => s.done)).map((x) => x.date)).size;
    rows.push({
      label: `Wk ${w + 1}`,
      kcal: avg(eaten.map((e) => e.kcal)),
      protein: avg(eaten.map((e) => e.protein)),
      steps: avg(logs.filter((d) => d.steps).map((d) => d.steps!.value)),
      sleep: avg(logs.filter((d) => d.sleep).map((d) => d.sleep!.minutes / 60)),
      rhr: avg(logs.filter((d) => d.restingHr).map((d) => d.restingHr!.value)),
      workouts: `${done}/${planned}`,
      lipo: logs.filter((d) => d.lipoTakenAt).length,
    });
  }
  return (
    <section className="card">
      <h2>Weekly averages</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Week</th><th>kcal</th><th>Protein</th><th>Steps</th><th>Sleep h</th><th>RHR</th><th>Gym</th><th>Lipo</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <td>{r.label}</td><td>{fmt(r.kcal)}</td><td>{fmt(r.protein)}</td><td>{fmt(r.steps)}</td>
                <td>{fmt(r.sleep, 1)}</td><td>{fmt(r.rhr)}</td><td>{r.workouts}</td><td>{r.lipo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StrengthCards({ workouts }: { workouts: WorkoutLog[] }) {
  const { settings } = useApp();
  const series = MAIN_LIFTS.map((id) => {
    const actual = settings.swaps[id] ?? id;
    const byWeek = new Map<string, number>();
    for (const w of workouts) {
      const best = bestE1rm(w.sets.filter((s) => s.exerciseId === actual));
      if (best === null) continue;
      const wk = addDays(settings.startDate, Math.floor(diffDays(w.date, settings.startDate) / 7) * 7);
      byWeek.set(wk, Math.max(best, byWeek.get(wk) ?? 0));
    }
    const points = [...byWeek.entries()].sort().map(([date, value]) => ({ date, value }));
    return { ex: EXERCISE_BY_ID[actual], points };
  });
  const any = series.some((s) => s.points.length);
  return (
    <section className="card">
      <h2>Strength</h2>
      {!any && <p className="small muted">Log your main lifts and your estimated strength (1-rep max) shows here each week.</p>}
      {series.filter((s) => s.points.length).map((s) => (
        <div key={s.ex.id} style={{ marginTop: 10 }}>
          <div className="spread small"><strong>{s.ex.name}</strong><span className="num">{s.points.at(-1)!.value} kg est. max</span></div>
          {s.points.length > 1 && <LineChart label={`${s.ex.name} strength`} points={s.points} from={s.points[0].date} to={s.points.at(-1)!.date} unit="kg" height={110} />}
        </div>
      ))}
    </section>
  );
}

function AddWeighIn({ today, onClose }: { today: string; onClose: () => void }) {
  const [date, setDate] = useState(today);
  const [kg, setKg] = useState<number | undefined>();
  const [waist, setWaist] = useState<number | undefined>();
  return (
    <Sheet title="Add weigh-in" onClose={onClose}>
      <label className="field">Date<input type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} /></label>
      <div className="grid2" style={{ marginTop: 8 }}>
        <label className="field">Weight (kg)<NumInput ariaLabel="Weight" value={kg} onChange={setKg} step="0.1" min={30} /></label>
        <label className="field">Waist (cm)<NumInput ariaLabel="Waist" value={waist} onChange={setWaist} step="0.5" /></label>
      </div>
      <button className="btn block" style={{ marginTop: 12 }} disabled={kg === undefined || !date} onClick={async () => {
        await db.weighIns.put({ date, kg: Math.round(kg! * 10) / 10, waistCm: waist });
        showToast('Weigh-in saved');
        onClose();
      }}>Save</button>
    </Sheet>
  );
}
