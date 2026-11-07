import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useRef, useState } from 'react';
import { HowTo } from '../components/ExerciseDemo';
import { IconCheck, IconPlay, IconSwap } from '../components/icons';
import { NumInput, Sheet, showToast } from '../components/ui';
import { db, type WorkoutLog } from '../db/db';
import { getWorkout, lastSetsFor, saveSettings, workoutId } from '../db/queries';
import { dayContext } from '../logic/context';
import { shortDate } from '../logic/dates';
import { progressionHint, type SetLog } from '../logic/strength';
import { EXERCISE_BY_ID, demoFrames } from '../plan/exercises';
import { PHASE_EFFORT, SESSIONS, prescription, restSeconds, sessionItems } from '../plan/program';
import type { Dose, ExerciseInfo, SessionId, SessionItem, SetUnit } from '../plan/types';
import { useApp } from '../state';

const UNIT_LABEL: Record<SetUnit, string> = { reps: 'reps', seconds: 'sec', perSide: 'each side', metres: 'm', minutes: 'min' };
const PICKABLE: SessionId[] = ['upperA', 'lowerA', 'upperB', 'lowerB', 'circuit', 'cardio', 'ramadanWalk', 'rest'];

function doseText(d: Dose, unit: SetUnit): string {
  const range = d.low === d.high ? `${d.low}` : `${d.low}-${d.high}`;
  if (unit === 'minutes') return `${range} min`;
  return `${d.sets} x ${range} ${UNIT_LABEL[unit]}`;
}

export function WorkoutScreen() {
  const { settings, date } = useApp();
  const ctx = dayContext(date, settings);
  const [picked, setPicked] = useState<SessionId | null>(null);
  const sessionId = picked ?? ctx.sessionId;
  const session = SESSIONS[sessionId];
  const items = sessionItems(session, ctx.phase);
  const log = useLiveQuery(() => db.workouts.get(workoutId(date, sessionId)), [date, sessionId]);
  const [timer, setTimer] = useState<{ until: number; total: number } | null>(null);
  const [howTo, setHowTo] = useState<ExerciseInfo | null>(null);
  const [swapFor, setSwapFor] = useState<SessionItem | null>(null);

  useEffect(() => setPicked(null), [date]);

  const save = async (fn: (w: WorkoutLog) => WorkoutLog) => {
    const w = await getWorkout(date, sessionId);
    await db.workouts.put(fn(w));
  };

  const finish = async () => {
    const sets = (log?.sets ?? []).filter((s) => s.done);
    const volume = sets.reduce((a, s) => a + (s.kg ?? 0) * (s.reps ?? 0), 0);
    await save((w) => ({ ...w, finishedAt: new Date().toISOString() }));
    setTimer(null);
    showToast(`Saved: ${sets.length} sets${volume ? `, ${Math.round(volume).toLocaleString('en-US')} kg lifted` : ''}. Well done.`);
  };

  return (
    <div>
      <div className="header">
        <div>
          <h1>{session.title}</h1>
          <div className="muted small">{shortDate(date)} - {session.focus}</div>
          <span className="phase-pill">{ctx.label}</span>
        </div>
      </div>
      <label className="field" style={{ marginTop: 14 }}>
        Session
        <select value={sessionId} onChange={(e) => setPicked(e.target.value as SessionId)}>
          {PICKABLE.map((id) => <option key={id} value={id}>{SESSIONS[id].title}{id === ctx.sessionId ? ' (planned)' : ''}</option>)}
        </select>
      </label>

      <div className="card white">
        {session.notes.map((n, i) => <p key={i} className="small">{n}</p>)}
        {session.kind !== 'rest' && session.kind !== 'cardio' && <p className="small muted" style={{ margin: 0 }}>{PHASE_EFFORT[ctx.phase]}</p>}
      </div>

      {session.kind === 'rest' && (
        <div className="card">
          <p>Target today: {ctx.stepsTarget.toLocaleString('en-US')} steps and {ctx.waterTargetMl / 1000} L of water.</p>
          <p className="small muted">Missed a session this week? Pick it from the list above to do it today.</p>
        </div>
      )}

      {items.map((it, idx) => (
        <ExerciseCard
          key={`${sessionId}-${idx}`}
          item={it}
          dose={prescription(it, ctx.phase)}
          date={date}
          sets={log?.sets ?? []}
          swapId={settings.swaps[it.exerciseId]}
          onHowTo={setHowTo}
          onSwap={() => setSwapFor(it)}
          onSet={async (s) => {
            await save((w) => {
              const others = w.sets.filter((x) => !(x.exerciseId === s.exerciseId && x.setIndex === s.setIndex));
              return { ...w, sets: [...others, s] };
            });
            if (s.done && it.unit !== 'minutes') {
              const secs = restSeconds(it);
              setTimer({ until: Date.now() + secs * 1000, total: secs });
            }
          }}
        />
      ))}

      {items.length > 0 && (
        <button className="btn block" style={{ marginTop: 16 }} onClick={finish}>
          {log?.finishedAt ? 'Saved - tap to save again' : 'Finish workout'}
        </button>
      )}

      {timer && <RestTimer until={timer.until} onDone={() => setTimer(null)} onAdd={(s) => setTimer({ ...timer, until: timer.until + s * 1000 })} />}
      {howTo && <Sheet title={howTo.name} onClose={() => setHowTo(null)}><HowTo exercise={howTo} /></Sheet>}
      {swapFor && (
        <Sheet title="Swap exercise" onClose={() => setSwapFor(null)}>
          <p className="small muted">Machine busy? Pick another exercise. Your choice is remembered for next time.</p>
          <ul className="list">
            {[swapFor.exerciseId, ...swapFor.alternatives].map((id) => {
              const ex = EXERCISE_BY_ID[id];
              const current = (settings.swaps[swapFor.exerciseId] ?? swapFor.exerciseId) === id;
              return (
                <li key={id}>
                  <img className="ex-thumb" src={demoFrames(ex)[1]} alt="" loading="lazy" />
                  <div className="grow">
                    <div>{ex.name}{id === swapFor.exerciseId && <span className="tiny muted"> (original)</span>}</div>
                    <div className="tiny muted">{ex.muscles}</div>
                  </div>
                  <button className="btn small" disabled={current} onClick={async () => {
                    const swaps = { ...settings.swaps };
                    if (id === swapFor.exerciseId) delete swaps[swapFor.exerciseId];
                    else swaps[swapFor.exerciseId] = id;
                    await saveSettings({ swaps });
                    setSwapFor(null);
                  }}>{current ? 'Current' : 'Use'}</button>
                </li>
              );
            })}
          </ul>
        </Sheet>
      )}
    </div>
  );
}

function ExerciseCard({ item, dose, date, sets, swapId, onHowTo, onSwap, onSet }: {
  item: SessionItem;
  dose: Dose;
  date: string;
  sets: SetLog[];
  swapId?: string;
  onHowTo: (e: ExerciseInfo) => void;
  onSwap: () => void;
  onSet: (s: SetLog) => void;
}) {
  const ex = EXERCISE_BY_ID[swapId ?? item.exerciseId];
  const last = useLiveQuery(() => lastSetsFor(ex.id, date), [ex.id, date]) ?? [];
  const hint = progressionHint(ex, item, last, dose);
  const count = item.unit === 'minutes' ? 1 : dose.sets;
  const mine = sets.filter((s) => s.exerciseId === ex.id);
  const doneCount = mine.filter((s) => s.done).length;
  const withKg = item.unit === 'reps' || item.unit === 'perSide' || item.unit === 'metres';

  return (
    <section className="card" aria-label={ex.name}>
      <div className="ex-head">
        <button className="thumb-btn" onClick={() => onHowTo(ex)} aria-label={`How to do ${ex.name}`}>
          <img className="ex-thumb" src={demoFrames(ex)[1]} alt="" loading="lazy" />
          <span className="play"><IconPlay /></span>
        </button>
        <div className="grow">
          <h3 style={{ margin: 0 }}>{ex.name}</h3>
          <div className="small"><span className="dose">{doseText(dose, item.unit)}</span></div>
          <div className="tiny muted">{doneCount}/{count} done</div>
        </div>
        {item.main && <span className="chip coral">Main lift</span>}
      </div>
      <div className="row wrap" style={{ marginTop: 8 }}>
        <button className="chip" onClick={() => onHowTo(ex)}><IconPlay width={14} height={14} />How to</button>
        {item.alternatives.length > 0 && <button className="chip soft" onClick={onSwap}><IconSwap width={16} height={16} />Swap</button>}
      </div>
      {hint && <div className={`hint${hint.includes('try') ? ' up' : ''}`}>{hint}</div>}
      <div className="sets">
        {Array.from({ length: count }, (_, i) => {
          const s = mine.find((x) => x.setIndex === i) ?? { exerciseId: ex.id, setIndex: i, done: false };
          const prev = last.find((x) => x.setIndex === i);
          return (
            <div key={i} className={`set${withKg ? '' : ' one'}`}>
              <span className="set-n">{i + 1}</span>
              {withKg && (
                <div>
                  <NumInput ariaLabel={`${ex.name} set ${i + 1} kg`} value={s.kg} placeholder={prev?.kg !== undefined ? String(prev.kg) : 'kg'} step="0.5" min={0}
                    onChange={(kg) => onSet({ ...s, kg })} />
                  <div className="unit">kg</div>
                </div>
              )}
              <div>
                <NumInput ariaLabel={`${ex.name} set ${i + 1} ${UNIT_LABEL[item.unit]}`} value={s.reps}
                  placeholder={prev?.reps !== undefined ? String(prev.reps) : String(dose.high)} step="1" min={0}
                  onChange={(reps) => onSet({ ...s, reps })} />
                <div className="unit">{UNIT_LABEL[item.unit]}</div>
              </div>
              <button className={`tick${s.done ? ' on' : ''}`} aria-label={`Set ${i + 1} done`} aria-pressed={s.done}
                onClick={() => onSet({
                  ...s,
                  kg: s.kg ?? (withKg ? prev?.kg : undefined),
                  reps: s.reps ?? prev?.reps ?? dose.high,
                  done: !s.done,
                })}>
                <IconCheck />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function RestTimer({ until, onDone, onAdd }: { until: number; onDone: () => void; onAdd: (s: number) => void }) {
  const [now, setNow] = useState(Date.now());
  const buzzed = useRef(false);
  useEffect(() => {
    buzzed.current = false;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [until]);
  const left = Math.max(0, Math.ceil((until - now) / 1000));
  useEffect(() => {
    if (left === 0 && !buzzed.current) {
      buzzed.current = true;
      navigator.vibrate?.([200, 100, 200]);
      const t = window.setTimeout(onDone, 2500);
      return () => window.clearTimeout(t);
    }
  }, [left, onDone]);
  const mm = Math.floor(left / 60);
  const ss = String(left % 60).padStart(2, '0');
  return (
    <div className="timer" role="timer" aria-live="polite">
      <span className="t">{mm}:{ss}</span>
      <span className="grow small">{left === 0 ? 'Rest done - next set' : 'Rest'}</span>
      <button className="btn small" onClick={() => onAdd(15)}>+15 s</button>
      <button className="btn small" onClick={onDone}>Skip</button>
    </div>
  );
}
