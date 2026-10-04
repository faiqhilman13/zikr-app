import type { BiomeId, DailyLog, DhikrPreset, ZikrState } from '../../../domain/types';

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

/** The kampung garden: the same rhythm of arrivals, in a Malay village garden. */
export const KAMPUNG_UNLOCKS = [
  { id: 'firstBloom', day: 1 },
  { id: 'steppingStones', day: 3 },
  { id: 'lemongrass', day: 5 },
  { id: 'wakaf', day: 7 },
  { id: 'butterflies', day: 9 },
  { id: 'banana', day: 12 },
  { id: 'doveCage', day: 14 },
  { id: 'rambutan', day: 17 },
  { id: 'lotusPond', day: 21 },
  { id: 'pangkin', day: 24 },
  { id: 'coconut', day: 28 },
  { id: 'songbirds', day: 35 },
  { id: 'pelitaRow', day: 42 },
  { id: 'bamboo', day: 49 },
  { id: 'bougainvillea', day: 56 },
  { id: 'orchids', day: 63 },
  { id: 'fireflies', day: 70 },
  { id: 'shootingStars', day: 84 },
  { id: 'goldFrame', day: 100 }
] as const;

/** The Damascus courtyard: a house turned inward around its fountain and its bitter orange. */
export const DAMASCUS_UNLOCKS = [
  { id: 'firstBloom', day: 1 },
  { id: 'inlaidFloor', day: 3 },
  { id: 'jasmine', day: 5 },
  { id: 'bahra', day: 7 },
  { id: 'butterflies', day: 9 },
  { id: 'citrusPots', day: 12 },
  { id: 'brassLantern', day: 14 },
  { id: 'damaskRoses', day: 17 },
  { id: 'iwanCushions', day: 21 },
  { id: 'mashrabiya', day: 24 },
  { id: 'grapeArbor', day: 28 },
  { id: 'songbirds', day: 35 },
  { id: 'qamariyya', day: 42 },
  { id: 'doves', day: 49 },
  { id: 'teaTray', day: 56 },
  { id: 'apricot', day: 63 },
  { id: 'fireflies', day: 70 },
  { id: 'shootingStars', day: 84 },
  { id: 'goldLintel', day: 100 }
] as const;

/** The Medina date grove: palms watered by channels, beneath Uhud. */
export const MEDINA_UNLOCKS = [
  { id: 'firstBloom', day: 1 },
  { id: 'channels', day: 3 },
  { id: 'mint', day: 5 },
  { id: 'well', day: 7 },
  { id: 'butterflies', day: 9 },
  { id: 'youngPalms', day: 12 },
  { id: 'fanous', day: 14 },
  { id: 'camel', day: 17 },
  { id: 'arish', day: 21 },
  { id: 'dallah', day: 24 },
  { id: 'medinaDoves', day: 28 },
  { id: 'songbirds', day: 35 },
  { id: 'wallLamps', day: 42 },
  { id: 'dateBaskets', day: 49 },
  { id: 'taifRoses', day: 56 },
  { id: 'grove', day: 63 },
  { id: 'fireflies', day: 70 },
  { id: 'shootingStars', day: 84 },
  { id: 'goldPosts', day: 100 }
] as const;

/** The Ottoman tulip garden: a plane tree, a kiosk and the Bosphorus beyond the balustrade. */
export const OTTOMAN_UNLOCKS = [
  { id: 'firstBloom', day: 1 },
  { id: 'boxHedges', day: 3 },
  { id: 'hyacinths', day: 5 },
  { id: 'cesme', day: 7 },
  { id: 'butterflies', day: 9 },
  { id: 'kiosk', day: 12 },
  { id: 'caiques', day: 14 },
  { id: 'carnations', day: 17 },
  { id: 'havuz', day: 21 },
  { id: 'divan', day: 24 },
  { id: 'cypressRow', day: 28 },
  { id: 'songbirds', day: 35 },
  { id: 'tulipLamps', day: 42 },
  { id: 'storks', day: 49 },
  { id: 'ottomanRoses', day: 56 },
  { id: 'erguvan', day: 63 },
  { id: 'fireflies', day: 70 },
  { id: 'shootingStars', day: 84 },
  { id: 'goldTiles', day: 100 }
] as const;

/** The Xi'an garden: a Chinese courtyard by the Great Mosque, seen through a moon gate. */
export const XIAN_UNLOCKS = [
  { id: 'firstBloom', day: 1 },
  { id: 'hexPavers', day: 3 },
  { id: 'peonies', day: 5 },
  { id: 'koiPond', day: 7 },
  { id: 'butterflies', day: 9 },
  { id: 'taihuRocks', day: 12 },
  { id: 'redLanterns', day: 14 },
  { id: 'zigzagBridge', day: 17 },
  { id: 'stele', day: 21 },
  { id: 'pailou', day: 24 },
  { id: 'xianBamboo', day: 28 },
  { id: 'songbirds', day: 35 },
  { id: 'cranes', day: 42 },
  { id: 'tingPavilion', day: 49 },
  { id: 'pondLotus', day: 56 },
  { id: 'wisteria', day: 63 },
  { id: 'fireflies', day: 70 },
  { id: 'shootingStars', day: 84 },
  { id: 'goldMoonGate', day: 100 }
] as const;

/** The Mughal garden before the Taj Mahal: a charbagh of water, cypress and flowers. */
export const AGRA_UNLOCKS = [
  { id: 'firstBloom', day: 1 },
  { id: 'channelWater', day: 3 },
  { id: 'fountainJets', day: 5 },
  { id: 'cypressAvenue', day: 7 },
  { id: 'butterflies', day: 9 },
  { id: 'chhatri', day: 12 },
  { id: 'diyas', day: 14 },
  { id: 'peacock', day: 17 },
  { id: 'lotusBasin', day: 21 },
  { id: 'marbleBench', day: 24 },
  { id: 'parakeets', day: 28 },
  { id: 'songbirds', day: 35 },
  { id: 'jaali', day: 42 },
  { id: 'roseParterre', day: 49 },
  { id: 'reflection', day: 56 },
  { id: 'champa', day: 63 },
  { id: 'fireflies', day: 70 },
  { id: 'shootingStars', day: 84 },
  { id: 'goldPietra', day: 100 }
] as const;

/** The Samarkand garden below the Registan: an orchard with a tapchan to sit on. */
export const SAMARKAND_UNLOCKS = [
  { id: 'firstBloom', day: 1 },
  { id: 'ariq', day: 3 },
  { id: 'roseRows', day: 5 },
  { id: 'tapchan', day: 7 },
  { id: 'butterflies', day: 9 },
  { id: 'choynak', day: 12 },
  { id: 'suzani', day: 14 },
  { id: 'grapeTrellis', day: 17 },
  { id: 'melons', day: 21 },
  { id: 'anor', day: 24 },
  { id: 'hoopoe', day: 28 },
  { id: 'songbirds', day: 35 },
  { id: 'uzbekLanterns', day: 42 },
  { id: 'mulberry', day: 49 },
  { id: 'ceramics', day: 56 },
  { id: 'illumination', day: 63 },
  { id: 'fireflies', day: 70 },
  { id: 'shootingStars', day: 84 },
  { id: 'goldMajolica', day: 100 }
] as const;

/** The Djenné garden: a Sahel garden beneath the Great Mosque of mud. */
export const DJENNE_UNLOCKS = [
  { id: 'firstBloom', day: 1 },
  { id: 'canari', day: 3 },
  { id: 'bissap', day: 5 },
  { id: 'granary', day: 7 },
  { id: 'butterflies', day: 9 },
  { id: 'acacia', day: 12 },
  { id: 'calabash', day: 14 },
  { id: 'pirogue', day: 17 },
  { id: 'weaverNests', day: 21 },
  { id: 'millet', day: 24 },
  { id: 'bogolan', day: 28 },
  { id: 'songbirds', day: 35 },
  { id: 'sahelLamps', day: 42 },
  { id: 'sahelMango', day: 49 },
  { id: 'guineaFowl', day: 56 },
  { id: 'waterLilies', day: 63 },
  { id: 'fireflies', day: 70 },
  { id: 'shootingStars', day: 84 },
  { id: 'goldPinnacles', day: 100 }
] as const;

export type UnlockId = (typeof UNLOCKS)[number]['id'] | (typeof KAMPUNG_UNLOCKS)[number]['id'] | (typeof DAMASCUS_UNLOCKS)[number]['id']
  | (typeof MEDINA_UNLOCKS)[number]['id'] | (typeof OTTOMAN_UNLOCKS)[number]['id'] | (typeof XIAN_UNLOCKS)[number]['id']
  | (typeof AGRA_UNLOCKS)[number]['id'] | (typeof SAMARKAND_UNLOCKS)[number]['id'] | (typeof DJENNE_UNLOCKS)[number]['id'];
type Unlock = { id: UnlockId; day: number };
const BY_BIOME: Record<BiomeId, readonly Unlock[]> = { andalusia: UNLOCKS, kampung: KAMPUNG_UNLOCKS, damascus: DAMASCUS_UNLOCKS, medina: MEDINA_UNLOCKS, ottoman: OTTOMAN_UNLOCKS,
  xian: XIAN_UNLOCKS, agra: AGRA_UNLOCKS, samarkand: SAMARKAND_UNLOCKS, djenne: DJENNE_UNLOCKS };
export const unlocksFor = (biome: BiomeId = 'andalusia'): readonly Unlock[] => BY_BIOME[biome] ?? UNLOCKS;

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

export const isUnlocked = (id: UnlockId, days: number, biome: BiomeId = 'andalusia') => {
  const unlock = unlocksFor(biome).find((item) => item.id === id);
  return !!unlock && days >= unlock.day;
};
export const unlockedIds = (days: number, biome: BiomeId = 'andalusia') => unlocksFor(biome).filter((unlock) => days >= unlock.day).map((unlock) => unlock.id);
export const nextUnlock = (days: number, biome: BiomeId = 'andalusia') => unlocksFor(biome).find((unlock) => unlock.day > days) ?? null;
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

/**
 * Lifetime milestones for each phrase after its grove is full, so someone who recites
 * thousands a day always has something ahead: the trees grow taller and older with each.
 */
export const ORCHARD_MILESTONES = [1000, 5000, 10000, 33000, 100000] as const;
export const orchardTier = (reps: number) => ORCHARD_MILESTONES.filter((milestone) => reps >= milestone).length;
export const nextMilestone = (reps: number) => ORCHARD_MILESTONES.find((milestone) => milestone > reps) ?? null;

/** Markers of age on a tree kept long past full growth. */
export const AGE_MARKS = [150, 200, 365] as const;
export const ageMarks = (full: number) => AGE_MARKS.filter((day) => full >= day).length;

/** A garden is complete, and a new one can be offered, at this many tended days. */
export const CHAPTER_DAYS = 100;

export interface Chapter {
  index: number;
  biome: BiomeId;
  /** First day of the garden, or null for the first garden, which holds everything before. */
  startedOn: string | null;
  /** The day the next garden began, or null for the garden in progress. */
  endedBefore: string | null;
  logs: DailyLog[];
  tended: number;
  full: number;
}

/** Every garden kept so far, oldest first; the last is the one in progress. */
export function chaptersOf(state: Pick<ZikrState, 'logs' | 'presets' | 'gardens' | 'firstGarden'>): Chapter[] {
  const starts: { biome: BiomeId; startedOn: string | null }[] = [{ biome: state.firstGarden ?? 'andalusia', startedOn: null }, ...(state.gardens ?? [])];
  return starts.map((start, index) => {
    const endedBefore = starts[index + 1]?.startedOn ?? null;
    const logs = state.logs.filter((log) => (start.startedOn === null || log.date >= start.startedOn) && (endedBefore === null || log.date < endedBefore));
    return { index, biome: start.biome, startedOn: start.startedOn, endedBefore, logs, ...gardenDays(logs, state.presets) };
  });
}

export const currentChapter = (state: Pick<ZikrState, 'logs' | 'presets' | 'gardens' | 'firstGarden'>) => chaptersOf(state).at(-1)!;
