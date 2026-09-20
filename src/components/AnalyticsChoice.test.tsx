import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { AnalyticsChoice } from './AnalyticsChoice';

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

const allow = () => screen.getByRole('button', { name: 'Allow usage analytics' });

it('asks before anything is sent, and explains what would be', () => {
  render(<AnalyticsChoice enabled={false} onEnable={vi.fn()} />);
  expect(screen.getByRole('heading', { name: 'Share anonymous usage?' })).toBeInTheDocument();
  expect(screen.getByText(/no counts, no phrases, no account/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy.html');
});

it('turns it on and steps out of the way', async () => {
  const onEnable = vi.fn().mockResolvedValue(true);
  render(<AnalyticsChoice enabled={false} onEnable={onEnable} />);
  fireEvent.click(allow());
  await waitFor(() => expect(screen.queryByRole('heading', { name: 'Share anonymous usage?' })).not.toBeInTheDocument());
  expect(onEnable).toHaveBeenCalledOnce();
});

// Losing the write is not consent. The card has to come back so the setting and the
// prompt cannot disagree.
it('stays put if the setting could not be saved', async () => {
  const onEnable = vi.fn().mockResolvedValue(false);
  render(<AnalyticsChoice enabled={false} onEnable={onEnable} />);
  fireEvent.click(allow());
  await waitFor(() => expect(onEnable).toHaveBeenCalled());
  expect(allow()).toBeEnabled();
});

it('takes no for an answer, and remembers it', () => {
  const onEnable = vi.fn();
  const { unmount } = render(<AnalyticsChoice enabled={false} onEnable={onEnable} />);
  fireEvent.click(screen.getByRole('button', { name: 'Not now' }));
  expect(screen.queryByRole('heading', { name: 'Share anonymous usage?' })).not.toBeInTheDocument();
  expect(onEnable).not.toHaveBeenCalled();

  unmount();
  render(<AnalyticsChoice enabled={false} onEnable={onEnable} />);
  expect(screen.queryByRole('heading', { name: 'Share anonymous usage?' })).not.toBeInTheDocument();
});

it('does not ask again once it is already on', () => {
  render(<AnalyticsChoice enabled onEnable={vi.fn()} />);
  expect(screen.queryByRole('heading', { name: 'Share anonymous usage?' })).not.toBeInTheDocument();
});

// A prompt that cannot be dismissed would return on every single load.
it('stays silent in a browser that cannot remember the answer', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('denied'); });
  render(<AnalyticsChoice enabled={false} onEnable={vi.fn()} />);
  expect(screen.queryByRole('heading', { name: 'Share anonymous usage?' })).not.toBeInTheDocument();
});
