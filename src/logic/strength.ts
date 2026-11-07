import type { Dose, ExerciseInfo, LoadKind, PhaseId, SessionItem } from '../plan/types';

export interface SetLog {
  exerciseId: string;
  setIndex: number;
  kg?: number;
  reps?: number;
  done: boolean;
}

/** Estimated one-rep max (Epley). */
export function e1rm(kg: number, reps: number): number {
  if (reps <= 1) return kg;
  return Math.round(kg * (1 + reps / 30) * 10) / 10;
}

export function bestE1rm(sets: SetLog[]): number | null {
  let best: number | null = null;
  for (const s of sets) {
    if (!s.done || !s.kg || !s.reps) continue;
    const v = e1rm(s.kg, s.reps);
    if (best === null || v > best) best = v;
  }
  return best;
}

export const LOAD_LABEL: Record<LoadKind, string> = {
  bar: 'total (bar + plates)',
  each: 'each dumbbell',
  single: 'one weight',
  machine: 'on the machine',
  assist: 'assistance (less = harder)',
};

/** How much one step up is, by how the weight is counted. */
export function weightStep(ex: ExerciseInfo): number {
  switch (ex.start?.kind) {
    case 'bar': return ex.body === 'lower' ? 5 : 2.5;
    case 'each': return 2;
    case 'single': return 4;
    case 'machine': return ex.body === 'lower' ? 10 : 5;
    case 'assist': return 5;
    default: return 2.5;
  }
}

const roundTo = (v: number, step: number) => Math.round(v / step) * step;

export interface WeightAdvice {
  /** null = body weight */
  kg: number | null;
  label: string;
  reason: string;
  up: boolean;
}

/**
 * The weight to use today: the starting weight the first time, then +1 step after every set
 * reached the top of the rep range, otherwise the same weight. About 10 percent lighter in the
 * recovery week and in Ramadan.
 */
export function weightAdvice(ex: ExerciseInfo, it: SessionItem, last: SetLog[], dose: Dose, phase: PhaseId): WeightAdvice | null {
  if (it.unit === 'minutes' || it.unit === 'seconds') return null;
  if (!ex.start) return { kg: null, label: 'Body weight', reason: 'No extra weight. Focus on slow, clean reps.', up: false };
  const kind = ex.start.kind;
  const step = weightStep(ex);
  const label = LOAD_LABEL[kind];
  const done = last.filter((s) => s.done && s.kg !== undefined && s.reps);
  const light = phase === 'recovery' || phase === 'ramadan';
  const lighten = (kg: number) => Math.max(0, roundTo(kind === 'assist' ? kg * 1.1 : kg * 0.9, step));

  if (done.length === 0) {
    const kg = light ? lighten(ex.start.kg) : ex.start.kg;
    return { kg, label, up: false, reason: `Starting weight. If ${dose.high} reps feel easy, add ${step} kg next set. If you cannot reach ${dose.low}, go ${step} kg lighter.` };
  }
  const top = kind === 'assist' ? Math.min(...done.map((s) => s.kg!)) : Math.max(...done.map((s) => s.kg!));
  const atTop = done.filter((s) => s.kg === top);
  const minReps = Math.min(...atTop.map((s) => s.reps!));
  const summary = `Last time ${atTop.length}x${minReps} at ${top} kg`;
  if (light) return { kg: lighten(top), label, up: false, reason: `${summary}. Lighter week: about 10 percent less.` };
  if (atTop.length >= dose.sets && minReps >= dose.high) {
    const kg = kind === 'assist' ? Math.max(0, top - step) : top + step;
    return { kg, label, up: true, reason: `${summary}. You hit every rep, so ${kind === 'assist' ? `use ${step} kg less assistance` : `add ${step} kg`}.` };
  }
  return { kg: top, label, up: false, reason: `${summary}. Stay at this weight until every set reaches ${dose.high} reps.` };
}
