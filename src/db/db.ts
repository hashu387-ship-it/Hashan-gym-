import Dexie, { type Table } from 'dexie';
import type { WeighIn } from '../logic/checks';
import type { SetLog } from '../logic/strength';
import type { MealItem, SessionId, Settings } from '../plan/types';

export type Source = 'band' | 'manual';

export interface Sourced<T> {
  value: T;
  source: Source;
}

export interface SleepLog {
  minutes: number;
  start?: string;
  end?: string;
  source: Source;
}

export interface DayLog {
  date: string;
  meals: MealItem[];
  waterMl: number;
  lipoTakenAt?: string;
  steps?: Sourced<number>;
  sleep?: SleepLog;
  restingHr?: Sourced<number>;
  kcalBurned?: Sourced<number>;
  bp?: { sys: number; dia: number };
}

export interface WorkoutLog {
  /** `${date}:${sessionId}` */
  id: string;
  date: string;
  sessionId: SessionId;
  sets: SetLog[];
  cardioMinutes?: number;
  finishedAt?: string;
}

export interface Adjustment {
  date: string;
  fromKcal: number;
  toKcal: number;
  stepsDelta: number;
  rate: number;
  accepted: boolean;
}

export class FitDB extends Dexie {
  settings!: Table<Settings, string>;
  days!: Table<DayLog, string>;
  weighIns!: Table<WeighIn, string>;
  workouts!: Table<WorkoutLog, string>;
  adjustments!: Table<Adjustment, string>;

  constructor(name = 'hashan-fit') {
    super(name);
    this.version(1).stores({
      settings: 'id',
      days: 'date',
      weighIns: 'date',
      workouts: 'id, date, sessionId',
      adjustments: 'date',
    });
  }
}

export const db = new FitDB();
