import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../plan/defaults';
import { EXERCISE_BY_ID } from '../plan/exercises';
import { SESSIONS, prescription, sessionItems } from '../plan/program';
import { ramadanEvents, workDayEvents } from '../plan/calendar';
import type { Settings } from '../plan/types';
import { dayContext } from './context';
import { addDays, diffDays, riyadhHour, todayRiyadh, weekday } from './dates';
import { bmi, dayTotals, isCheckDay, targetWeightAt, twoWeekCheck, type WeighIn } from './checks';
import { e1rm, weightAdvice } from './strength';
import { buildIcs } from './ics';

const s: Settings = DEFAULT_SETTINGS;

describe('dates', () => {
  it('uses Riyadh time', () => {
    // 22:30 UTC on 7 Nov is 01:30 on 8 Nov in Riyadh
    expect(todayRiyadh(new Date('2026-11-07T22:30:00Z'))).toBe('2026-11-08');
    expect(riyadhHour(new Date('2026-11-08T06:59:00Z'))).toBe(9);
  });
  it('adds and diffs days across months and years', () => {
    expect(addDays('2026-11-08', 90)).toBe('2027-02-06');
    expect(diffDays('2027-01-02', '2026-11-08')).toBe(55);
    expect(weekday('2026-11-08')).toBe(0);
    expect(weekday('2026-11-13')).toBe(5);
  });
});

describe('dayContext phases', () => {
  const cases: [string, string, number | null][] = [
    ['2026-11-07', 'before', null],
    ['2026-11-08', 'foundation', 1],
    ['2026-12-05', 'foundation', 4],
    ['2026-12-06', 'build', 5],
    ['2027-01-03', 'recovery', 9],
    ['2027-01-10', 'push', 10],
    ['2027-02-06', 'push', 13],
    ['2027-02-07', 'transition', null],
    ['2027-02-08', 'ramadan', null],
    ['2027-03-09', 'ramadan', null],
    ['2027-03-10', 'eid', null],
    ['2027-03-12', 'eid', null],
    ['2027-03-13', 'continue', null],
    ['2027-06-01', 'continue', null],
  ];
  for (const [date, phase, week] of cases) {
    it(`${date} is ${phase}`, () => {
      const c = dayContext(date, s);
      expect(c.phase).toBe(phase);
      expect(c.week).toBe(week);
    });
  }

  it('never labels a week 0 before the start', () => {
    expect(dayContext('2026-11-01', s).label).toBe('Starts Sunday 8 Nov');
  });

  it('counts Ramadan days', () => {
    expect(dayContext('2027-02-08', s).ramadanDay).toBe(1);
    expect(dayContext('2027-02-12', s).label).toBe('Ramadan - day 5');
  });

  it('follows the weekly schedule', () => {
    expect(dayContext('2026-11-08', s).sessionId).toBe('upperA'); // Sunday
    expect(dayContext('2026-11-12', s).sessionId).toBe('circuit'); // Thursday
    expect(dayContext('2026-11-13', s).sessionId).toBe('rest'); // Friday
    expect(dayContext('2026-11-14', s).sessionId).toBe('fullBody'); // Saturday: weights, Friday is the only rest day
    expect(dayContext('2027-02-11', s).sessionId).toBe('rest'); // Ramadan Thursday
    expect(dayContext('2027-02-13', s).sessionId).toBe('ramadanWalk'); // Ramadan Saturday
    expect(dayContext('2027-02-07', s).sessionId).toBe('rest');
  });
});

describe('daily targets', () => {
  it('ramps steps 7000, 8000, 9000 then 10000', () => {
    expect(dayContext('2026-11-08', s).stepsTarget).toBe(7000);
    expect(dayContext('2026-11-15', s).stepsTarget).toBe(8000);
    expect(dayContext('2026-11-22', s).stepsTarget).toBe(9000);
    expect(dayContext('2026-11-29', s).stepsTarget).toBe(10000);
    expect(dayContext('2026-11-29', { ...s, stepsBonus: 2000 }).stepsTarget).toBe(12000);
  });
  it('limits Lipo 6 to 8 Nov - 2 Jan and never Ramadan', () => {
    expect(dayContext('2026-11-07', s).lipoActive).toBe(false);
    expect(dayContext('2026-11-08', s).lipoActive).toBe(true);
    expect(dayContext('2027-01-02', s).lipoActive).toBe(true);
    expect(dayContext('2027-01-03', s).lipoActive).toBe(false);
    expect(dayContext('2027-02-10', { ...s, lipoEndDate: '2027-12-31' }).lipoActive).toBe(false);
    expect(dayContext('2026-11-10', { ...s, lipoEnabled: false }).lipoActive).toBe(false);
  });
  it('switches to Ramadan food targets and meal slots', () => {
    const c = dayContext('2027-02-20', s);
    expect(c.kcalTarget).toBe(1950);
    expect(c.proteinTarget).toBe(150);
    expect(c.mealSlots).toEqual(['suhoor', 'iftar', 'main', 'afterGym']);
    expect(c.waterTargetMl).toBe(2500);
  });
  it('never goes below the 1600 kcal floor', () => {
    expect(dayContext('2026-11-10', { ...s, kcalTarget: 1400 }).kcalTarget).toBe(1600);
  });
  it('moves bedtime earlier over the first two weeks', () => {
    expect(dayContext('2026-11-08', s).bed).toBe('23:15');
    expect(dayContext('2026-11-15', s).bed).toBe('22:45');
    expect(dayContext('2026-11-22', s).bed).toBe('22:30');
    expect(dayContext('2026-11-22', s).wake).toBe('06:00');
  });
});

describe('prescription', () => {
  const bench = SESSIONS.upperA.items[0];
  const row = SESSIONS.upperA.items[1];
  it('uses base sets in foundation and later sets in build and push', () => {
    expect(prescription(bench, 'foundation')).toEqual({ sets: 3, low: 8, high: 10 });
    expect(prescription(bench, 'build')).toEqual({ sets: 4, low: 6, high: 8 });
    expect(prescription(bench, 'push')).toEqual({ sets: 4, low: 6, high: 8 });
    expect(prescription(row, 'build')).toEqual({ sets: 3, low: 10, high: 12 });
  });
  it('uses 2 sets in recovery and 3 sets of 4 exercises in Ramadan', () => {
    expect(prescription(row, 'recovery').sets).toBe(2);
    expect(prescription(bench, 'ramadan')).toEqual({ sets: 3, low: 8, high: 10 });
    expect(sessionItems(SESSIONS.upperA, 'ramadan')).toHaveLength(4);
    expect(sessionItems(SESSIONS.upperA, 'build')).toHaveLength(7);
    expect(sessionItems(SESSIONS.fullBody, 'foundation')).toHaveLength(7);
  });
});

describe('totals and two-week check', () => {
  it('adds meal quantities', () => {
    const meals = s.defaultBreakfast.map((m, i) => ({ ...m, id: String(i), slot: 'breakfast' as const }));
    expect(dayTotals(meals)).toEqual({ kcal: 650, protein: 37.5 });
  });

  const weigh = (pairs: [string, number][]): WeighIn[] => pairs.map(([date, kg]) => ({ date, kg }));
  // Week 4 Friday is 4 Dec; two weeks earlier is 20 Nov
  it('runs only on the Fridays of weeks 4, 6, 8, 10 and 12', () => {
    expect(isCheckDay('2026-12-04', s)).toBe(true);
    expect(isCheckDay('2026-11-27', s)).toBe(false);
    expect(isCheckDay('2026-12-18', s)).toBe(true);
    expect(isCheckDay('2027-01-29', s)).toBe(true);
    expect(isCheckDay('2027-02-05', s)).toBe(false);
    expect(isCheckDay('2027-02-19', s)).toBe(false);
  });
  it('suggests -150 kcal when losing under 0.8 kg a week', () => {
    const r = twoWeekCheck(weigh([['2026-11-20', 92], ['2026-12-04', 91]]), '2026-12-04', s)!;
    expect(r.rate).toBe(0.5);
    expect(r.suggestion).toBe('lower');
    expect(r.toKcal).toBe(1650);
  });
  it('adds 2000 steps instead when calories are near the floor', () => {
    const r = twoWeekCheck(weigh([['2026-11-20', 92], ['2026-12-04', 91]]), '2026-12-04', { ...s, kcalTarget: 1650 })!;
    expect(r.suggestion).toBe('steps');
    expect(r.stepsDelta).toBe(2000);
    expect(r.toKcal).toBe(1650);
  });
  it('suggests +150 kcal when losing over 1.5 kg a week', () => {
    const r = twoWeekCheck(weigh([['2026-11-20', 93.6], ['2026-12-04', 90]]), '2026-12-04', s)!;
    expect(r.rate).toBe(1.8);
    expect(r.suggestion).toBe('raise');
    expect(r.toKcal).toBe(1950);
  });
  it('keeps the target when on pace', () => {
    expect(twoWeekCheck(weigh([['2026-11-20', 92], ['2026-12-04', 90]]), '2026-12-04', s)!.suggestion).toBe('keep');
  });
  it('returns null when a weigh-in is missing', () => {
    expect(twoWeekCheck(weigh([['2026-12-04', 90]]), '2026-12-04', s)).toBeNull();
    expect(twoWeekCheck(weigh([['2026-11-20', 92]]), '2026-12-04', s)).toBeNull();
    expect(twoWeekCheck([], '2026-12-04', s)).toBeNull();
  });
  it('accepts a weigh-in one day late', () => {
    expect(twoWeekCheck(weigh([['2026-11-20', 92], ['2026-12-05', 90]]), '2026-12-04', s)).not.toBeNull();
  });
  it('draws the target line 96 -> 83 -> 81.5 -> 78', () => {
    expect(targetWeightAt('2026-11-08', s)).toBe(96);
    expect(targetWeightAt('2027-02-06', s)).toBe(83);
    expect(targetWeightAt('2027-03-09', s)).toBe(81.5);
    expect(targetWeightAt('2027-05-01', s)).toBe(78);
  });
  it('computes BMI', () => {
    expect(bmi(96, 165)).toBe(35.3);
    expect(bmi(78, 165)).toBe(28.7);
  });
});

describe('strength', () => {
  it('estimates one-rep max', () => {
    expect(e1rm(100, 10)).toBe(133.3);
    expect(e1rm(80, 1)).toBe(80);
  });
  const sets = (id: string, kg: number, reps: number, n = 3) =>
    Array.from({ length: n }, (_, i) => ({ exerciseId: id, setIndex: i, kg, reps, done: true }));
  const bench = SESSIONS.upperA.items[0];
  const squat = SESSIONS.lowerA.items[0];
  const curl = SESSIONS.upperB.items[4];
  const dose = { sets: 3, low: 8, high: 10 };

  it('starts every weighted exercise at its starting weight', () => {
    const a = weightAdvice(EXERCISE_BY_ID['bench-press'], bench, [], dose, 'foundation')!;
    expect(a.kg).toBe(40);
    expect(a.label).toBe('total (bar + plates)');
    expect(a.reason).toContain('Starting weight');
    expect(weightAdvice(EXERCISE_BY_ID['back-squat'], squat, [], dose, 'foundation')!.kg).toBe(40);
    expect(weightAdvice(EXERCISE_BY_ID['db-curl'], curl, [], dose, 'foundation')).toMatchObject({ kg: 8, label: 'each dumbbell' });
  });
  it('adds one step after every set reached the top of the range', () => {
    expect(weightAdvice(EXERCISE_BY_ID['bench-press'], bench, sets('bench-press', 40, 10), dose, 'foundation')).toMatchObject({ kg: 42.5, up: true });
    expect(weightAdvice(EXERCISE_BY_ID['back-squat'], squat, sets('back-squat', 40, 10), dose, 'foundation')).toMatchObject({ kg: 45, up: true });
    expect(weightAdvice(EXERCISE_BY_ID['db-curl'], curl, sets('db-curl', 8, 10), dose, 'build')).toMatchObject({ kg: 10, up: true });
  });
  it('stays at the same weight until every set hits the top', () => {
    const a = weightAdvice(EXERCISE_BY_ID['bench-press'], bench, sets('bench-press', 40, 8), dose, 'foundation')!;
    expect(a).toMatchObject({ kg: 40, up: false });
    expect(a.reason).toBe('Last time 3x8 at 40 kg. Stay at this weight until every set reaches 10 reps.');
    expect(weightAdvice(EXERCISE_BY_ID['bench-press'], bench, sets('bench-press', 40, 10, 2), dose, 'foundation')!.kg).toBe(40);
  });
  it('goes about 10 percent lighter in the recovery week and Ramadan', () => {
    expect(weightAdvice(EXERCISE_BY_ID['back-squat'], squat, sets('back-squat', 60, 8), dose, 'recovery')!.kg).toBe(55);
    expect(weightAdvice(EXERCISE_BY_ID['bench-press'], bench, sets('bench-press', 50, 8), dose, 'ramadan')!.kg).toBe(45);
  });
  it('lowers assistance for assisted pull-ups and shows body weight when there is no load', () => {
    const lat = SESSIONS.upperB.items[0];
    expect(weightAdvice(EXERCISE_BY_ID['assisted-pullup'], lat, sets('assisted-pullup', 40, 10), dose, 'foundation')).toMatchObject({ kg: 35, up: true });
    const plank = SESSIONS.lowerA.items[5];
    expect(weightAdvice(EXERCISE_BY_ID['plank'], plank, [], dose, 'foundation')).toBeNull();
    const lunge = SESSIONS.fullBody.items[4];
    expect(weightAdvice(EXERCISE_BY_ID['walking-lunge'], lunge, [], dose, 'foundation')).toMatchObject({ kg: null, label: 'Body weight' });
  });
});

describe('calendar files', () => {
  it('builds the work-day calendar', () => {
    const ics = buildIcs('Hashan Fit', workDayEvents());
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(15);
    expect(ics).toContain('DTSTART;TZID=Asia/Riyadh:20261108T190000');
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=SU,MO,TU,WE,TH,SA;UNTIL=20270206T205959Z');
    expect(ics).toContain('DTSTART;TZID=Asia/Riyadh:20261108T090000');
    expect(ics).toContain('RRULE:FREQ=DAILY;UNTIL=20270102T205959Z');
    expect(ics).toContain('DTSTART;TZID=Asia/Riyadh:20261113T080000'); // first Friday weigh-in
    expect(ics).not.toContain('Easy cardio');
    expect(ics).toContain('DTSTART;TZID=Asia/Riyadh:20261108T231500'); // week 1 sleep
    expect(ics).toContain('DTSTART;TZID=Asia/Riyadh:20261122T223000'); // week 3 sleep
    for (const line of ics.split('\r\n')) expect(line.length).toBeLessThanOrEqual(75);
  });
  it('builds the Ramadan calendar', () => {
    const ics = buildIcs('Hashan Fit Ramadan', ramadanEvents());
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(4);
    expect(ics).toContain('DTSTART;TZID=Asia/Riyadh:20270208T041500');
    expect(ics).toContain('RRULE:FREQ=DAILY;UNTIL=20270309T205959Z');
  });
});
