import { describe, expect, it } from 'vitest';
import { ageMarks, blossomShare, chaptersOf, currentChapter, dayRatio, gardenDays, flowerCount, FLOWER_SLOTS, fruitShare, KAMPUNG_UNLOCKS, leafShare, maturity, nextMilestone, nextUnlock, orchardTier, timeOfDay, unlocksFor, todayStage, treeStage, unlockedIds, UNLOCKS } from './growth';
import { branchGrowth, growOlive } from './tree';
import { BIOMES } from '../../../domain/state';
import { resources } from '../../../i18n';
import { LAYOUTS } from './layouts';
import { hijriOf, seasonOf } from './seasons';

describe('the living garden over time', () => {
  it('counts a day tended at half its intention, and grows the tree only on full days', () => {
    const presets = [{ id: 'a', title: 'A', arabic: '', transliteration: '', target: 30 }, { id: 'b', title: 'B', arabic: '', transliteration: '', target: 10 }];
    const log = (date: string, counts: Record<string, number>, completed = false) => ({ date, counts, timedSeconds: {}, completed });
    expect(dayRatio(log('d', { a: 30, b: 0 }), presets)).toBe(0.75);
    expect(dayRatio(log('d', { a: 99 }), presets)).toBe(0.75);
    expect(gardenDays([
      log('2026-09-01', { a: 30, b: 10 }, true),
      log('2026-09-02', { a: 20 }),
      log('2026-09-03', { a: 5 }),
      log('2026-09-01', { a: 30, b: 10 }, true)
    ], presets)).toEqual({ tended: 2, full: 1 });
  });

  it('only ever grows: the tree, the flowers and what has arrived never shrink as days are added', () => {
    for (let day = 0; day < 150; day++) {
      expect(maturity(day + 1)).toBeGreaterThanOrEqual(maturity(day));
      expect(flowerCount(day + 1)).toBeGreaterThanOrEqual(flowerCount(day));
      expect(unlockedIds(day + 1).length).toBeGreaterThanOrEqual(unlockedIds(day).length);
      expect(treeStage(day + 1)).toBeGreaterThanOrEqual(treeStage(day));
    }
    expect(maturity(0)).toBeCloseTo(0.1);
    expect(maturity(100)).toBeCloseTo(1);
    expect(flowerCount(500)).toBe(FLOWER_SLOTS);
  });

  it('always has something next until the hundredth day', () => {
    expect(nextUnlock(0)?.id).toBe('firstBloom');
    expect(nextUnlock(6)?.id).toBe('fountain');
    // Never more than four days apart in the first month, never more than two weeks after.
    const days = UNLOCKS.map((unlock) => unlock.day);
    days.slice(1).forEach((day, i) => expect(day - days[i]).toBeLessThanOrEqual(days[i] < 28 ? 4 : 16));
    expect(nextUnlock(99)?.id).toBe('goldArch');
    expect(nextUnlock(100)).toBeNull();
    expect(UNLOCKS.map((unlock) => unlock.day)).toEqual([...UNLOCKS.map((unlock) => unlock.day)].sort((a, b) => a - b));
  });
});

describe('the living garden through the day', () => {
  it('rests in the morning, blossoms through the middle and fruits at completion', () => {
    expect(leafShare(0)).toBe(0.25);
    expect(leafShare(1)).toBeCloseTo(1);
    expect(blossomShare(0.3)).toBe(0);
    expect(blossomShare(0.85)).toBeCloseTo(1);
    expect(fruitShare(0.79)).toBe(0);
    expect(fruitShare(1)).toBe(1);
    expect([0, 0.1, 0.3, 0.6, 1].map(todayStage)).toEqual([0, 1, 2, 3, 4]);
  });

  it('follows the local hour through dawn, day, golden hour and night', () => {
    const at = (hour: number) => timeOfDay(new Date(2026, 8, 30, hour, 0));
    expect([at(6), at(12), at(18), at(23), at(3)]).toEqual(['dawn', 'day', 'golden', 'night', 'night']);
  });
});

describe('the olive tree', () => {
  it('grows the same tree every time, from the trunk out', () => {
    const tree = growOlive(11, 6);
    expect(growOlive(11, 6)).toEqual(tree);
    expect(tree.branches[0].depth).toBe(0);
    const young = tree.branches.filter((branch) => branchGrowth(branch, 0.2, tree.maxDepth) > 0);
    const old = tree.branches.filter((branch) => branchGrowth(branch, 1, tree.maxDepth) > 0);
    expect(young.length).toBeLessThan(old.length);
    expect(old.length).toBe(tree.branches.length);
    // Every anchor has a distinct place in the order leaves arrive.
    expect(new Set(tree.anchors.map((anchor) => anchor.order)).size).toBe(tree.anchors.length);
  });
});

describe('the orchard and the days behind the flowers', () => {
  const log = (date: string, counts: Record<string, number>, completed = false) => ({ date, counts, timedSeconds: {}, completed });

  it('grows a first tree of each kind early, then one for every few hundred, up to a grove', async () => {
    const { plantsFor, repsToNext, orchardOf, PLANTS_MAX } = await import('./growth');
    expect([0, 99, 100, 399, 400, 1300, 99999].map(plantsFor)).toEqual([0, 0, 1, 1, 2, 5, PLANTS_MAX]);
    expect(repsToNext(40)).toBe(60);
    expect(repsToNext(100)).toBe(300);
    expect(repsToNext(1300)).toBeNull();
    const orchard = orchardOf([log('2026-09-01', { tasbih: 80, salawat: 400 }), log('2026-09-02', { tasbih: 30 })]);
    expect(orchard.palm).toMatchObject({ phrase: 'tasbih', reps: 110, plants: 1 });
    expect(orchard.rose).toMatchObject({ plants: 2 });
    expect(orchard.fig.plants).toBe(0);
  });

  it('traces flowers to the days that planted them, and measures a return', async () => {
    const { tendedDates, daysAway } = await import('./growth');
    const presets = [{ id: 'tasbih', title: 'Tasbih', arabic: '', transliteration: '', target: 10 }];
    const logs = [log('2026-09-05', { tasbih: 10 }, true), log('2026-09-01', { tasbih: 6 }), log('2026-09-03', { tasbih: 2 })];
    expect(tendedDates(logs, presets)).toEqual(['2026-09-01', '2026-09-05']);
    expect(daysAway(logs, presets, '2026-09-09')).toBe(4);
    expect(daysAway(logs, presets, '2026-09-05')).toBe(4);
    expect(daysAway([], presets, '2026-09-05')).toBeNull();
  });
});

describe('gardens kept over hundreds of days', () => {
  const presets = [{ id: 'tasbih', title: 'T', arabic: '', transliteration: '', target: 10 }];
  const log = (date: string, n = 10) => ({ date, counts: { tasbih: n }, timedSeconds: {}, completed: n >= 10 });
  const days = (from: string, count: number) => Array.from({ length: count }, (_, i) => {
    const d = new Date(`${from}T12:00:00`);
    d.setDate(d.getDate() + i);
    return log(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  });

  it('keeps everything in the first garden until another is begun', () => {
    const chapters = chaptersOf({ logs: days('2026-01-01', 120), presets });
    expect(chapters).toHaveLength(1);
    expect(chapters[0]).toMatchObject({ index: 0, biome: 'andalusia', startedOn: null, endedBefore: null, tended: 120, full: 120 });
  });

  it('begins with the garden chosen in onboarding, and carries it into the chapters after it', () => {
    const logs = days('2026-01-01', 130);
    expect(chaptersOf({ logs, presets, firstGarden: 'samarkand' })[0]).toMatchObject({ biome: 'samarkand', startedOn: null, tended: 130 });
    const chapters = chaptersOf({ logs, presets, firstGarden: 'samarkand', gardens: [{ biome: 'kampung', startedOn: '2026-04-11' }] });
    expect(chapters.map((c) => [c.biome, c.tended])).toEqual([['samarkand', 100], ['kampung', 30]]);
    expect(currentChapter({ logs, presets, firstGarden: 'samarkand' }).biome).toBe('samarkand');
  });

  it('splits the days between gardens at the day each began', () => {
    const logs = days('2026-01-01', 130);
    const chapters = chaptersOf({ logs, presets, gardens: [{ biome: 'kampung', startedOn: '2026-04-11' }] });
    expect(chapters.map((c) => [c.biome, c.tended, c.endedBefore])).toEqual([['andalusia', 100, '2026-04-11'], ['kampung', 30, null]]);
    expect(currentChapter({ logs, presets, gardens: [{ biome: 'kampung', startedOn: '2026-04-11' }] }).biome).toBe('kampung');
    expect(chapters.reduce((sum, c) => sum + c.logs.length, 0)).toBe(logs.length);
  });

  it('gives every garden something new as often as the first, ending in a golden frame', () => {
    const golden = { andalusia: 'goldArch', kampung: 'goldFrame', damascus: 'goldLintel', medina: 'goldPosts', ottoman: 'goldTiles', xian: 'goldMoonGate', agra: 'goldPietra', samarkand: 'goldMajolica', djenne: 'goldPinnacles' } as const;
    for (const biome of BIOMES) {
      expect(nextUnlock(0, biome)?.id).toBe('firstBloom');
      expect(unlocksFor(biome).map((unlock) => unlock.day)).toEqual(UNLOCKS.map((unlock) => unlock.day));
      expect(nextUnlock(99, biome)?.id).toBe(golden[biome]);
      expect(unlockedIds(100, biome)).toHaveLength(unlocksFor(biome).length);
      // Every piece has a name in every language.
      for (const { id } of unlocksFor(biome)) for (const language of Object.values(resources)) expect((language.translation as Record<string, string>)[`gardenUnlock_${id}`], `${biome} ${id}`).toBeTruthy();
    }
    expect(KAMPUNG_UNLOCKS).toHaveLength(UNLOCKS.length);
  });

  it('has a place for every flower in every garden, each within the scene', () => {
    for (const biome of BIOMES) {
      const { slots } = LAYOUTS[biome];
      expect(slots).toHaveLength(FLOWER_SLOTS);
      expect(new Set(slots.map((slot) => slot.planted)).size).toBe(FLOWER_SLOTS);
      slots.forEach((slot) => { expect(slot.x).toBeGreaterThan(0); expect(slot.x).toBeLessThan(400); expect(slot.y).toBeLessThanOrEqual(300); });
    }
  });

  it('marks lifetime milestones for each phrase and age on an old tree', () => {
    expect([0, 999, 1000, 5000, 33000, 100000].map(orchardTier)).toEqual([0, 0, 1, 2, 4, 5]);
    expect(nextMilestone(1200)).toBe(5000);
    expect(nextMilestone(100000)).toBeNull();
    expect([100, 150, 199, 200, 365, 900].map(ageMarks)).toEqual([0, 1, 1, 2, 3, 3]);
  });
});

describe('the Hijri year in the garden', () => {
  it('reads the Umm al-Qura date', () => {
    expect(hijriOf(new Date(2026, 1, 18, 12))).toEqual({ day: 1, month: 9, year: 1447 });
    expect(hijriOf(new Date(2026, 5, 16, 12))).toEqual({ day: 1, month: 1, year: 1448 });
  });

  it('marks the seasons of the year', () => {
    const at = (month: number, day: number) => seasonOf({ day, month, year: 1447 });
    expect([at(9, 1), at(9, 20), at(9, 21), at(9, 30)]).toEqual(['ramadan', 'ramadan', 'lastTen', 'lastTen']);
    expect([at(10, 1), at(10, 3), at(10, 4)]).toEqual(['eidFitr', 'eidFitr', null]);
    expect([at(12, 1), at(12, 8), at(12, 9), at(12, 10), at(12, 13), at(12, 14)]).toEqual(['dhulHijjah', 'dhulHijjah', 'arafah', 'eidAdha', 'eidAdha', null]);
    expect([at(1, 1), at(1, 4), at(1, 10), at(4, 21)]).toEqual(['newYear', null, 'ashura', null]);
    expect(seasonOf(null)).toBeNull();
  });
});
