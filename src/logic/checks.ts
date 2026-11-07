import type { MealItem, Settings } from '../plan/types';
import { CALORIE_FLOOR, dayContext } from './context';
import { addDays, diffDays, weekday } from './dates';

export interface WeighIn {
  date: string;
  kg: number;
  waistCm?: number;
}

export function dayTotals(meals: MealItem[]): { kcal: number; protein: number } {
  let kcal = 0;
  let protein = 0;
  for (const m of meals) {
    kcal += m.kcal * m.qty;
    protein += m.protein * m.qty;
  }
  return { kcal: Math.round(kcal), protein: Math.round(protein * 10) / 10 };
}

export type Suggestion = 'lower' | 'steps' | 'raise' | 'keep';

export interface CheckResult {
  date: string;
  /** kg lost per week over the last two weeks (positive = losing) */
  rate: number;
  suggestion: Suggestion;
  fromKcal: number;
  toKcal: number;
  stepsDelta: number;
  message: string;
}

const CHECK_WEEKS = [4, 6, 8, 10, 12];

/** True when the two-week check runs on this date (Friday of weeks 4,6,8,10,12, and every other Friday after Eid). */
export function isCheckDay(date: string, s: Settings): boolean {
  if (weekday(date) !== 5) return false;
  const ctx = dayContext(date, s);
  if (ctx.week !== null) return CHECK_WEEKS.includes(ctx.week);
  if (ctx.phase === 'continue') {
    // first Friday on or after the continue phase starts, then every 14 days
    let first = addDays(s.ramadanEnd, 4);
    while (weekday(first) !== 5) first = addDays(first, 1);
    const since = diffDays(date, first);
    return since >= 0 && since % 14 === 0;
  }
  return false;
}

function weighInNear(weighIns: WeighIn[], date: string, tolerance: number): WeighIn | undefined {
  let best: WeighIn | undefined;
  for (const w of weighIns) {
    const gap = Math.abs(diffDays(w.date, date));
    if (gap <= tolerance && (!best || gap < Math.abs(diffDays(best.date, date)))) best = w;
  }
  return best;
}

/** Two-week check (spec A1). Returns null when it is not a check day or a weigh-in is missing. */
export function twoWeekCheck(weighIns: WeighIn[], date: string, s: Settings): CheckResult | null {
  if (!isCheckDay(date, s)) return null;
  const now = weighInNear(weighIns, date, 1);
  const before = weighInNear(weighIns, addDays(date, -14), 2);
  if (!now || !before) return null;
  const days = diffDays(now.date, before.date);
  if (days <= 0) return null;
  const rate = Math.round(((before.kg - now.kg) / (days / 7)) * 100) / 100;
  const fromKcal = s.kcalTarget;

  if (rate < 0.8) {
    if (fromKcal - 150 >= CALORIE_FLOOR) {
      return { date, rate, suggestion: 'lower', fromKcal, toKcal: fromKcal - 150, stepsDelta: 0,
        message: `You lost ${rate} kg a week. Lower calories by 150 to ${fromKcal - 150} kcal.` };
    }
    return { date, rate, suggestion: 'steps', fromKcal, toKcal: fromKcal, stepsDelta: 2000,
      message: `You lost ${rate} kg a week. Calories are at the floor, so add 2,000 steps a day.` };
  }
  if (rate > 1.5) {
    return { date, rate, suggestion: 'raise', fromKcal, toKcal: fromKcal + 150, stepsDelta: 0,
      message: `You lost ${rate} kg a week, faster than needed. Raise calories by 150 to ${fromKcal + 150} kcal.` };
  }
  return { date, rate, suggestion: 'keep', fromKcal, toKcal: fromKcal, stepsDelta: 0,
    message: `You lost ${rate} kg a week. That is right on target. Keep going.` };
}

/** Target weight line for the progress chart (spec B2). */
export function targetWeightAt(date: string, s: Settings): number {
  const points: [string, number][] = [
    [s.startDate, s.startWeightKg],
    [addDays(s.startDate, 90), 83],
    [s.ramadanEnd, 81.5],
    ['2027-04-15', 78],
  ];
  if (date <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    const [d0, w0] = points[i - 1];
    const [d1, w1] = points[i];
    if (date <= d1) {
      const t = diffDays(date, d0) / diffDays(d1, d0);
      return Math.round((w0 + (w1 - w0) * t) * 10) / 10;
    }
  }
  return 78;
}

export function bmi(kg: number, heightCm: number): number {
  const m = heightCm / 100;
  return Math.round((kg / (m * m)) * 10) / 10;
}
