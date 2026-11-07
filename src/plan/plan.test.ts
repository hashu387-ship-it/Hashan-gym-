import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { EXERCISES, EXERCISE_BY_ID } from './exercises';
import { FOODS } from './foods';
import { SESSIONS } from './program';

describe('exercise catalog', () => {
  const used = new Set<string>();
  for (const s of Object.values(SESSIONS)) {
    for (const it of s.items) {
      used.add(it.exerciseId);
      it.alternatives.forEach((a) => used.add(a));
    }
  }

  it('has an entry for every exercise and alternative in the program', () => {
    const missing = [...used].filter((id) => !EXERCISE_BY_ID[id]);
    expect(missing).toEqual([]);
  });

  it('has unique ids, how-to steps and mistakes for every exercise', () => {
    expect(new Set(EXERCISES.map((e) => e.id)).size).toBe(EXERCISES.length);
    for (const e of EXERCISES) {
      expect(e.how.length, e.id).toBeGreaterThanOrEqual(3);
      expect(e.avoid.length, e.id).toBeGreaterThanOrEqual(1);
    }
  });

  it('has both demo frames on disk for every exercise', () => {
    const missing = EXERCISES.flatMap((e) =>
      [0, 1].map((f) => `public/demos/${e.demo}/${f}.jpg`).filter((p) => !existsSync(resolve(p))),
    );
    expect(missing).toEqual([]);
  });
});

describe('food list', () => {
  it('has unique ids and sensible values', () => {
    expect(new Set(FOODS.map((f) => f.id)).size).toBe(FOODS.length);
    for (const f of FOODS) {
      expect(f.kcal).toBeGreaterThan(0);
      expect(f.protein).toBeGreaterThanOrEqual(0);
    }
  });
});
