import { describe, expect, it } from 'vitest';
import { blossomShare, dayRatio, gardenDays, flowerCount, FLOWER_SLOTS, fruitShare, leafShare, maturity, nextUnlock, timeOfDay, todayStage, treeStage, unlockedIds, UNLOCKS } from './growth';
import { branchGrowth, growOlive } from './tree';

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
