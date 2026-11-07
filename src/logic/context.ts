import { PHASE_LABEL, RAMADAN_SCHEDULE, WEEK_SCHEDULE } from '../plan/program';
import type { DayContext, MealSlot, PhaseId, SessionId, Settings } from '../plan/types';
import { addDays, diffDays, weekday } from './dates';

export const MAIN_WEEKS = 13;
export const CALORIE_FLOOR = 1600;
export const RAMADAN_KCAL = 1950;
export const RAMADAN_PROTEIN = 150;
export const EID_DAYS = 3;

const NORMAL_SLOTS: MealSlot[] = ['breakfast', 'lunch', 'snack', 'dinner'];
const RAMADAN_SLOTS: MealSlot[] = ['suhoor', 'iftar', 'main', 'afterGym'];

function phaseOf(date: string, s: Settings): { phase: PhaseId; week: number | null; ramadanDay: number | null } {
  if (date >= s.ramadanStart && date <= s.ramadanEnd) {
    return { phase: 'ramadan', week: null, ramadanDay: diffDays(date, s.ramadanStart) + 1 };
  }
  const sinceStart = diffDays(date, s.startDate);
  if (sinceStart < 0) return { phase: 'before', week: null, ramadanDay: null };
  const week = Math.floor(sinceStart / 7) + 1;
  if (week <= MAIN_WEEKS && date < s.ramadanStart) {
    const phase: PhaseId = week <= 4 ? 'foundation' : week <= 8 ? 'build' : week === 9 ? 'recovery' : 'push';
    return { phase, week, ramadanDay: null };
  }
  if (date < s.ramadanStart) return { phase: 'transition', week: null, ramadanDay: null };
  if (date <= addDays(s.ramadanEnd, EID_DAYS)) return { phase: 'eid', week: null, ramadanDay: null };
  return { phase: 'continue', week: null, ramadanDay: null };
}

function sessionFor(date: string, phase: PhaseId): SessionId {
  if (phase === 'before' || phase === 'transition' || phase === 'eid') return 'rest';
  const wd = weekday(date);
  return phase === 'ramadan' ? RAMADAN_SCHEDULE[wd] : WEEK_SCHEDULE[wd];
}

function stepsFor(phase: PhaseId, week: number | null, bonus: number): number {
  if (phase === 'ramadan' || phase === 'eid' || phase === 'before') return 7000;
  if (week !== null && week <= 3) return 6000 + week * 1000 + bonus;
  return 10000 + bonus;
}

function sleepFor(phase: PhaseId, week: number | null): { bed: string; wake: string } {
  if (phase === 'ramadan') return { bed: '23:30', wake: '04:00' };
  if (phase === 'before' || week === 1) return { bed: '23:15', wake: '06:30' };
  if (week === 2) return { bed: '22:45', wake: '06:15' };
  return { bed: '22:30', wake: '06:00' };
}

function labelFor(phase: PhaseId, week: number | null, ramadanDay: number | null): string {
  if (phase === 'ramadan') return `Ramadan - day ${ramadanDay}`;
  if (week !== null) return `Week ${week} of ${MAIN_WEEKS} - ${PHASE_LABEL[phase]}`;
  return PHASE_LABEL[phase];
}

/** Everything the app needs to know about one date (spec A1-A6). */
export function dayContext(date: string, s: Settings): DayContext {
  const { phase, week, ramadanDay } = phaseOf(date, s);
  const ramadan = phase === 'ramadan';
  const { bed, wake } = sleepFor(phase, week);
  return {
    date,
    phase,
    week,
    ramadanDay,
    sessionId: sessionFor(date, phase),
    kcalTarget: ramadan ? RAMADAN_KCAL : Math.max(CALORIE_FLOOR, s.kcalTarget),
    proteinTarget: ramadan ? RAMADAN_PROTEIN : s.proteinTarget,
    stepsTarget: stepsFor(phase, week, s.stepsBonus),
    waterTargetMl: ramadan ? 2500 : 3000,
    lipoActive: s.lipoEnabled && !ramadan && date >= s.startDate && date <= s.lipoEndDate,
    bed,
    wake,
    mealSlots: ramadan ? RAMADAN_SLOTS : NORMAL_SLOTS,
    label: labelFor(phase, week, ramadanDay),
  };
}

/** Lipo 6 may only be taken before 10:00 AM Riyadh time. */
export const LIPO_CUTOFF_HOUR = 10;
