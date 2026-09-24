import { readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { authorized, dayBefore, dayKey, summarize, validPayload } from '../functions/usage.mjs';
import { expiring } from '../functions/usage-cleanup.mjs';

const NOW = new Date('2026-09-20T11:30:00Z');
const day = (offset) => dayBefore(offset, NOW);
const id = (n) => `0000000${n}-0000-4000-8000-000000000000`.slice(-36);
const key = (offset, kind, browser) => `${day(offset)}/${kind}/${id(browser)}`;

describe('payload validation', () => {
  const good = { id: id(1), kinds: ['visit'] };

  it('accepts exactly an id and known kinds', () => {
    expect(validPayload(good)).toBe(true);
    expect(validPayload({ id: id(1), kinds: ['visit', 'active', 'standalone'] })).toBe(true);
    expect(validPayload({ id: id(1), kinds: ['visit', 'active', 'standalone', 'reminders', 'reminded'] })).toBe(true);
  });

  // The point of the endpoint is that practice data cannot reach it, so an extra key is
  // a rejection rather than something to ignore.
  it('rejects anything carrying a field it did not ask for', () => {
    expect(validPayload({ ...good, counts: 33 })).toBe(false);
    expect(validPayload({ ...good, phrase: 'SubhanAllah' })).toBe(false);
    expect(validPayload({ ...good, url: 'https://example.test' })).toBe(false);
    expect(validPayload({ ...good, streak: 12 })).toBe(false);
    expect(validPayload({ ...good, reminderTime: '21:00' })).toBe(false);
  });

  it('rejects a malformed or missing identifier', () => {
    expect(validPayload({ kinds: ['visit'] })).toBe(false);
    expect(validPayload({ id: 'not-a-uuid', kinds: ['visit'] })).toBe(false);
    expect(validPayload({ id: 42, kinds: ['visit'] })).toBe(false);
    // A v1 UUID carries a MAC address and a timestamp; only v4 is accepted.
    expect(validPayload({ id: 'c232ab00-9414-11ec-b3c8-9e6bdeced846', kinds: ['visit'] })).toBe(false);
  });

  it('rejects unknown, empty, repeated, oversized or non-array kinds', () => {
    expect(validPayload({ id: id(1), kinds: [] })).toBe(false);
    expect(validPayload({ id: id(1), kinds: ['count_increment'] })).toBe(false);
    expect(validPayload({ id: id(1), kinds: ['streak'] })).toBe(false);
    expect(validPayload({ id: id(1), kinds: 'visit' })).toBe(false);
    expect(validPayload({ id: id(1), kinds: ['visit', 'visit'] })).toBe(false);
    expect(validPayload({ id: id(1), kinds: ['visit', 'active', 'standalone', 'reminders', 'reminded', 'visit'] })).toBe(false);
  });

  it('rejects values that are not a plain object', () => {
    for (const value of [null, undefined, 'visit', 7, [], [good]]) expect(validPayload(value)).toBe(false);
  });
});

describe('dashboard authorisation', () => {
  it('accepts only the exact bearer token', () => {
    expect(authorized('Bearer hunter2', 'hunter2')).toBe(true);
    expect(authorized('Bearer hunter3', 'hunter2')).toBe(false);
    expect(authorized('hunter2', 'hunter2')).toBe(false);
  });

  // An unset key must never mean "everything is authorised", and a length mismatch must
  // not throw out of timingSafeEqual before the comparison happens.
  it('refuses when the key is unset, and survives mismatched lengths', () => {
    expect(authorized('Bearer hunter2', undefined)).toBe(false);
    expect(authorized('Bearer hunter2', '')).toBe(false);
    expect(authorized(null, 'hunter2')).toBe(false);
    expect(authorized('Bearer ' + 'x'.repeat(5000), 'hunter2')).toBe(false);
  });
});

describe('summary', () => {
  it('reports zeroes, and a full window of days, with nothing stored', () => {
    const report = summarize([], NOW);
    expect(report.visitors).toBe(0);
    expect(report.daily).toHaveLength(30);
    expect(report.daily.at(-1).date).toBe(dayKey(NOW));
    expect(report.daily[0].date).toBe(day(29));
  });

  it('counts a browser once however many records it leaves', () => {
    const report = summarize([key(0, 'visit', 1), key(0, 'active', 1), key(0, 'standalone', 1)], NOW);
    expect(report.visitors).toBe(1);
    expect(report.activeToday).toBe(1);
    expect(report.standalone).toBe(1);
  });

  it('counts the same browser once across many days, and each day separately', () => {
    const report = summarize([key(0, 'visit', 1), key(1, 'visit', 1), key(2, 'visit', 1)], NOW);
    expect(report.visitors).toBe(1);
    expect(report.daily.at(-1).visitors).toBe(1);
    expect(report.daily.at(-2).visitors).toBe(1);
  });

  it('calls a browser returning only after a second, separate day', () => {
    expect(summarize([key(0, 'visit', 1)], NOW).returning).toBe(0);
    expect(summarize([key(0, 'visit', 1), key(5, 'visit', 1)], NOW).returning).toBe(1);
    // Two kinds on one day is one visit day, not two.
    expect(summarize([key(0, 'visit', 1), key(0, 'active', 1)], NOW).returning).toBe(0);
  });

  it('measures weekly retention as the overlap between the two weeks', () => {
    const report = summarize([
      key(10, 'active', 1), key(10, 'active', 2), key(10, 'active', 3),
      key(2, 'active', 1), key(2, 'active', 4)
    ], NOW);
    expect(report.priorWeekActive).toBe(3);
    expect(report.retainedFromPriorWeek).toBe(1);
    expect(report.active7d).toBe(2);
  });

  // No streak is ever sent, so a streak shows up as the same browser active day after day.
  it('reads streaks from consecutive days of use', () => {
    const report = summarize([
      // Browser 1 used the app on each of the seven full days before today.
      ...[1, 2, 3, 4, 5, 6, 7].map((offset) => key(offset, 'active', 1)),
      // Browser 2 came back once, the next day, and not since.
      key(3, 'active', 2), key(2, 'active', 2),
      // Browser 3 only today.
      key(0, 'active', 3)
    ], NOW);
    // Pairs of days, each full: day 8 into 7, through day 2 into 1. Browser 1 is
    // expected back yesterday and today, but today is still under way, so it is not
    // counted as a day browser 1 failed to return.
    expect(report.nextDayBase).toBe(8);
    expect(report.nextDayReturned).toBe(7);
    expect(report.activeEveryDay).toBe(1);
    expect(report.daily.at(-3).consecutive).toBe(2);
    expect(report.daily.at(-2).consecutive).toBe(1);
    expect(report.daily.at(-1).consecutive).toBe(0);
    // The oldest day shown has no day before it in the report to compare with.
    expect(report.daily[0].consecutive).toBeNull();
  });

  it('counts browsers keeping reminders, and those a reminder brought back', () => {
    const report = summarize([
      key(0, 'reminders', 1), key(0, 'reminded', 1), key(3, 'reminders', 1),
      key(2, 'reminders', 2),
      key(9, 'reminders', 3), key(9, 'reminded', 3)
    ], NOW);
    expect(report.reminders7d).toBe(2);
    expect(report.reminded7d).toBe(1);
    expect(report.daily.at(-1)).toMatchObject({ reminders: 1, reminded: 1 });
    expect(report.daily.at(-3)).toMatchObject({ reminders: 1, reminded: 0 });
  });

  it('drops records outside the window instead of folding them into a total', () => {
    const report = summarize([key(0, 'visit', 1), key(30, 'visit', 2), key(200, 'visit', 3)], NOW);
    expect(report.visitors).toBe(1);
  });

  // Keys are written by this function, but a report must not be corruptible by whatever
  // else ends up in the store.
  it('ignores keys that are not shaped like a record', () => {
    const report = summarize([
      key(0, 'visit', 1),
      'not-a-key', '', 'report/latest.json',
      `${day(0)}/visit/not-a-uuid`,
      `${day(0)}/count_increment/${id(2)}`,
      `banana/visit/${id(3)}`
    ], NOW);
    expect(report.visitors).toBe(1);
    expect(report.daily.at(-1).visitors).toBe(1);
  });

  it('is stated in UTC, so a reader is never comparing two timezones', () => {
    expect(summarize([], NOW).timezone).toBe('UTC');
    expect(summarize([], NOW).windowDays).toBe(30);
  });
});

describe('retention sweep', () => {
  it('covers a month-wide band that starts where the window ends', () => {
    const dates = expiring(NOW);
    expect(dates).toHaveLength(30);
    expect(dates[0]).toBe(day(90));
    expect(dates.at(-1)).toBe(day(119));
  });

  // A month of missed runs still heals, and nothing inside the retained window is touched.
  it('never reaches a date the dashboard still reports on', () => {
    for (const date of expiring(NOW)) expect(date < day(29)).toBe(true);
  });
});

describe('UTC day arithmetic', () => {
  it('steps back over month and year boundaries', () => {
    expect(dayBefore(1, new Date('2026-03-01T00:30:00Z'))).toBe('2026-02-28');
    expect(dayBefore(1, new Date('2026-01-01T23:30:00Z'))).toBe('2025-12-31');
    expect(dayBefore(0, new Date('2026-09-20T23:59:59Z'))).toBe('2026-09-20');
  });
});

// Netlify deploys every file sitting in the functions directory, so anything in there
// that is not a function is a broken build. That is how these tests first shipped: as
// two extra "functions", one of which could not even be bundled.
describe('the functions directory', () => {
  const entries = readdirSync(path.join(import.meta.dirname, '../functions'));

  it('holds only deployable functions, each with a handler', async () => {
    expect(entries).not.toHaveLength(0);
    for (const entry of entries) {
      expect(entry, `${entry} would be deployed as a function`).not.toMatch(/\.(test|spec)\./);
      expect(entry).toMatch(/\.mjs$/);
      const module = await import(`../functions/${entry}`);
      expect(typeof module.default, `${entry} exports no handler`).toBe('function');
    }
  });
});
