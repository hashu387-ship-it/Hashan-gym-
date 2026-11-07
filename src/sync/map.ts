/** Pure mapping from Google Health API v4 responses to per-day values. */
import { riyadhDateOf } from '../logic/dates';

export interface CivilDate { year: number; month: number; day: number }

export function civilDate(d: CivilDate): string {
  return `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
}

export function toCivil(date: string): CivilDate {
  const [year, month, day] = date.split('-').map(Number);
  return { year, month, day };
}

/** Closed-open civil range for dailyRollUp: from `start` 00:00 to `endExclusive` 00:00. */
export function civilRange(start: string, endExclusive: string) {
  const midnight = { hours: 0, minutes: 0, seconds: 0, nanos: 0 };
  return { start: { date: toCivil(start), time: midnight }, end: { date: toCivil(endExclusive), time: midnight } };
}

interface RollupPoint {
  civilStartTime?: { date?: CivilDate };
  steps?: { countSum?: string | number };
  totalCalories?: { kcalSum?: number | string };
}

export interface RollupResponse {
  rollupDataPoints?: RollupPoint[];
  nextPageToken?: string;
}

export function mapSteps(r: RollupResponse): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of r.rollupDataPoints ?? []) {
    const d = p.civilStartTime?.date;
    const v = p.steps?.countSum;
    if (d && v !== undefined) out[civilDate(d)] = Number(v);
  }
  return out;
}

export function mapCalories(r: RollupResponse): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of r.rollupDataPoints ?? []) {
    const d = p.civilStartTime?.date;
    const v = p.totalCalories?.kcalSum;
    if (d && v !== undefined) out[civilDate(d)] = Math.round(Number(v));
  }
  return out;
}

export interface ListResponse<T> {
  dataPoints?: T[];
  nextPageToken?: string;
}

export interface RestingHrPoint {
  dailyRestingHeartRate?: { date?: CivilDate; beatsPerMinute?: string | number };
}

export function mapRestingHr(r: ListResponse<RestingHrPoint>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of r.dataPoints ?? []) {
    const d = p.dailyRestingHeartRate?.date;
    const v = p.dailyRestingHeartRate?.beatsPerMinute;
    if (d && v !== undefined) out[civilDate(d)] = Number(v);
  }
  return out;
}

export interface SleepPoint {
  sleep?: {
    interval?: { startTime?: string; endTime?: string; civilEndTime?: { date?: CivilDate } };
    summary?: { minutesAsleep?: string | number };
    metadata?: { mainSleep?: boolean; main?: boolean; nap?: boolean };
  };
}

export interface SleepDay { minutes: number; start?: string; end?: string }

/** One sleep per wake-up date: the main sleep, or else the longest non-nap session. */
export function mapSleep(r: ListResponse<SleepPoint>): Record<string, SleepDay> {
  const best: Record<string, { day: SleepDay; main: boolean }> = {};
  for (const p of r.dataPoints ?? []) {
    const s = p.sleep;
    if (!s?.interval?.endTime || s.summary?.minutesAsleep === undefined) continue;
    if (s.metadata?.nap) continue;
    const date = s.interval.civilEndTime?.date ? civilDate(s.interval.civilEndTime.date) : riyadhDateOf(s.interval.endTime);
    const day: SleepDay = { minutes: Number(s.summary.minutesAsleep), start: s.interval.startTime, end: s.interval.endTime };
    const main = s.metadata?.mainSleep === true || s.metadata?.main === true;
    const cur = best[date];
    if (!cur || (main && !cur.main) || (main === cur.main && day.minutes > cur.day.minutes)) best[date] = { day, main };
  }
  return Object.fromEntries(Object.entries(best).map(([d, v]) => [d, v.day]));
}
