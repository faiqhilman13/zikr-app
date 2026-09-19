import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { db } from './data/db';

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
