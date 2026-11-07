import type { Dose, ExerciseInfo, SessionItem } from '../plan/types';

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

/** "Last time 3x10 at 60 kg - try 62.5 kg" when every set reached the top of the range. */
export function progressionHint(ex: ExerciseInfo, it: SessionItem, last: SetLog[], dose: Dose): string | null {
  if (it.unit === 'minutes' || it.unit === 'seconds' || it.unit === 'metres') return null;
  const done = last.filter((s) => s.done && s.kg && s.reps);
  if (done.length === 0) return null;
  const topKg = Math.max(...done.map((s) => s.kg!));
  const atTop = done.filter((s) => s.kg === topKg);
  const minReps = Math.min(...atTop.map((s) => s.reps!));
  const summary = `Last time ${atTop.length}x${minReps} at ${topKg} kg`;
  if (atTop.length >= dose.sets && minReps >= dose.high) {
    const step = ex.body === 'lower' ? 5 : 2.5;
    return `${summary} - try ${topKg + step} kg`;
  }
  return summary;
}
