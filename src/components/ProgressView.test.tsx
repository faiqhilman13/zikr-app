import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { dayKey, emptyLog, initialState } from '../domain/state';
import type { ZikrState } from '../domain/types';
import { ProgressView } from './ProgressView';

const yesterdayKey = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return dayKey(date);
};

const stateWithHistory = (): ZikrState => ({
  ...initialState(),
  logs: [emptyLog(), { date: yesterdayKey(), counts: { tasbih: 40, tahmid: 12 }, timedSeconds: { tasbih: 120 }, completed: false }]
});

describe('ProgressView', () => {
  it('shows the practice map with an accessible cell for each recorded day', () => {
    render(<ProgressView state={stateWithHistory()} />);
    expect(screen.getByRole('group', { name: /Daily practice map/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /· 52 repetitions/i })).toBeInTheDocument();
  });

  it('opens a per-phrase day detail from a history row', () => {
    render(<ProgressView state={stateWithHistory()} />);
    fireEvent.click(screen.getByRole('button', { name: /min timed/i }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Tasbih')).toBeInTheDocument();
    expect(within(dialog).getByText('40')).toBeInTheDocument();
    expect(within(dialog).getByText('Tahmid')).toBeInTheDocument();
  });

  it('breaks today down phrase by phrase against targets', () => {
    render(<ProgressView state={stateWithHistory()} />);
    expect(screen.getByRole('heading', { name: 'Phrase by phrase' })).toBeInTheDocument();
  });
});
