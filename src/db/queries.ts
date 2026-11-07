import type { SetLog } from '../logic/strength';
import { DEFAULT_SETTINGS } from '../plan/defaults';
import type { SessionId, Settings } from '../plan/types';
import { db as defaultDb, type DayLog, type FitDB, type SleepLog, type WorkoutLog } from './db';

export async function getSettings(db: FitDB = defaultDb): Promise<Settings> {
  const s = await db.settings.get('main');
  if (s) return { ...DEFAULT_SETTINGS, ...s };
  await db.settings.put(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

export async function saveSettings(patch: Partial<Settings>, db: FitDB = defaultDb): Promise<Settings> {
  const next = { ...(await getSettings(db)), ...patch, id: 'main' as const };
  await db.settings.put(next);
  return next;
}

export function emptyDay(date: string): DayLog {
  return { date, meals: [], waterMl: 0 };
}

export async function getDay(date: string, db: FitDB = defaultDb): Promise<DayLog> {
  return (await db.days.get(date)) ?? emptyDay(date);
}

export async function updateDay(date: string, fn: (d: DayLog) => DayLog, db: FitDB = defaultDb): Promise<DayLog> {
  return db.transaction('rw', db.days, async () => {
    const next = fn(structuredClone(await getDay(date, db)));
    await db.days.put(next);
    return next;
  });
}

export function workoutId(date: string, sessionId: SessionId): string {
  return `${date}:${sessionId}`;
}

export async function getWorkout(date: string, sessionId: SessionId, db: FitDB = defaultDb): Promise<WorkoutLog> {
  return (await db.workouts.get(workoutId(date, sessionId))) ?? { id: workoutId(date, sessionId), date, sessionId, sets: [] };
}

/** Sets from the most recent earlier workout that included this exercise. */
export async function lastSetsFor(exerciseId: string, beforeDate: string, db: FitDB = defaultDb): Promise<SetLog[]> {
  const earlier = await db.workouts.where('date').below(beforeDate).reverse().sortBy('date');
  for (const w of earlier) {
    const sets = w.sets.filter((s) => s.exerciseId === exerciseId && s.done);
    if (sets.length) return sets;
  }
  return [];
}

export interface BandDay {
  steps?: number;
  kcalBurned?: number;
  restingHr?: number;
  sleep?: Omit<SleepLog, 'source'>;
}

/** Writes synced band values. Manual entries are never overwritten. */
export async function applyBandData(updates: Record<string, BandDay>, db: FitDB = defaultDb): Promise<number> {
  let changed = 0;
  await db.transaction('rw', db.days, async () => {
    for (const [date, u] of Object.entries(updates)) {
      const day = await getDay(date, db);
      if (u.steps !== undefined && day.steps?.source !== 'manual') day.steps = { value: u.steps, source: 'band' };
      if (u.kcalBurned !== undefined && day.kcalBurned?.source !== 'manual') day.kcalBurned = { value: u.kcalBurned, source: 'band' };
      if (u.restingHr !== undefined && day.restingHr?.source !== 'manual') day.restingHr = { value: u.restingHr, source: 'band' };
      if (u.sleep !== undefined && day.sleep?.source !== 'manual') day.sleep = { ...u.sleep, source: 'band' };
      await db.days.put(day);
      changed++;
    }
  });
  return changed;
}
