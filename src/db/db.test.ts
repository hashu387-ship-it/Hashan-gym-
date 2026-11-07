import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { FitDB } from './db';
import { BackupError, exportBackup, importBackup } from './backup';
import { applyBandData, getDay, getSettings, lastSetsFor, saveSettings, updateDay } from './queries';

let db: FitDB;
let n = 0;
beforeEach(async () => {
  db = new FitDB(`test-${n++}`);
  await db.open();
});

describe('queries', () => {
  it('creates default settings on first run', async () => {
    const s = await getSettings(db);
    expect(s.startDate).toBe('2026-11-08');
    expect(s.kcalTarget).toBe(1800);
    expect((await saveSettings({ kcalTarget: 1650 }, db)).kcalTarget).toBe(1650);
    expect((await getSettings(db)).kcalTarget).toBe(1650);
  });

  it('updates a day', async () => {
    await updateDay('2026-11-08', (d) => ({ ...d, waterMl: d.waterMl + 250 }), db);
    await updateDay('2026-11-08', (d) => ({ ...d, waterMl: d.waterMl + 250 }), db);
    expect((await getDay('2026-11-08', db)).waterMl).toBe(500);
  });

  it('finds the last sets for an exercise', async () => {
    await db.workouts.bulkPut([
      { id: '2026-11-08:upperA', date: '2026-11-08', sessionId: 'upperA', sets: [{ exerciseId: 'bench-press', setIndex: 0, kg: 50, reps: 10, done: true }] },
      { id: '2026-11-15:upperA', date: '2026-11-15', sessionId: 'upperA', sets: [{ exerciseId: 'bench-press', setIndex: 0, kg: 55, reps: 9, done: true }] },
    ]);
    expect((await lastSetsFor('bench-press', '2026-11-22', db))[0].kg).toBe(55);
    expect((await lastSetsFor('bench-press', '2026-11-15', db))[0].kg).toBe(50);
    expect(await lastSetsFor('bench-press', '2026-11-08', db)).toEqual([]);
  });

  it('never overwrites manual values with band data', async () => {
    await updateDay('2026-11-08', (d) => ({ ...d, steps: { value: 9000, source: 'manual' } }), db);
    await applyBandData({
      '2026-11-08': { steps: 7500, restingHr: 62, sleep: { minutes: 410 } },
      '2026-11-09': { steps: 10200 },
    }, db);
    const d8 = await getDay('2026-11-08', db);
    expect(d8.steps).toEqual({ value: 9000, source: 'manual' });
    expect(d8.restingHr).toEqual({ value: 62, source: 'band' });
    expect(d8.sleep).toEqual({ minutes: 410, source: 'band' });
    expect((await getDay('2026-11-09', db)).steps).toEqual({ value: 10200, source: 'band' });
  });
});

describe('backup', () => {
  it('round-trips all data', async () => {
    await getSettings(db);
    await updateDay('2026-11-08', (d) => ({ ...d, waterMl: 750 }), db);
    await db.weighIns.put({ date: '2026-11-13', kg: 94.8 });
    const file = await exportBackup(db);
    const copy = JSON.parse(JSON.stringify(file));

    const other = new FitDB(`test-${n++}`);
    const counts = await importBackup(copy, other);
    expect(counts).toEqual({ settings: 1, days: 1, weighIns: 1, workouts: 0, adjustments: 0 });
    expect(await exportBackup(other, new Date(file.exportedAt))).toEqual(file);
  });

  it('rejects a file from another app and leaves data unchanged', async () => {
    await db.weighIns.put({ date: '2026-11-13', kg: 94.8 });
    await expect(importBackup({ app: 'other', version: 1, tables: {} }, db)).rejects.toThrow(BackupError);
    await expect(importBackup('not json', db)).rejects.toThrow(BackupError);
    await expect(importBackup({ app: 'hashan-fit', version: 1, tables: { settings: [] } }, db)).rejects.toThrow(/damaged/);
    await expect(importBackup({ app: 'hashan-fit', version: 2, tables: {} }, db)).rejects.toThrow(/version 2/);
    expect(await db.weighIns.count()).toBe(1);
  });
});
