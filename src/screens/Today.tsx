import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { FoodPicker } from '../components/FoodPicker';
import { Bar, NumInput, Sheet, fmtMinutes, showToast, timeAgo } from '../components/ui';
import { db, type DayLog } from '../db/db';
import { emptyDay, saveSettings, updateDay } from '../db/queries';
import { dayTotals, twoWeekCheck } from '../logic/checks';
import { LIPO_CUTOFF_HOUR, dayContext } from '../logic/context';
import { addDays, diffDays, riyadhHour, riyadhTime, shortDate, weekday } from '../logic/dates';
import { SLOT_LABEL } from '../plan/foods';
import { PHASE_EFFORT, SESSIONS } from '../plan/program';
import type { MealItem, MealSlot } from '../plan/types';
import { useApp } from '../state';
import { SYNC_MESSAGES } from '../sync/client';

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));

export function TodayScreen() {
  const { settings, date, setDate, today, setTab, sync, syncNow } = useApp();
  const ctx = dayContext(date, settings);
  const day = useLiveQuery(() => db.days.get(date), [date]) ?? emptyDay(date);
  const weighIns = useLiveQuery(() => db.weighIns.toArray(), []) ?? [];
  const adjustment = useLiveQuery(() => db.adjustments.get(date), [date]);
  const daysLogged = useLiveQuery(() => db.days.count(), []) ?? 0;
  const [picker, setPicker] = useState<MealSlot | null>(null);
  const [editing, setEditing] = useState<'steps' | 'sleep' | null>(null);

  const totals = dayTotals(day.meals);
  const session = SESSIONS[ctx.sessionId];
  const isToday = date === today;
  const check = adjustment ? null : twoWeekCheck(weighIns, date, settings);
  const weighIn = weighIns.find((w) => w.date === date);

  const change = (fn: (d: DayLog) => DayLog) => updateDay(date, fn);
  const addMeal = (slot: MealSlot, item: Omit<MealItem, 'id' | 'slot'>) =>
    change((d) => ({ ...d, meals: [...d.meals, { ...item, id: uid(), slot }] }));

  const backupDue = settings.lastBackupAt
    ? diffDays(today, settings.lastBackupAt.slice(0, 10)) >= 7
    : daysLogged >= 3;

  return (
    <div>
      <div className="header">
        <div>
          <h1>{isToday ? 'Today' : shortDate(date)}</h1>
          <div className="muted small">{isToday ? shortDate(date) : date < today ? 'Past day' : 'Upcoming day'}</div>
          <span className="phase-pill">{ctx.label}</span>
        </div>
        <div className="datenav">
          <button className="btn secondary icon" aria-label="Previous day" onClick={() => setDate(addDays(date, -1))}>&lsaquo;</button>
          {!isToday && <button className="btn secondary small" onClick={() => setDate(today)}>Today</button>}
          <button className="btn secondary icon" aria-label="Next day" onClick={() => setDate(addDays(date, 1))}>&rsaquo;</button>
        </div>
      </div>
      <p className="small muted" style={{ marginTop: 8 }}>{PHASE_EFFORT[ctx.phase]}</p>

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

      {check && (
        <div className="card">
          <h2>Two-week check</h2>
          <p>{check.message}</p>
          <div className="row" style={{ marginTop: 8 }}>
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
        </div>
      )}

      <section className="card" aria-label="Targets">
        <div className="spread">
          <h2 style={{ margin: 0 }}>Targets</h2>
          <span className="small muted">Sleep {ctx.bed} - wake {ctx.wake}</span>
        </div>
        <Bar label="Calories" value={totals.kcal} target={ctx.kcalTarget} unit="kcal" />
        <Bar label="Protein" value={totals.protein} target={ctx.proteinTarget} unit="g" allowOver />
        <Bar label="Steps" value={day.steps?.value ?? 0} target={ctx.stepsTarget} unit="" allowOver />
        <Bar label="Water" value={day.waterMl} target={ctx.waterTargetMl} unit="ml" allowOver />
        <SyncLine />
      </section>

      <section className="card" aria-label="Meals">
        <h2>Meals</h2>
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
                        onClick={() => change((d) => ({ ...d, meals: d.meals.filter((x) => x.id !== m.id) }))}>Remove</button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="row wrap" style={{ marginTop: 6 }}>
                {slot === 'breakfast' && items.length === 0 && (
                  <button className="btn small" onClick={() => change((d) => ({
                    ...d,
                    meals: [...d.meals, ...settings.defaultBreakfast.map((b) => ({ ...b, id: uid(), slot }))],
                  }))}>
                    Add usual breakfast ({dayTotals(settings.defaultBreakfast.map((b) => ({ ...b, id: '', slot }))).kcal} kcal)
                  </button>
                )}
                <button className="btn secondary small" onClick={() => setPicker(slot)}>+ Add food</button>
              </div>
            </div>
          );
        })}
      </section>

      <section className="card" aria-label="Checklist">
        <h2>Checklist</h2>
        {ctx.lipoActive && <LipoRow day={day} isToday={isToday} onChange={change} />}
        <div className="check">
          <div className="label">
            <div>Water</div>
            <div className="tiny muted num">{day.waterMl} of {ctx.waterTargetMl} ml</div>
          </div>
          <button className="btn secondary small" aria-label="Remove a glass" disabled={day.waterMl <= 0}
            onClick={() => change((d) => ({ ...d, waterMl: Math.max(0, d.waterMl - 250) }))}>-</button>
          <button className="btn small" onClick={() => change((d) => ({ ...d, waterMl: d.waterMl + 250 }))}>+250 ml</button>
        </div>
        <div className="check">
          <div className="label">
            <div>Steps</div>
            <div className="tiny muted num">
              {day.steps ? `${day.steps.value.toLocaleString('en-US')} (${day.steps.source === 'band' ? 'Fitbit' : 'typed'})` : 'Not logged'} - target {ctx.stepsTarget.toLocaleString('en-US')}
            </div>
          </div>
          <button className="btn secondary small" onClick={() => setEditing('steps')}>Edit</button>
        </div>
        <div className="check">
          <div className="label">
            <div>Sleep last night</div>
            <div className="tiny muted">
              {day.sleep ? `${fmtMinutes(day.sleep.minutes)} (${day.sleep.source === 'band' ? 'Fitbit' : 'typed'})` : 'Not logged'}
              {day.restingHr && ` - resting HR ${day.restingHr.value}`}
            </div>
          </div>
          <button className="btn secondary small" onClick={() => setEditing('sleep')}>Edit</button>
        </div>
        <div className="check">
          <div className="label">
            <div>Workout: {session.title}</div>
            <div className="tiny muted">{session.focus}</div>
          </div>
          <button className="btn small" onClick={() => setTab('workout')}>Open</button>
        </div>
      </section>

      {(weekday(date) === 5 || weighIn) && <WeighInCard date={date} day={day} lipo={ctx.lipoActive} />}

      {picker && (
        <FoodPicker slot={picker} settings={settings} onClose={() => setPicker(null)}
          onAdd={async (item) => {
            await addMeal(picker, item);
            showToast(`Added ${item.name}`);
          }} />
      )}
      {editing === 'steps' && <StepsSheet day={day} onClose={() => setEditing(null)} onSave={(v) => change((d) => ({ ...d, steps: v === undefined ? undefined : { value: v, source: 'manual' } }))} />}
      {editing === 'sleep' && <SleepSheet day={day} onClose={() => setEditing(null)} onSave={(m) => change((d) => ({ ...d, sleep: m === undefined ? undefined : { minutes: m, source: 'manual' } }))} />}
    </div>
  );
}

function SyncLine() {
  const { settings, sync, syncNow, setTab } = useApp();
  if (sync.status === 'syncing') return <p className="tiny muted" style={{ marginTop: 10 }}>Syncing Fitbit...</p>;
  if (sync.error === 'not_connected' || sync.error === 'not_configured' || !settings.lastSyncAt) {
    return (
      <p className="tiny muted" style={{ marginTop: 10 }}>
        Fitbit not connected. <button className="btn ghost small" onClick={() => setTab('plan')}>Set up</button>
      </p>
    );
  }
  return (
    <p className="tiny muted" style={{ marginTop: 10 }}>
      Fitbit synced {timeAgo(settings.lastSyncAt)}. Data appears after the Google Health app syncs your band.{' '}
      <button className="btn ghost small" onClick={() => void syncNow()}>Sync now</button>
    </p>
  );
}

function LipoRow({ day, isToday, onChange }: { day: DayLog; isToday: boolean; onChange: (fn: (d: DayLog) => DayLog) => void }) {
  const late = isToday && riyadhHour() >= LIPO_CUTOFF_HOUR;
  return (
    <div className="check">
      <div className="label">
        <div>Lipo 6 - 1 capsule</div>
        <div className="tiny muted">
          {day.lipoTakenAt
            ? `Taken at ${riyadhTime(day.lipoTakenAt)}`
            : late ? 'Skip today. It is after 10 AM, so it would hurt your sleep.' : 'Take before 10 AM, between meals. No tea or coffee after 12.'}
        </div>
      </div>
      {day.lipoTakenAt
        ? <button className="btn secondary small" onClick={() => onChange((d) => ({ ...d, lipoTakenAt: undefined }))}>Undo</button>
        : !late && <button className="btn small" onClick={() => onChange((d) => ({ ...d, lipoTakenAt: new Date().toISOString() }))}>Taken</button>}
    </div>
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
      <h2>Friday weigh-in</h2>
      {existing && <p className="small">Saved: <strong className="num">{existing.kg} kg</strong>{existing.waistCm ? `, waist ${existing.waistCm} cm` : ''}</p>}
      <p className="small muted">After the toilet, before food or water. Same scale every week.</p>
      <div className="grid2">
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
