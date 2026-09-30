import type { DailyLog } from '../../../domain/types';

/**
 * How the living garden grows: today by the share of the day's intention that is done, and
 * over time by the number of days the intention has been completed. Days are only ever
 * added, so a missed day never takes anything out of the garden.
 */

export const UNLOCKS = [
  { id: 'firstBloom', day: 1 },
  { id: 'path', day: 3 },
  { id: 'lavender', day: 5 },
  { id: 'fountain', day: 7 },
  { id: 'pomegranate', day: 10 },
  { id: 'lantern', day: 14 },
  { id: 'butterflies', day: 21 },
  { id: 'pool', day: 30 },
  { id: 'palm', day: 40 },
  { id: 'songbirds', day: 50 },
  { id: 'vine', day: 75 },
  { id: 'goldArch', day: 100 }
] as const;

export type UnlockId = (typeof UNLOCKS)[number]['id'];

/** One flower is planted for every completed day, up to the beds' capacity. */
export const FLOWER_SLOTS = 72;

export const completedDays = (logs: DailyLog[]) => new Set(logs.filter((log) => log.completed).map((log) => log.date)).size;

/** 0..1 size of the olive tree. Quick at first so the first week is visibly different each day, then slower. */
export const maturity = (days: number) => Math.min(1, 0.1 + 0.9 * Math.log(1 + Math.max(0, days)) / Math.log(101));

/** Seedling, sapling, young, mature, ancient. */
export const TREE_STAGE_DAYS = [0, 1, 7, 30, 75] as const;
export const treeStage = (days: number) => TREE_STAGE_DAYS.reduce<number>((stage, from, index) => (days >= from ? index : stage), 0);

export const isUnlocked = (id: UnlockId, days: number) => days >= UNLOCKS.find((unlock) => unlock.id === id)!.day;
export const unlockedIds = (days: number) => UNLOCKS.filter((unlock) => days >= unlock.day).map((unlock) => unlock.id);
export const nextUnlock = (days: number) => UNLOCKS.find((unlock) => unlock.day > days) ?? null;
export const flowerCount = (days: number) => Math.min(Math.max(0, days), FLOWER_SLOTS);

/** Five moments of the day's tree: resting, first leaves, filling, in blossom, in fruit. */
export const todayStage = (ratio: number) => (ratio >= 1 ? 4 : ratio >= 0.6 ? 3 : ratio >= 0.3 ? 2 : ratio > 0 ? 1 : 0);

/** Share of the canopy in leaf: the tree rests at a quarter each morning and fills as the day's intention is kept. */
export const leafShare = (ratio: number) => (ratio >= 1 ? 1 : 0.25 + 0.75 * Math.max(0, ratio));
/** Blossom opens through the middle of the day's intention, fruit sets towards its end and ripens at completion. */
export const blossomShare = (ratio: number) => Math.min(1, Math.max(0, (ratio - 0.45) / 0.4));
export const fruitShare = (ratio: number) => (ratio >= 1 ? 1 : Math.min(1, Math.max(0, (ratio - 0.8) / 0.2)));

export type TimeOfDay = 'dawn' | 'day' | 'golden' | 'night';
export function timeOfDay(date: Date): TimeOfDay {
  const hour = date.getHours() + date.getMinutes() / 60;
  if (hour >= 5 && hour < 7.5) return 'dawn';
  if (hour >= 7.5 && hour < 16.5) return 'day';
  if (hour >= 16.5 && hour < 19.5) return 'golden';
  return 'night';
}
