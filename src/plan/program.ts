import type { Dose, PhaseId, Session, SessionId, SessionItem, SetUnit } from './types';

const d = (sets: number, low: number, high = low): Dose => ({ sets, low, high });

function item(
  exerciseId: string,
  base: Dose,
  opts: { main?: boolean; unit?: SetUnit; later?: Dose; alternatives?: string[] } = {},
): SessionItem {
  return {
    exerciseId,
    base,
    main: opts.main ?? false,
    unit: opts.unit ?? 'reps',
    later: opts.later,
    alternatives: opts.alternatives ?? [],
  };
}

const finisher = item('incline-walk', d(1, 15), { unit: 'minutes', alternatives: ['stationary-bike', 'elliptical'] });

export const SESSIONS: Record<SessionId, Session> = {
  upperA: {
    id: 'upperA', title: 'Upper A', focus: 'Chest, shoulders, triceps', kind: 'weights',
    notes: ['About 60 minutes of weights, then a 15-minute incline walk.'],
    items: [
      item('bench-press', d(3, 8, 10), { main: true, later: d(4, 6, 8), alternatives: ['db-bench', 'machine-chest-press'] }),
      item('seated-cable-row', d(3, 10, 12), { alternatives: ['machine-row', 'one-arm-db-row'] }),
      item('incline-db-press', d(3, 10, 12)),
      item('db-shoulder-press', d(3, 10, 12)),
      item('lateral-raise', d(3, 12, 15)),
      item('rope-pushdown', d(3, 12, 15)),
      finisher,
    ],
  },
  lowerA: {
    id: 'lowerA', title: 'Lower A', focus: 'Squat focus', kind: 'weights',
    notes: ['About 60 minutes of weights, then a 15-minute incline walk.'],
    items: [
      item('back-squat', d(3, 8, 10), { main: true, later: d(4, 6, 8), alternatives: ['hack-squat', 'smith-squat', 'goblet-squat'] }),
      item('db-rdl', d(3, 10, 12)),
      item('leg-press', d(3, 10, 12), { alternatives: ['hack-squat', 'goblet-squat'] }),
      item('lying-leg-curl', d(3, 12, 15), { alternatives: ['seated-leg-curl'] }),
      item('standing-calf', d(3, 12, 15)),
      item('plank', d(3, 30, 45), { unit: 'seconds' }),
      finisher,
    ],
  },
  upperB: {
    id: 'upperB', title: 'Upper B', focus: 'Back, biceps', kind: 'weights',
    notes: ['About 60 minutes of weights, then a 15-minute incline walk.'],
    items: [
      item('lat-pulldown', d(3, 8, 10), { main: true, later: d(4, 6, 8), alternatives: ['assisted-pullup', 'single-arm-pulldown'] }),
      item('chest-supported-row', d(3, 8, 10), { alternatives: ['tbar-row', 'machine-row'] }),
      item('machine-chest-press', d(3, 10, 12), { alternatives: ['db-bench'] }),
      item('face-pull', d(3, 12, 15)),
      item('db-curl', d(3, 10, 12)),
      item('hammer-curl', d(2, 12, 15)),
      finisher,
    ],
  },
  lowerB: {
    id: 'lowerB', title: 'Lower B', focus: 'Hip hinge', kind: 'weights',
    notes: ['About 60 minutes of weights, then a 15-minute incline walk.'],
    items: [
      item('trap-bar-deadlift', d(3, 6, 8), { main: true, later: d(4, 5, 6), alternatives: ['deadlift', 'barbell-rdl'] }),
      item('bulgarian-split-squat', d(3, 10), { unit: 'perSide', alternatives: ['walking-lunge', 'step-up'] }),
      item('hip-thrust', d(3, 10, 12), { alternatives: ['glute-bridge', 'cable-pull-through'] }),
      item('leg-extension', d(3, 12, 15)),
      item('seated-calf', d(3, 15)),
      item('cable-crunch', d(3, 12, 15)),
      finisher,
    ],
  },
  circuit: {
    id: 'circuit', title: 'Full-body circuit', focus: 'Conditioning and core', kind: 'circuit',
    notes: [
      'Do one set of each of the first 5 moves in a row, then rest 90 seconds. That is one round. Do 4 rounds.',
      'Then do the core work, then the 15-minute incline walk.',
    ],
    items: [
      item('goblet-squat', d(4, 12)),
      item('push-up', d(4, 10, 15), { alternatives: ['incline-push-up'] }),
      item('one-arm-db-row', d(4, 12), { unit: 'perSide' }),
      item('kb-swing', d(4, 15)),
      item('farmer-carry', d(4, 30), { unit: 'metres' }),
      item('dead-bug', d(3, 10)),
      item('side-plank', d(2, 30), { unit: 'seconds' }),
      finisher,
    ],
  },
  fullBody: {
    id: 'fullBody', title: 'Full body', focus: 'Squat, press, row', kind: 'weights',
    notes: ['A 6th weight session with different exercises from the other days, so those muscles can recover. About 60 minutes, then a 15-minute incline walk.'],
    items: [
      item('hack-squat', d(3, 10, 12), { alternatives: ['goblet-squat', 'leg-press'] }),
      item('db-bench', d(3, 10, 12), { alternatives: ['machine-chest-press', 'push-up'] }),
      item('machine-row', d(3, 10, 12), { alternatives: ['seated-cable-row', 'one-arm-db-row'] }),
      item('db-shoulder-press', d(3, 10, 12)),
      item('walking-lunge', d(2, 10), { unit: 'perSide', alternatives: ['step-up'] }),
      item('plank', d(3, 30, 45), { unit: 'seconds' }),
      finisher,
    ],
  },
  cardio: {
    id: 'cardio', title: 'Easy cardio', focus: '45-60 minutes, talking pace', kind: 'cardio',
    notes: ['Keep your heart rate around 113-132 bpm. Choose the treadmill, bike or elliptical.'],
    items: [item('incline-walk', d(1, 45, 60), { unit: 'minutes', alternatives: ['stationary-bike', 'elliptical'] })],
  },
  ramadanWalk: {
    id: 'ramadanWalk', title: 'Walk after iftar', focus: '30 minutes, easy', kind: 'cardio',
    notes: ['A relaxed 30-minute walk after iftar. Drink water before and after.'],
    items: [item('incline-walk', d(1, 30), { unit: 'minutes', alternatives: ['stationary-bike', 'elliptical'] })],
  },
  rest: {
    id: 'rest', title: 'Rest day', focus: 'Recover, just walk', kind: 'rest',
    notes: ['No gym today. Get your steps, drink water and sleep well.'],
    items: [],
  },
};

/** Normal week: Sunday (0) to Saturday (6). Friday is the only rest day. */
export const WEEK_SCHEDULE: SessionId[] = ['upperA', 'lowerA', 'upperB', 'lowerB', 'circuit', 'rest', 'fullBody'];
/** Ramadan week: 4 lighter weight sessions Sunday-Wednesday, walk on Saturday. */
export const RAMADAN_SCHEDULE: SessionId[] = ['upperA', 'lowerA', 'upperB', 'lowerB', 'rest', 'rest', 'ramadanWalk'];

/** Items shown for a session in a phase (Ramadan keeps the first 4 exercises, no finisher). */
export function sessionItems(session: Session, phase: PhaseId): SessionItem[] {
  if (phase === 'ramadan' && session.kind === 'weights') return session.items.slice(0, 4);
  return session.items;
}

/** Sets and rep range for an item in a phase (spec A3 and A5). */
export function prescription(it: SessionItem, phase: PhaseId): Dose {
  if (it.unit === 'minutes') return it.base;
  switch (phase) {
    case 'build':
    case 'push':
    case 'continue':
      return it.later ?? it.base;
    case 'recovery':
      return { ...it.base, sets: 2 };
    case 'ramadan':
      return { ...it.base, sets: 3 };
    default:
      return it.base;
  }
}

export const PHASE_LABEL: Record<PhaseId, string> = {
  before: 'Starts Sunday 8 Nov',
  foundation: 'Foundation',
  build: 'Build',
  recovery: 'Recovery week',
  push: 'Push',
  transition: 'Transition day',
  ramadan: 'Ramadan',
  eid: 'Eid',
  continue: 'Continue to 78 kg',
};

export const PHASE_EFFORT: Record<PhaseId, string> = {
  before: 'Get ready: buy Greek yogurt or whey, check your blood pressure, set up the app.',
  foundation: 'Stop each set about 3 reps before failure. Learn good form.',
  build: 'Main lifts 4 sets. Stop about 2 reps before failure.',
  recovery: '2 sets per exercise, about 10 percent lighter. Let your body recover.',
  push: 'Main lifts 4 sets at the lower rep range. Stop 1-2 reps before failure.',
  transition: 'Rest day before Ramadan.',
  ramadan: '3 sets of the first 4 exercises, about 3 reps before failure. About 45 minutes.',
  eid: 'Rest and enjoy Eid. Light walking.',
  continue: 'Same as the Push phase. Keep going until 78 kg.',
};

export function restSeconds(it: SessionItem): number {
  return it.main ? 120 : 75;
}
