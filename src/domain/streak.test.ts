import { describe, expect, it } from 'vitest';
import { addDays, calculateStreak, isMilestone, milestoneProgress, msLeftToday, nextMilestone, recentDays, recentLoss, streakStatus } from './streak';

const TODAY = '2026-03-20';
// One character per day, oldest first, ending today: x is a completed day, - is not.
const history = (pattern: string, today = TODAY) => ({
  logs: [...pattern].map((mark, index) => ({ date: addDays(today, index - pattern.length + 1), counts: {}, timedSeconds: {}, completed: mark === 'x' }))
});
const streakOf = (pattern: string) => calculateStreak(history(pattern), TODAY);

describe('streak', () => {
  it('leaves an unfinished today open instead of counting it as missed', () => {
    const streak = streakOf('xx-');
    expect(streak).toMatchObject({ current: 2, todayDone: false, lost: null, freezes: 0 });
  });

  it('counts today once it is complete', () => {
    expect(streakOf('xxx')).toMatchObject({ current: 3, longest: 3, todayDone: true });
  });

  it('ends a run on a missed day nothing covers and remembers how long it was', () => {
    const streak = streakOf('xxx-x-');
    expect(streak.current).toBe(1);
    expect(streak.longest).toBe(3);
    expect(streak.lost).toEqual({ length: 3, date: addDays(TODAY, -2) });
  });

  it('reports a run that ended before today as zero', () => {
    const streak = streakOf('xxxx--');
    expect(streak.current).toBe(0);
    expect(streak.lost).toEqual({ length: 4, date: addDays(TODAY, -1) });
  });

  it('earns a freeze every seven days and spends it on the next missed day', () => {
    expect(streakOf('xxxxxxx-')).toMatchObject({ current: 7, freezes: 1 });
    const streak = streakOf('xxxxxxx-x-');
    expect(streak).toMatchObject({ current: 8, freezes: 0, lost: null, recentlyFrozen: [] });
    expect(streak.frozenDays).toEqual([addDays(TODAY, -2)]);
  });

  it('tells a returning person which days were covered since they last finished', () => {
    const streak = streakOf('xxxxxxx--');
    expect(streak).toMatchObject({ current: 7, freezes: 0, lost: null });
    expect(streak.recentlyFrozen).toEqual([addDays(TODAY, -1)]);
  });

  it('holds at most two freezes', () => {
    expect(streakOf(`${'x'.repeat(21)}-`).freezes).toBe(2);
    expect(streakOf(`${'x'.repeat(14)}-${'x'.repeat(7)}-`)).toMatchObject({ current: 21, freezes: 2 });
  });

  it('spends two freezes on two missed days in a row', () => {
    const streak = streakOf(`${'x'.repeat(14)}--x`);
    expect(streak).toMatchObject({ current: 15, freezes: 0, lost: null, todayDone: true });
    expect(streak.frozenDays).toEqual([addDays(TODAY, -2), addDays(TODAY, -1)]);
    expect(streak.recentlyFrozen).toEqual(streak.frozenDays);
  });

  it('loses the run, and the freeze, when a gap is longer than the freezes held', () => {
    const streak = streakOf('xxxxxxx---');
    expect(streak).toMatchObject({ current: 0, freezes: 0, longest: 7, recentlyFrozen: [] });
    expect(streak.frozenDays).toEqual([addDays(TODAY, -2)]);
    expect(streak.lost).toEqual({ length: 7, date: addDays(TODAY, -1) });
  });

  it('keeps counting the longest run across a covered day', () => {
    expect(streakOf('xxxxxxx-xxxxx')).toMatchObject({ current: 12, longest: 12 });
  });

  it('marks the completion that earns a freeze', () => {
    expect(streakOf('xxxxxxx')).toMatchObject({ current: 7, freezes: 1, freezeEarnedToday: true });
    expect(streakOf('xxxxxx')).toMatchObject({ freezeEarnedToday: false });
    expect(streakOf(`${'x'.repeat(20)}x`).freezeEarnedToday).toBe(false);
  });

  it('ignores future and duplicate days', () => {
    const { logs } = history('xx-');
    const tomorrow = { date: addDays(TODAY, 1), counts: {}, timedSeconds: {}, completed: true };
    expect(calculateStreak({ logs: [...logs, logs[0], tomorrow] }, TODAY)).toMatchObject({ current: 2, todayDone: false });
  });

  it('treats days across a clock change and a new year as consecutive', () => {
    for (const today of ['2026-03-10', '2026-03-31', '2026-11-03', '2027-01-02']) {
      expect(calculateStreak(history('xxxxx', today), today).current).toBe(5);
    }
  });

  it('turns at risk in the last hours of an unfinished day', () => {
    const open = streakOf('xx-');
    expect(msLeftToday(new Date(2026, 2, 20, 18, 0, 0))).toBe(6 * 3_600_000);
    expect(streakStatus(open, new Date(2026, 2, 20, 10, 0, 0))).toBe('pending');
    expect(streakStatus(open, new Date(2026, 2, 20, 18, 0, 0))).toBe('at-risk');
    expect(streakStatus(streakOf('xxx'), new Date(2026, 2, 20, 23, 0, 0))).toBe('done');
    expect(streakStatus(streakOf('x---'), new Date(2026, 2, 20, 23, 0, 0))).toBe('none');
  });

  it('mentions a lost run only while it is recent, long enough to matter, and not yet restarted', () => {
    expect(recentLoss(streakOf('xxxx--'), TODAY)).toEqual({ length: 4, date: addDays(TODAY, -1) });
    expect(recentLoss(streakOf('xx--'), TODAY)).toBeNull();
    expect(recentLoss(streakOf('xxxx--x'), TODAY)).toBeNull();
    expect(recentLoss(streakOf('xxxx--------'), TODAY)).toEqual({ length: 4, date: addDays(TODAY, -7) });
    expect(recentLoss(streakOf('xxxx---------'), TODAY)).toBeNull();
  });

  it('marks the last seven days for the chain', () => {
    const { logs } = history('xxxxxxx-x-');
    const streak = calculateStreak({ logs }, TODAY);
    expect(recentDays({ logs }, streak.frozenDays, TODAY).map((day) => day.mark)).toEqual(['done', 'done', 'done', 'done', 'done', 'frozen', 'done', 'open'].slice(-7));
    expect(recentDays(history('x--'), [], TODAY).slice(-3).map((day) => day.mark)).toEqual(['done', 'missed', 'open']);
  });

  it('places milestones and the progress toward the next one', () => {
    expect([3, 7, 30, 100, 365, 1000, 1095, 1460].every(isMilestone)).toBe(true);
    expect([1, 8, 364, 1001].some(isMilestone)).toBe(false);
    expect([0, 3, 7, 999, 1000, 1095].map(nextMilestone)).toEqual([3, 7, 14, 1000, 1095, 1460]);
    expect(milestoneProgress(10)).toEqual({ next: 14, previous: 7, remaining: 4, ratio: 3 / 7 });
    expect(milestoneProgress(0)).toMatchObject({ next: 3, previous: 0, ratio: 0 });
    expect(milestoneProgress(1050)).toMatchObject({ next: 1095, previous: 1000 });
  });
});
