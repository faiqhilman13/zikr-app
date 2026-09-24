import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { db } from './data/db';
import { dayKey, initialState } from './domain/state';
import { addDays } from './domain/streak';

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    needRefresh: [false, () => undefined],
    offlineReady: [false, () => undefined],
    updateServiceWorker: () => Promise.resolve()
  })
}));

// Detection runs once when i18n loads, before a test can touch navigator, so the
// detected value is substituted here instead.
vi.mock('./i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./i18n')>();
  return { ...actual, detectedLanguage: 'tr' };
});

beforeEach(async () => { await db.records.clear(); });

it('greets a first-time visitor in their own language, not the state default', async () => {
  const { App } = await import('./App');
  render(<App />);
  // Every new state carries language 'en'. If that default is allowed to win, a Turkish
  // browser lands on English and the translations are unreachable without a manual switch.
  await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Zikir için küçük bir yer açın.'));
  expect(document.documentElement.lang).toBe('tr');
});

it('opens the streak sheet from the header chip, and closes it again', async () => {
  const today = dayKey();
  const base = initialState();
  const logs = [1, 2, 3].map((back) => ({ date: addDays(today, -back), counts: {}, timedSeconds: {}, completed: true }));
  await db.records.put({ id: 'current', value: { ...base, onboardingComplete: true, logs: [...logs, ...base.logs] }, revision: 1, generation: 'original' });
  const { App } = await import('./App');
  render(<App />);
  fireEvent.click(await screen.findByRole('button', { name: /^Streak: 3 days\./ }));
  const sheet = screen.getByRole('dialog', { name: '3 day streak' });
  fireEvent.click(within(sheet).getAllByRole('button', { name: 'Done' })[0]);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
