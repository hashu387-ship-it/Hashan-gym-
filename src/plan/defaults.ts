import { DEFAULT_BREAKFAST } from './foods';
import type { Settings } from './types';

export const DEFAULT_SETTINGS: Settings = {
  id: 'main',
  startDate: '2026-11-08',
  startWeightKg: 96,
  heightCm: 165,
  kcalTarget: 1800,
  proteinTarget: 160,
  stepsBonus: 0,
  lipoEnabled: true,
  lipoEndDate: '2027-01-02',
  ramadanStart: '2027-02-08',
  ramadanEnd: '2027-03-09',
  defaultBreakfast: DEFAULT_BREAKFAST,
  swaps: {},
  foodOverrides: {},
};
