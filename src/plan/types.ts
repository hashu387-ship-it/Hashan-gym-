export type PhaseId =
  | 'before'
  | 'foundation'
  | 'build'
  | 'recovery'
  | 'push'
  | 'transition'
  | 'ramadan'
  | 'eid'
  | 'continue';

export type SessionId =
  | 'upperA'
  | 'lowerA'
  | 'upperB'
  | 'lowerB'
  | 'circuit'
  | 'cardio'
  | 'rest'
  | 'ramadanWalk';

export type MealSlot =
  | 'breakfast'
  | 'lunch'
  | 'snack'
  | 'dinner'
  | 'suhoor'
  | 'iftar'
  | 'main'
  | 'afterGym';

export type FoodGroup = 'go' | 'careful' | 'avoid' | 'home';

export interface Food {
  id: string;
  name: string;
  portion: string;
  kcal: number;
  protein: number;
  group: FoodGroup;
}

export type BodyPart = 'upper' | 'lower' | 'core' | 'full';
/** How a set is measured: reps, seconds held, reps per leg/side, metres carried, or minutes of cardio. */
export type SetUnit = 'reps' | 'seconds' | 'perSide' | 'metres' | 'minutes';

export interface ExerciseInfo {
  id: string;
  name: string;
  body: BodyPart;
  /** free-exercise-db folder id; frames live at /demos/<demo>/0.jpg and 1.jpg */
  demo: string;
  muscles: string;
  how: string[];
  avoid: string[];
}

export interface Dose {
  sets: number;
  low: number;
  high: number;
}

export interface SessionItem {
  exerciseId: string;
  main: boolean;
  unit: SetUnit;
  /** Foundation phase (and Ramadan / recovery reps) */
  base: Dose;
  /** Build, push and continue phases; defaults to base */
  later?: Dose;
  alternatives: string[];
}

export interface Session {
  id: SessionId;
  title: string;
  focus: string;
  kind: 'weights' | 'circuit' | 'cardio' | 'rest';
  items: SessionItem[];
  /** Plain-language notes shown at the top of the session */
  notes: string[];
}

export interface MealItem {
  id: string;
  slot: MealSlot;
  foodId?: string;
  name: string;
  kcal: number;
  protein: number;
  qty: number;
}

export interface Settings {
  id: 'main';
  startDate: string;
  startWeightKg: number;
  heightCm: number;
  kcalTarget: number;
  proteinTarget: number;
  stepsBonus: number;
  lipoEnabled: boolean;
  lipoEndDate: string;
  ramadanStart: string;
  ramadanEnd: string;
  defaultBreakfast: Omit<MealItem, 'id' | 'slot'>[];
  /** exerciseId -> chosen alternative exerciseId */
  swaps: Record<string, string>;
  /** User-edited food values, keyed by food id */
  foodOverrides: Record<string, { kcal: number; protein: number }>;
  lastBackupAt?: string;
  lastSyncAt?: string;
  /** Set once the first-run welcome screen has been passed */
  welcomed?: boolean;
}

export interface DayContext {
  date: string;
  phase: PhaseId;
  week: number | null;
  ramadanDay: number | null;
  sessionId: SessionId;
  kcalTarget: number;
  proteinTarget: number;
  stepsTarget: number;
  waterTargetMl: number;
  lipoActive: boolean;
  bed: string;
  wake: string;
  mealSlots: MealSlot[];
  label: string;
}
