import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { FeedbackCard } from './FeedbackCard';
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
function fill() {
  render(<FeedbackCard />);
  fireEvent.change(screen.getByLabelText('Your feedback'), { target: { value: 'A calmer daily routine.' } });
}
it('sends only feedback fields and clears the message after acknowledgement', async () => {
  const fetcher = vi.fn().mockResolvedValue({ ok: true, text: async () => 'zikr-feedback-received' });
  vi.stubGlobal('fetch', fetcher); fill();
  fireEvent.click(screen.getByRole('button', { name: 'Send feedback' }));
  expect(await screen.findByRole('status')).toHaveTextContent('has been sent');
  expect(screen.getByLabelText('Your feedback')).toHaveValue('');
  const body = new URLSearchParams(fetcher.mock.calls[0][1].body);
  expect([...body.keys()].sort()).toEqual(['bot-field', 'email', 'form-name', 'language', 'message', 'rating']);
  expect(body.get('message')).toBe('A calmer daily routine.');
});
it('retains feedback when delivery fails or an unexpected HTML page is returned', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: async () => '<html>App shell</html>' }));
  fill(); fireEvent.click(screen.getByRole('button', { name: 'Send feedback' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('couldn’t confirm');
  expect(screen.getByLabelText('Your feedback')).toHaveValue('A calmer daily routine.');
});
it('does not send while offline', () => {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
  const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher); fill();
  fireEvent.click(screen.getByRole('button', { name: 'Send feedback' }));
  expect(screen.getByRole('alert')).toHaveTextContent('offline');
  expect(fetcher).not.toHaveBeenCalled();
});
it('prevents duplicate submits while a request is pending and recovers after failure', async () => {
  let reject!: (reason: Error) => void;
  const fetcher = vi.fn(() => new Promise((_, fail) => { reject = fail; }));
  vi.stubGlobal('fetch', fetcher); fill();
  const form = screen.getByLabelText('Your feedback').closest('form')!;
  fireEvent.submit(form); fireEvent.submit(form);
  expect(fetcher).toHaveBeenCalledTimes(1);
  reject(new Error('timeout'));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Send feedback' })).toBeEnabled());
  expect(screen.getByLabelText('Your feedback')).toHaveValue('A calmer daily routine.');
});
