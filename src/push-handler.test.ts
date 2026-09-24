import { IDBFactory } from 'fake-indexeddb';
import fs from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { formatDays, formatTimeLeft } from './components/streak/format';
import { db, mutateState } from './data/db';
import { initialState } from './domain/state';
import { addDays, calculateStreak } from './domain/streak';
import type { DailyLog, Language, ZikrState } from './domain/types';
import { resources } from './locales';

/* The service worker cannot import the app, so it carries its own copy of the streak
   arithmetic and the reminder wording. These tests hold that copy to the original. */

interface Reminder {
  title: string;
  options: { body: string; silent: boolean; renotify: boolean; tag: string; badge: string; lang: string; dir: string; data: { url: string } };
  unsubscribe?: boolean;
}
interface Worker {
  COPY: Record<string, Record<string, string>>;
  dayKey: (date: Date) => string;
  streakOf: (logs: Partial<DailyLog>[], today: string) => { current: number; freezes: number; todayDone: boolean };
  formatDays: (days: number, language: string) => string;
  formatTimeLeft: (ms: number, language: string) => string;
  reminderFor: (state: unknown, now: Date, preferred?: readonly string[]) => Reminder;
  readState: () => Promise<ZikrState | null>;
}

const source = fs.readFileSync(path.join(import.meta.dirname, '../public/push-handler.js'), 'utf8');

/** Runs the worker script against a stand-in for its global scope. */
function load(scope: Record<string, unknown> = {}) {
  const listeners = new Map<string, (event: unknown) => void>();
  const self: Record<string, unknown> = { addEventListener: (type: string, listener: (event: unknown) => void) => listeners.set(type, listener), ...scope };
  new Function('self', source)(self);
  return { worker: self.zikrReminder as Worker, listeners };
}

const TODAY = '2026-09-19';
// Fifteen hours of the day left, then four: open, then at risk.
const MORNING = new Date(2026, 8, 19, 9, 0, 0);
const EVENING = new Date(2026, 8, 19, 20, 0, 0);
const languages = Object.keys(resources) as Language[];

/** Days before today, oldest first and ending yesterday: x kept, - missed. */
function practice(pattern: string, { todayDone = false, language = 'en', pushEnabled = true }: { todayDone?: boolean; language?: Language; pushEnabled?: boolean } = {}): ZikrState {
  const base = initialState();
  const counts = todayDone ? Object.fromEntries(base.presets.map((preset) => [preset.id, preset.target])) : {};
  return {
    ...base,
    onboardingComplete: true,
    settings: { ...base.settings, language, reminders: { enabled: pushEnabled, time: '21:00', pushEnabled } },
    logs: [
      { date: TODAY, counts, timedSeconds: {}, completed: todayDone },
      ...[...pattern].map((mark, index) => ({ date: addDays(TODAY, index - pattern.length), counts: {}, timedSeconds: {}, completed: mark === 'x' }))
    ]
  };
}

const history = (marks: boolean[]): DailyLog[] =>
  marks.map((completed, index) => ({ date: addDays(TODAY, index - marks.length + 1), counts: {}, timedSeconds: {}, completed }));
const pick = ({ current, freezes, todayDone }: ReturnType<typeof calculateStreak>) => ({ current, freezes, todayDone });

describe('the streak a reminder speaks of', () => {
  const { worker } = load();

  it('is the one the app shows, for every pattern of the last ten days and today', () => {
    for (let mask = 0; mask < 1 << 11; mask += 1) {
      const logs = history(Array.from({ length: 11 }, (_, index) => Boolean(mask & (1 << index))));
      expect(worker.streakOf(logs, TODAY), mask.toString(2)).toEqual(pick(calculateStreak({ logs }, TODAY)));
    }
  });

  // Long enough to earn both freezes, spend them, and lose runs more than once.
  it('is the one the app shows over long, uneven histories', () => {
    let seed = 7;
    const random = () => (seed = (seed * 16_807) % 2_147_483_647) / 2_147_483_647;
    for (let run = 0; run < 300; run += 1) {
      const density = 0.6 + random() * 0.38;
      const logs = history(Array.from({ length: 120 }, () => random() < density));
      expect(worker.streakOf(logs, TODAY)).toEqual(pick(calculateStreak({ logs }, TODAY)));
    }
  });

  it('counts each finished day once, and nothing after today', () => {
    const days = history([true, true, false]);
    const logs = [...days, ...days.slice(0, 2), { date: addDays(TODAY, 1), counts: {}, timedSeconds: {}, completed: true }];
    expect(worker.streakOf(logs, TODAY)).toEqual({ current: 2, freezes: 0, todayDone: false });
    expect(worker.streakOf(logs, TODAY)).toEqual(pick(calculateStreak({ logs }, TODAY)));
    expect(worker.dayKey(EVENING)).toBe(TODAY);
  });
});

describe('what a reminder says', () => {
  const { worker } = load();
  const say = (state: unknown, now = EVENING) => {
    const { title, options } = worker.reminderFor(state, now);
    return { title, body: options.body, silent: options.silent };
  };

  it('warns while the streak is at risk, with the time the app would show', () => {
    expect(say(practice('xxxx'))).toEqual({ title: 'Streak: 4 days', body: 'Only 4 hr left today. Complete your intention to keep your streak.', silent: false });
  });

  it('asks for today by what it adds, while the day is young', () => {
    expect(say(practice('xxxx'), MORNING)).toEqual({ title: 'Streak: 4 days', body: 'Complete today to extend your streak to 5 days.', silent: false });
  });

  it('says when a freeze would cover the day', () => {
    expect(say(practice('xxxxxxx')).body).toBe('Only 4 hr left today. Complete your intention to keep your streak. If today slips by, a freeze will cover it.');
  });

  it('arrives without a sound once today is complete', () => {
    expect(say(practice('xxxx', { todayDone: true }))).toEqual({ title: 'Streak: 5 days', body: 'Today is complete. Come back tomorrow to keep it going.', silent: true });
  });

  it('invites a first day when there is no streak to keep', () => {
    expect(say(practice('xx--'))).toEqual({ title: 'A quiet moment for dhikr', body: 'Complete today’s intention to start a streak.', silent: false });
  });

  it('stays plain when there is nothing to complete, or nothing it can read', () => {
    const base = practice('xxxx');
    const plain = { title: 'A quiet moment for dhikr', body: 'Return when you are ready.', silent: false };
    expect(say({ ...base, presets: base.presets.map((preset) => ({ ...preset, target: 0 })) })).toEqual(plain);
    expect(say(null)).toEqual(plain);
    expect(say('not a state')).toEqual(plain);
    expect(say({ settings: null, presets: 'none', logs: 7 })).toEqual(plain);
  });

  it('makes a reminder switched off in the app the last one, and a quiet one', () => {
    expect(worker.reminderFor(practice('xxxx', { pushEnabled: false }), EVENING)).toMatchObject({ title: 'A quiet moment for dhikr', unsubscribe: true, options: { silent: true } });
    expect(worker.reminderFor(practice('xxxx'), EVENING).unsubscribe).toBeUndefined();
  });

  // Yesterday's may still be in the tray under the same tag, and a quiet swap would never be heard.
  it('takes the place of yesterday’s with a sound, and opens the app', () => {
    expect(worker.reminderFor(practice('xxxx'), EVENING).options).toMatchObject({ tag: 'zikr-reminder', renotify: true, badge: '/icons/badge-96.png', data: { url: '/?source=reminder' } });
    expect(worker.reminderFor(practice('xxxx', { todayDone: true }), EVENING).options).toMatchObject({ tag: 'zikr-reminder', renotify: false });
  });
});

describe('the languages a reminder speaks', () => {
  const { worker } = load();
  const app = (language: string) => (resources as unknown as Record<string, { translation: Record<string, string> }>)[language].translation;

  it('uses the app’s own sentences wherever the app has one', () => {
    expect(Object.keys(worker.COPY).sort()).toEqual([...languages].sort());
    for (const language of languages) {
      const copy = worker.COPY[language];
      const t = app(language);
      expect(Object.keys(copy).sort(), language).toEqual(Object.keys(worker.COPY.en).sort());
      for (const key of ['streakDoneLine', 'streakAtRiskLine', 'streakFreezeWillCover', 'streakNoneLine']) expect(copy[key], `${language} ${key}`).toBe(t[key]);
      expect(`${copy.streakTitle}. {{status}}`, language).toBe(t.streakChipLabel);
      expect(copy.streakNudgeLine, language).toBe(`${t.streakNudgePending}.`);
      for (const text of Object.values(copy)) expect(text.trim(), language).not.toBe('');
    }
  });

  it('counts days and hours exactly as the app does', () => {
    for (const language of languages) {
      for (const days of [0, 1, 2, 3, 11, 100]) expect(worker.formatDays(days, language)).toBe(formatDays(days, language));
      for (const ms of [30_000, 59 * 60_000, 3_600_000, 4 * 3_600_000 + 1, 5.5 * 3_600_000]) expect(worker.formatTimeLeft(ms, language)).toBe(formatTimeLeft(ms, language));
    }
  });

  it('speaks the language chosen in the app, else the browser’s, and sets Arabic right to left', () => {
    const turkish = worker.reminderFor(practice('xxxx', { language: 'tr' }), EVENING, ['ar']);
    expect(turkish.options).toMatchObject({ lang: 'tr', dir: 'ltr', body: `Bugün yalnızca ${formatTimeLeft(4 * 3_600_000, 'tr')} kaldı. Serinizi korumak için niyetinizi tamamlayın.` });
    expect(worker.reminderFor(null, EVENING, ['ar-EG', 'en'])).toMatchObject({ title: 'لحظة هادئة للذكر', options: { lang: 'ar', dir: 'rtl' } });
    // Before onboarding the app follows the browser too, whatever the default setting says.
    expect(worker.reminderFor({ ...practice('xxxx', { language: 'ms' }), onboardingComplete: false }, EVENING, ['id-ID']).options.lang).toBe('id');
    expect(worker.reminderFor(null, EVENING, ['fr-FR', 'de']).options.lang).toBe('en');
  });

  it('leaves nothing unfilled, in any language or case', () => {
    for (const language of languages) {
      for (const state of [practice('xxxx', { language }), practice('xxxxxxx', { language }), practice('xxxx', { language, todayDone: true }), practice('--', { language }), null]) {
        for (const now of [MORNING, EVENING]) {
          const { title, options } = worker.reminderFor(state, now, [language]);
          expect(options.lang).toBe(language);
          expect(`${title} ${options.body}`).not.toMatch(/[{}]/);
        }
      }
    }
  });
});

describe('reading the practice on the device', () => {
  beforeEach(async () => { await db.records.clear(); });

  it('finds what the app saved, where the app saved it', async () => {
    await mutateState('original', () => practice('xxxx', { todayDone: true }));
    const saved = (await db.records.get('current'))?.value;
    expect(saved?.logs.length).toBeGreaterThan(4);
    expect(await load({ indexedDB }).worker.readState()).toEqual(saved);
  });

  it('finds nothing, and makes nothing, where the app never saved', async () => {
    const empty = new IDBFactory();
    expect(await load({ indexedDB: empty }).worker.readState()).toBeNull();
    expect(await empty.databases()).toEqual([]);
  });
});

describe('a push', () => {
  async function deliver(scope: Record<string, unknown>) {
    const showNotification = vi.fn(async () => undefined);
    const unsubscribe = vi.fn(async () => true);
    const { listeners } = load({
      navigator: { languages: ['ms-MY', 'en'] },
      registration: { showNotification, pushManager: { getSubscription: async () => ({ unsubscribe }) } },
      ...scope
    });
    let settled: unknown = Promise.resolve();
    listeners.get('push')?.({ data: { json: () => ({ v: 1, day: TODAY }) }, waitUntil: (promise: unknown) => { settled = promise; } });
    await settled;
    return { showNotification, unsubscribe };
  }

  beforeEach(async () => { await db.records.clear(); });

  it('always ends in a notification, even with nothing to read', async () => {
    const { showNotification, unsubscribe } = await deliver({ indexedDB: new IDBFactory() });
    expect(showNotification).toHaveBeenCalledWith('Detik tenang untuk berzikir', expect.objectContaining({ body: 'Kembalilah apabila anda bersedia.', lang: 'ms' }));
    expect(unsubscribe).not.toHaveBeenCalled();
  });

  it('shows one even when the database will not open', async () => {
    const { showNotification } = await deliver({ indexedDB: { open: () => { throw new Error('Blocked by the browser'); } } });
    expect(showNotification).toHaveBeenCalledOnce();
  });

  it('gives up its subscription once reminders are off in the app', async () => {
    await mutateState('original', () => practice('xxxx', { pushEnabled: false, language: 'ar' }));
    const { showNotification, unsubscribe } = await deliver({ indexedDB });
    expect(showNotification).toHaveBeenCalledWith('لحظة هادئة للذكر', expect.objectContaining({ silent: true, dir: 'rtl' }));
    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});
