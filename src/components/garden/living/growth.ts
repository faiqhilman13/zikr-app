import type { DailyLog, DhikrPreset } from '../../../domain/types';

/**
 * How the living garden grows: today by the share of the day's intention that is done, and
 * over time by the days it was tended (half the intention or more: flowers and arrivals)
 * and completed (the olive tree). Days are only ever added, so a missed day never takes
 * anything out of the garden.
 */

/** Something new every two to four days through the first month, then weekly. */
export const UNLOCKS = [
  { id: 'firstBloom', day: 1 },
  { id: 'path', day: 3 },
  { id: 'lavender', day: 5 },
  { id: 'fountain', day: 7 },
  { id: 'butterflies', day: 9 },
  { id: 'pomegranate', day: 12 },
  { id: 'lantern', day: 14 },
  { id: 'lemons', day: 17 },
  { id: 'pool', day: 21 },
  { id: 'bench', day: 24 },
  { id: 'palm', day: 28 },
  { id: 'songbirds', day: 35 },
  { id: 'lanternString', day: 42 },
  { id: 'cypresses', day: 49 },
  { id: 'roses', day: 56 },
  { id: 'vine', day: 63 },
  { id: 'fireflies', day: 70 },
  { id: 'shootingStars', day: 84 },
  { id: 'goldArch', day: 100 }
] as const;

export type UnlockId = (typeof UNLOCKS)[number]['id'];

/** One flower is planted for every completed day, up to the beds' capacity. */
export const FLOWER_SLOTS = 72;

/** Share of a day's intention that was met, against the phrases' current targets. */
export function dayRatio(log: DailyLog, presets: DhikrPreset[]) {
  const target = presets.reduce((sum, preset) => sum + Math.max(0, preset.target), 0);
  if (target <= 0) return log.completed ? 1 : 0;
  const met = presets.reduce((sum, preset) => sum + Math.min(Math.max(0, preset.target), log.counts[preset.id] ?? 0), 0);
  return log.completed ? 1 : met / target;
}

/**
 * The days the garden grows from. A day tended to half its intention plants a flower and
 * counts towards what arrives; a completed day also grows the olive. Partial days still
 * count, so someone with a high target is never left with a garden that stands still.
 */
export function gardenDays(logs: DailyLog[], presets: DhikrPreset[]) {
  const tended = new Set<string>();
  const full = new Set<string>();
  for (const log of logs) {
    const ratio = dayRatio(log, presets);
    if (ratio >= TENDED) tended.add(log.date);
    if (log.completed || ratio >= 1) full.add(log.date);
  }
  return { tended: tended.size, full: full.size };
}

export const TENDED = 0.5;

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

/**
 * The orchard beyond the wall: each of the starter phrases grows its own kind of tree,
 * from the repetitions of it ever recited. A first one appears early, then one more for
 * every few hundred, up to a small grove of each.
 *
 * Tasbih grows date palms, after the narration that a palm is planted for "SubhanAllahil
 * 'Azim wa bihamdihi"; tahmid grows figs and tahlil olives, the two trees sworn by in
 * Surah at-Tin; takbir grows cypresses, upright as the phrase; salawat grows the roses
 * that climb the courtyard wall. The pairing is the garden's, not a teaching.
 */
export const ORCHARD = [
  { id: 'palm', phrase: 'tasbih' },
  { id: 'fig', phrase: 'tahmid' },
  { id: 'cypress', phrase: 'takbir' },
  { id: 'olive', phrase: 'tahlil' },
  { id: 'rose', phrase: 'salawat' }
] as const;
export type OrchardId = (typeof ORCHARD)[number]['id'];

export const FIRST_PLANT = 100;
export const PLANT_EVERY = 300;
export const PLANTS_MAX = 5;

export const plantsFor = (reps: number) => (reps < FIRST_PLANT ? 0 : Math.min(PLANTS_MAX, 1 + Math.floor((reps - FIRST_PLANT) / PLANT_EVERY)));
/** Repetitions still to go for the next tree of a kind, or null once the grove is full. */
export const repsToNext = (reps: number) => {
  const plants = plantsFor(reps);
  if (plants >= PLANTS_MAX) return null;
  return (plants === 0 ? FIRST_PLANT : FIRST_PLANT + plants * PLANT_EVERY) - reps;
};

export function orchardOf(logs: DailyLog[]) {
  return Object.fromEntries(ORCHARD.map(({ id, phrase }) => {
    const reps = logs.reduce((sum, log) => sum + (log.counts[phrase] ?? 0), 0);
    return [id, { phrase, reps, plants: plantsFor(reps), next: repsToNext(reps) }];
  })) as Record<OrchardId, { phrase: string; reps: number; plants: number; next: number | null }>;
}

/** The dates that planted the flowers, oldest first, so a flower can be traced to its day. */
export function tendedDates(logs: DailyLog[], presets: DhikrPreset[]) {
  return [...new Set(logs.filter((log) => dayRatio(log, presets) >= TENDED).map((log) => log.date))].sort();
}

/** Whole days between the last tended day before today and today, or null if there is none. */
export function daysAway(logs: DailyLog[], presets: DhikrPreset[], today: string) {
  const before = tendedDates(logs, presets).filter((date) => date < today);
  if (!before.length) return null;
  const last = before[before.length - 1];
  return Math.round((new Date(`${today}T12:00:00`).getTime() - new Date(`${last}T12:00:00`).getTime()) / 86_400_000);
}
