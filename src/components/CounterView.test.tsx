import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { initialState, startTimer } from '../domain/state';
import { CounterView } from './CounterView';

describe('CounterView', () => {
  it('exposes a clear accessible counting action', () => {
    const increment = vi.fn();
    render(<CounterView state={initialState()} onIncrement={increment} onUndo={vi.fn()} onSelect={vi.fn()} onStartTimer={vi.fn()} onStopTimer={vi.fn()} onTimerRollover={vi.fn()} />);
    const button = screen.getByRole('button', { name: /Tap to count: Tasbih. 0 of 33/i });
    fireEvent.click(button);
    expect(increment).toHaveBeenCalledOnce();
    expect(screen.getByText('Tasbih: 1 of 33')).toBeInTheDocument();
  });

  it('notes when a session is only recording time', () => {
    render(<CounterView state={initialState()} onIncrement={vi.fn()} onUndo={vi.fn()} onSelect={vi.fn()} onStartTimer={vi.fn()} onStopTimer={vi.fn()} onTimerRollover={vi.fn()} />);
    expect(screen.getByText(/Time is recorded on its own and stops at midnight/i)).toBeInTheDocument();
  });

  it('offers the next unfinished phrase once the target is reached', () => {
    const base = initialState();
    const state = { ...base, logs: [{ ...base.logs[0], counts: { tasbih: 33 } }] };
    const onSelect = vi.fn();
    render(<CounterView state={state} onIncrement={vi.fn()} onUndo={vi.fn()} onSelect={onSelect} onStartTimer={vi.fn()} onStopTimer={vi.fn()} onTimerRollover={vi.fn()} />);
    expect(screen.getByText('Tasbih complete for today')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Continue with Tahmid/i }));
    expect(onSelect).toHaveBeenCalledWith('tahmid');
  });

  it('asks how long a repetition takes before starting, rather than starting blind', () => {
    const onStartTimer = vi.fn();
    render(<CounterView state={initialState()} onIncrement={vi.fn()} onUndo={vi.fn()} onSelect={vi.fn()} onStartTimer={onStartTimer} onStopTimer={vi.fn()} onTimerRollover={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Start timer/i }));
    expect(onStartTimer).toHaveBeenCalledOnce();
  });

  it('shows repetitions accruing at the chosen pace while a session counts', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 19, 10, 0, 0));
    const state = startTimer(initialState(), 3);
    vi.setSystemTime(new Date(2026, 8, 19, 10, 0, 31));
    render(<CounterView state={state} onIncrement={vi.fn()} onUndo={vi.fn()} onSelect={vi.fn()} onStartTimer={vi.fn()} onStopTimer={vi.fn()} onTimerRollover={vi.fn()} />);
    // Ten repetitions earned but not yet banked still show on the orb, the day total and the chip.
    expect(screen.getByRole('button', { name: /Tap to count: Tasbih. 10 of 33/i })).toBeInTheDocument();
    expect(screen.getByText('23 remaining')).toBeInTheDocument();
    expect(screen.getByText('10 / 33')).toBeInTheDocument();
    expect(screen.getByText(/Counting · one every 3s/i)).toBeInTheDocument();
    expect(screen.queryByText(/Time is recorded on its own/i)).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('stops a running session from the same control', () => {
    const onStopTimer = vi.fn();
    const state = { ...initialState(), activeTimer: { presetId: 'tasbih', startedAt: Date.now() } };
    render(<CounterView state={state} onIncrement={vi.fn()} onUndo={vi.fn()} onSelect={vi.fn()} onStartTimer={vi.fn()} onStopTimer={onStopTimer} onTimerRollover={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Pause timer/i }));
    expect(onStopTimer).toHaveBeenCalledOnce();
  });
});
