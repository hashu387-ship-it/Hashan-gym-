import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { AreaSpark, MiniBars, Ring, StepArea, Wave } from '../components/charts';
import { FoodPicker } from '../components/FoodPicker';
import {
  IconArrow, IconChevronLeft, IconChevronRight, IconClock, IconFood, IconGlass, IconHeart, IconLevel, IconMinus, IconMoon, IconPill, IconPlus, IconScale, IconSteps,
} from '../components/icons';
import { Bar, NumInput, Sheet, fmtMinutes, showToast, timeAgo } from '../components/ui';
import { db, type DayLog } from '../db/db';
import { emptyDay, saveSettings, updateDay } from '../db/queries';
import { dayTotals, twoWeekCheck } from '../logic/checks';
import { LIPO_CUTOFF_HOUR, dayContext } from '../logic/context';
import { addDays, diffDays, riyadhHour, riyadhTime, shortDate, weekday } from '../logic/dates';
import { SLOT_LABEL } from '../plan/foods';
import { PHASE_LABEL, SESSIONS, prescription, sessionItems } from '../plan/program';
import type { DayContext, MealSlot, Settings } from '../plan/types';
import { useApp } from '../state';
import { SYNC_MESSAGES } from '../sync/client';

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));
const GLASS = 250;

export function TodayScreen() {
  const { settings, date, setDate, today, setTab, sync, syncNow } = useApp();
  const ctx = dayContext(date, settings);
  const day = useLiveQuery(() => db.days.get(date), [date]) ?? emptyDay(date);
  const week = useLiveQuery(() => db.days.where('date').between(addDays(date, -6), date, true, true).toArray(), [date]) ?? [];
  const weighIns = useLiveQuery(() => db.weighIns.toArray(), []) ?? [];
  const adjustment = useLiveQuery(() => db.adjustments.get(date), [date]);
  const daysLogged = useLiveQuery(() => db.days.count(), []) ?? 0;
  const [picker, setPicker] = useState<MealSlot | null>(null);
  const [editing, setEditing] = useState<'steps' | 'sleep' | null>(null);

  const isToday = date === today;
  const check = adjustment ? null : twoWeekCheck(weighIns, date, settings);
  const weighIn = weighIns.find((w) => w.date === date);
  const change = (fn: (d: DayLog) => DayLog) => updateDay(date, fn);
  const series = <T,>(pick: (d: DayLog) => T | null) => Array.from({ length: 7 }, (_, i) => {
    const d = week.find((x) => x.date === addDays(date, i - 6));
    return d ? pick(d) : null;
  });
  const backupDue = settings.lastBackupAt ? diffDays(today, settings.lastBackupAt.slice(0, 10)) >= 7 : daysLogged >= 3;

  return (
    <div>
      <div className="welcome-head">
        <div>
          <div className="muted small">Welcome back!</div>
          <h1>Hashan</h1>
        </div>
        <button className="avatar" aria-label="Plan and settings" onClick={() => setTab('plan')}>H</button>
      </div>

      <div className="datebar">
        <button className="round-btn" aria-label="Previous day" onClick={() => setDate(addDays(date, -1))}><IconChevronLeft /></button>
        <div className="grow">
          <div style={{ fontWeight: 700 }}>{isToday ? `Today, ${shortDate(date)}` : shortDate(date)}</div>
          <div className="tiny muted">Sleep {ctx.bed} - wake {ctx.wake}</div>
        </div>
        {!isToday && <button className="btn secondary small" onClick={() => setDate(today)}>Today</button>}
        <button className="round-btn" aria-label="Next day" onClick={() => setDate(addDays(date, 1))}><IconChevronRight /></button>
      </div>

      {sync.status === 'error' && sync.error && (
        <div className={`banner ${sync.error === 'reconnect' ? 'bad' : 'warn'}`}>
          {SYNC_MESSAGES[sync.error]}{' '}
          {sync.error === 'reconnect'
            ? <a href="/api/auth/start">Reconnect</a>
            : <button className="btn ghost small" onClick={() => void syncNow()}>Try again</button>}
        </div>
      )}
      {backupDue && (
        <div className="banner warn">
          No backup in the last 7 days. <button className="btn ghost small" onClick={() => setTab('plan')}>Back up now</button>
        </div>
      )}
      {check && <CheckCard date={date} check={check} settings={settings} />}

      <WorkoutCard ctx={ctx} date={date} settings={settings} onOpen={() => setTab('workout')} />

      <div className="grid-cards">
        <button className="card mini" style={{ border: 0, textAlign: 'left', color: 'inherit', cursor: 'pointer' }} onClick={() => setEditing('sleep')} aria-label="Sleep, tap to edit">
          <div className="card-title">
            <span className="icon-circle blue"><IconMoon /></span>
            <div><h2>Sleep</h2><div className="sub">{day.sleep ? (day.sleep.source === 'band' ? 'From Fitbit' : 'Typed in') : 'Add sleep data'}</div></div>
          </div>
          <AreaSpark values={series((d) => (d.sleep ? d.sleep.minutes / 60 : null))} color="var(--blue)" />
          <div className="mini-foot" style={{ position: 'relative' }}>
            <span className="mid num">{day.sleep ? fmtMinutes(day.sleep.minutes).replace(' min', 'm').replace(' h ', 'h ') : '--'}</span>
            <IconChevronRight />
          </div>
        </button>
        <button className="card mini" style={{ border: 0, textAlign: 'left', color: 'inherit', cursor: 'pointer' }} onClick={() => setTab('progress')} aria-label="Heart rate details">
          <div className="card-title">
            <span className="icon-circle lime"><IconHeart /></span>
            <div><h2>Heart rate</h2><div className="sub">{day.restingHr ? 'Resting' : 'Add heart rate data'}</div></div>
          </div>
          <StepArea values={series((d) => d.restingHr?.value ?? null)} color="var(--lime)" />
          <div className="mini-foot">
            <span className="mid num">{day.restingHr ? `${day.restingHr.value}bpm` : '--'}</span>
            <IconChevronRight />
          </div>
        </button>
      </div>

      <FoodCard ctx={ctx} day={day} settings={settings} onAdd={setPicker} onChange={change} />

      <div className="grid-cards">
        <div className="card mini">
          <div className="card-title">
            <span className="icon-circle peach"><IconSteps /></span>
            <div><h2>Steps</h2><div className="sub">Goal {ctx.stepsTarget.toLocaleString('en-US')}</div></div>
          </div>
          <MiniBars values={series((d) => d.steps?.value ?? null)} color="var(--coral)" />
          <div className="mini-foot">
            <span className="mid num">{day.steps ? day.steps.value.toLocaleString('en-US') : '--'}</span>
            <button className="btn secondary small" onClick={() => setEditing('steps')}>Edit</button>
          </div>
        </div>
        <div className="card mini">
          <div className="card-title">
            <span className="icon-circle blue"><IconGlass /></span>
            <div><h2>Drink up</h2><div className="sub">250 ml glasses</div></div>
          </div>
          <Wave values={series((d) => d.waterMl || null)} color="var(--blue)" />
          <div className="mini-foot">
            <span className="mid num">{day.waterMl / GLASS}<span className="tiny muted"> / {ctx.waterTargetMl / GLASS}</span></span>
          </div>
          <div className="glasses">
            <button className="round-btn" aria-label="Remove a glass" disabled={day.waterMl <= 0} onClick={() => change((d) => ({ ...d, waterMl: Math.max(0, d.waterMl - GLASS) }))}><IconMinus /></button>
            <button className="round-btn" aria-label="Add a glass" style={{ background: 'var(--ink)', color: 'var(--on-ink)' }} onClick={() => change((d) => ({ ...d, waterMl: d.waterMl + GLASS }))}><IconPlus /></button>
          </div>
        </div>
      </div>

      {ctx.lipoActive && <LipoCard day={day} isToday={isToday} onChange={change} />}
      {(weekday(date) === 5 || weighIn) && <WeighInCard date={date} day={day} lipo={ctx.lipoActive} />}

      <SyncLine />

      {picker && (
        <FoodPicker slot={picker} settings={settings} onClose={() => setPicker(null)}
          onAdd={async (item) => {
            await change((d) => ({ ...d, meals: [...d.meals, { ...item, id: uid(), slot: picker }] }));
            showToast(`Added ${item.name}`);
          }} />
      )}
      {editing === 'steps' && <StepsSheet day={day} onClose={() => setEditing(null)} onSave={(v) => change((d) => ({ ...d, steps: v === undefined ? undefined : { value: v, source: 'manual' } }))} />}
      {editing === 'sleep' && <SleepSheet day={day} onClose={() => setEditing(null)} onSave={(m) => change((d) => ({ ...d, sleep: m === undefined ? undefined : { minutes: m, source: 'manual' } }))} />}
    </div>
  );
}

const DURATION: Record<string, string> = { weights: '75 min', circuit: '60 min', cardio: '45-60 min', rest: 'Rest' };

function WorkoutCard({ ctx, date, settings, onOpen }: { ctx: DayContext; date: string; settings: Settings; onOpen: () => void }) {
  const session = SESSIONS[ctx.sessionId];
  const log = useLiveQuery(() => db.workouts.get(`${date}:${ctx.sessionId}`), [date, ctx.sessionId]);
  const items = sessionItems(session, ctx.phase);
  const total = items.reduce((a, it) => a + (it.unit === 'minutes' ? 1 : prescription(it, ctx.phase).sets), 0);
  const ids = new Set(items.map((it) => settings.swaps[it.exerciseId] ?? it.exerciseId));
  const done = (log?.sets ?? []).filter((s) => s.done && ids.has(s.exerciseId)).length;
  const pct = total ? Math.round((Math.min(done, total) / total) * 100) : 0;
  const rest = session.kind === 'rest';
  const cta = rest ? 'See today\'s plan' : pct === 0 ? 'Start the workout' : pct >= 100 ? 'Workout done - view' : 'Continue the workout';
  return (
    <section className="card" aria-label="Today's workout">
      <div className="spread"><h2 style={{ margin: 0 }}>Progress</h2></div>
      <div className="hero-card">
        <div>
          <span className="chip" style={{ marginTop: 10 }}>{ctx.week ? `Week ${ctx.week}` : PHASE_LABEL[ctx.phase]}</span>
          <div className="session">{rest ? 'Rest day' : session.title}</div>
          <div className="meta">
            <span><IconClock />{rest ? `${ctx.stepsTarget.toLocaleString('en-US')} steps` : ctx.phase === 'ramadan' && session.kind === 'weights' ? '45 min' : DURATION[session.kind]}</span>
            <span><IconLevel />{rest ? 'Recover' : session.focus.split(',')[0]}</span>
          </div>
        </div>
        <div className="ring-tile">
          <Ring value={rest ? 100 : pct} max={100} size={74} stroke={9} color="var(--coral)" track="rgb(255 255 255 / 0.55)" label={`${pct}% of today's sets done`}>
            <span className="v" style={{ fontSize: 13 }}>{rest ? 'Rest' : `${pct}%`}</span>
          </Ring>
        </div>
      </div>
      <button className="cta" onClick={onOpen}>
        {cta}
        <span className="go"><IconArrow /></span>
      </button>
    </section>
  );
}

function FoodCard({ ctx, day, settings, onAdd, onChange }: {
  ctx: DayContext; day: DayLog; settings: Settings; onAdd: (s: MealSlot) => void; onChange: (fn: (d: DayLog) => DayLog) => void;
}) {
  const totals = dayTotals(day.meals);
  const left = ctx.kcalTarget - totals.kcal;
  return (
    <section className="card" aria-label="Food">
      <div className="activity">
        <div>
          <div className="card-title"><span className="icon-circle green"><IconFood /></span><div><h2>Food</h2><div className="sub">Goal {ctx.kcalTarget.toLocaleString('en-US')} kcal</div></div></div>
          <div className="big num" style={{ marginTop: 14 }}>{totals.kcal.toLocaleString('en-US')}</div>
          <div className="small muted">{left >= 0 ? `${left.toLocaleString('en-US')} kcal left` : `${(-left).toLocaleString('en-US')} kcal over`}</div>
        </div>
        <Ring value={totals.kcal} max={ctx.kcalTarget} size={116} stroke={13} color={left < 0 ? 'var(--coral)' : 'var(--green)'} label={`Calories ${totals.kcal} of ${ctx.kcalTarget}`}>
          <span className="v">{Math.round((totals.kcal / ctx.kcalTarget) * 100)}%</span>
          <span className="k">calories</span>
        </Ring>
      </div>
      <Bar label="Protein" value={totals.protein} target={ctx.proteinTarget} unit="g" allowOver />

      <div style={{ marginTop: 14 }}>
        {ctx.mealSlots.map((slot) => {
          const items = day.meals.filter((m) => m.slot === slot);
          const t = dayTotals(items);
          return (
            <div className="slot" key={slot}>
              <div className="spread">
                <h3 style={{ margin: 0 }}>{SLOT_LABEL[slot]}</h3>
                <span className="small muted num">{t.kcal} kcal - {t.protein} g</span>
              </div>
              {items.length > 0 && (
                <ul className="list">
                  {items.map((m) => (
                    <li key={m.id}>
                      <div className="grow small">{m.name}{m.qty !== 1 && <span className="muted"> x{m.qty}</span>}</div>
                      <span className="tiny muted num">{Math.round(m.kcal * m.qty)} kcal</span>
                      <button className="btn ghost small" aria-label={`Remove ${m.name}`}
                        onClick={() => onChange((d) => ({ ...d, meals: d.meals.filter((x) => x.id !== m.id) }))}>Remove</button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="row wrap" style={{ marginTop: 8 }}>
                {slot === 'breakfast' && items.length === 0 && (
                  <button className="btn small" onClick={() => onChange((d) => ({
                    ...d,
                    meals: [...d.meals, ...settings.defaultBreakfast.map((b) => ({ ...b, id: uid(), slot }))],
                  }))}>
                    Add usual breakfast ({dayTotals(settings.defaultBreakfast.map((b) => ({ ...b, id: '', slot }))).kcal} kcal)
                  </button>
                )}
                <button className="btn secondary small" onClick={() => onAdd(slot)}>+ Add food</button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CheckCard({ date, check, settings }: { date: string; check: NonNullable<ReturnType<typeof twoWeekCheck>>; settings: Settings }) {
  return (
    <section className="card white">
      <div className="card-title"><span className="icon-circle green"><IconScale /></span><h2>Two-week check</h2></div>
      <p style={{ marginTop: 10 }}>{check.message}</p>
      <div className="row">
        {check.suggestion !== 'keep' && (
          <button className="btn" onClick={async () => {
            await db.adjustments.put({ date, fromKcal: check.fromKcal, toKcal: check.toKcal, stepsDelta: check.stepsDelta, rate: check.rate, accepted: true });
            await saveSettings({ kcalTarget: check.toKcal, stepsBonus: settings.stepsBonus + check.stepsDelta });
            showToast('New target saved');
          }}>Accept</button>
        )}
        <button className="btn secondary" onClick={() =>
          db.adjustments.put({ date, fromKcal: check.fromKcal, toKcal: check.fromKcal, stepsDelta: 0, rate: check.rate, accepted: check.suggestion === 'keep' })
        }>{check.suggestion === 'keep' ? 'OK' : 'Ignore'}</button>
      </div>
    </section>
  );
}

function SyncLine() {
  const { settings, sync, syncNow, setTab } = useApp();
  if (sync.status === 'syncing') return <p className="tiny muted" style={{ marginTop: 14, textAlign: 'center' }}>Syncing Fitbit...</p>;
  if (sync.error === 'not_connected' || sync.error === 'not_configured' || !settings.lastSyncAt) {
    return (
      <p className="tiny muted" style={{ marginTop: 14, textAlign: 'center' }}>
        Fitbit not connected. <button className="btn ghost small" onClick={() => setTab('plan')}>Set up</button>
      </p>
    );
  }
  return (
    <p className="tiny muted" style={{ marginTop: 14, textAlign: 'center' }}>
      Fitbit synced {timeAgo(settings.lastSyncAt)}. <button className="btn ghost small" onClick={() => void syncNow()}>Sync now</button>
    </p>
  );
}

function LipoCard({ day, isToday, onChange }: { day: DayLog; isToday: boolean; onChange: (fn: (d: DayLog) => DayLog) => void }) {
  const late = isToday && riyadhHour() >= LIPO_CUTOFF_HOUR;
  return (
    <section className="card" aria-label="Lipo 6">
      <div className="row">
        <span className="icon-circle peach"><IconPill /></span>
        <div className="grow">
          <div style={{ fontWeight: 700 }}>Lipo 6 - 1 capsule</div>
          <div className="tiny muted">
            {day.lipoTakenAt
              ? `Taken at ${riyadhTime(day.lipoTakenAt)}`
              : late ? 'Skip today. It is after 10 AM, so it would hurt your sleep.' : 'Before 10 AM, between meals. No tea or coffee after 12.'}
          </div>
        </div>
        {day.lipoTakenAt
          ? <button className="btn secondary small" onClick={() => onChange((d) => ({ ...d, lipoTakenAt: undefined }))}>Undo</button>
          : !late && <button className="btn small" onClick={() => onChange((d) => ({ ...d, lipoTakenAt: new Date().toISOString() }))}>Taken</button>}
      </div>
    </section>
  );
}

function StepsSheet({ day, onClose, onSave }: { day: DayLog; onClose: () => void; onSave: (v: number | undefined) => void }) {
  const [v, setV] = useState<number | undefined>(day.steps?.value);
  return (
    <Sheet title="Steps" onClose={onClose}>
      <p className="small muted">Type the steps from the Google Health app. A typed value is never replaced by sync.</p>
      <NumInput ariaLabel="Steps" value={v} onChange={setV} step="1" min={0} />
      <div className="row" style={{ marginTop: 12 }}>
        <button className="btn" onClick={() => { onSave(v === undefined ? undefined : Math.round(v)); onClose(); }}>Save</button>
        {day.steps && <button className="btn secondary" onClick={() => { onSave(undefined); onClose(); }}>Clear</button>}
      </div>
    </Sheet>
  );
}

function SleepSheet({ day, onClose, onSave }: { day: DayLog; onClose: () => void; onSave: (m: number | undefined) => void }) {
  const [h, setH] = useState<number | undefined>(day.sleep ? Math.floor(day.sleep.minutes / 60) : undefined);
  const [m, setM] = useState<number | undefined>(day.sleep ? day.sleep.minutes % 60 : undefined);
  return (
    <Sheet title="Sleep last night" onClose={onClose}>
      <p className="small muted">Time asleep, from the Google Health app or your own estimate.</p>
      <div className="grid2">
        <label className="field">Hours<NumInput ariaLabel="Sleep hours" value={h} onChange={setH} step="1" min={0} /></label>
        <label className="field">Minutes<NumInput ariaLabel="Sleep minutes" value={m} onChange={setM} step="1" min={0} /></label>
      </div>
      <div className="row" style={{ marginTop: 12 }}>
        <button className="btn" disabled={h === undefined && m === undefined}
          onClick={() => { onSave((h ?? 0) * 60 + (m ?? 0)); onClose(); }}>Save</button>
        {day.sleep && <button className="btn secondary" onClick={() => { onSave(undefined); onClose(); }}>Clear</button>}
      </div>
    </Sheet>
  );
}

function WeighInCard({ date, day, lipo }: { date: string; day: DayLog; lipo: boolean }) {
  const existing = useLiveQuery(() => db.weighIns.get(date), [date]);
  const [kg, setKg] = useState<number | undefined>();
  const [waist, setWaist] = useState<number | undefined>();
  const [sys, setSys] = useState<number | undefined>(day.bp?.sys);
  const [dia, setDia] = useState<number | undefined>(day.bp?.dia);
  const [rhr, setRhr] = useState<number | undefined>(day.restingHr?.source === 'manual' ? day.restingHr.value : undefined);

  return (
    <section className="card" aria-label="Weigh-in">
      <div className="card-title"><span className="icon-circle lime"><IconScale /></span><div><h2>Friday weigh-in</h2><div className="sub">After the toilet, before food or water</div></div></div>
      {existing && <p className="small" style={{ marginTop: 10 }}>Saved: <strong className="num">{existing.kg} kg</strong>{existing.waistCm ? `, waist ${existing.waistCm} cm` : ''}</p>}
      <div className="grid2" style={{ marginTop: 12 }}>
        <label className="field">Weight (kg)<NumInput ariaLabel="Weight in kg" value={kg ?? existing?.kg} onChange={setKg} step="0.1" min={30} /></label>
        <label className="field">Waist (cm, optional)<NumInput ariaLabel="Waist in cm" value={waist ?? existing?.waistCm} onChange={setWaist} step="0.5" min={40} /></label>
      </div>
      {lipo && (
        <>
          <p className="small muted" style={{ marginTop: 10 }}>Blood pressure check while taking Lipo 6 (optional):</p>
          <div className="grid3">
            <label className="field">Systolic<NumInput ariaLabel="Systolic" value={sys} onChange={setSys} step="1" /></label>
            <label className="field">Diastolic<NumInput ariaLabel="Diastolic" value={dia} onChange={setDia} step="1" /></label>
            <label className="field">Resting HR<NumInput ariaLabel="Resting heart rate" value={rhr} onChange={setRhr} step="1" /></label>
          </div>
          {sys !== undefined && dia !== undefined && (sys >= 140 || dia >= 90) && (
            <div className="banner bad">This reading is high. Stop Lipo 6 and check with a doctor or pharmacist.</div>
          )}
        </>
      )}
      <button className="btn block" style={{ marginTop: 12 }} disabled={(kg ?? existing?.kg) === undefined}
        onClick={async () => {
          const w = kg ?? existing?.kg;
          if (w === undefined) return;
          await db.weighIns.put({ date, kg: Math.round(w * 10) / 10, waistCm: waist ?? existing?.waistCm });
          await updateDay(date, (d) => ({
            ...d,
            bp: sys !== undefined && dia !== undefined ? { sys, dia } : d.bp,
            restingHr: rhr !== undefined ? { value: rhr, source: 'manual' } : d.restingHr,
          }));
          showToast('Weigh-in saved');
        }}>Save weigh-in</button>
    </section>
  );
}
