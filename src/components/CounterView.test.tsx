import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { initialState } from '../domain/state';
import { CounterView } from './CounterView';

describe('CounterView', () => {
  it('exposes a clear accessible counting action', () => {
    const increment = vi.fn();
    render(<CounterView state={initialState()} onIncrement={increment} onUndo={vi.fn()} onSelect={vi.fn()} onToggleTimer={vi.fn()} onTimerRollover={vi.fn()} />);
    const button = screen.getByRole('button', { name: /Tap to count: Tasbih. 0 of 33/i });
    fireEvent.click(button);
    expect(increment).toHaveBeenCalledOnce();
    expect(screen.getByText('Tasbih: 1 of 33')).toBeInTheDocument();
  });

  it('states that timed practice is not converted into repetitions', () => {
    render(<CounterView state={initialState()} onIncrement={vi.fn()} onUndo={vi.fn()} onSelect={vi.fn()} onToggleTimer={vi.fn()} onTimerRollover={vi.fn()} />);
    expect(screen.getByText(/Time is recorded separately/i)).toBeInTheDocument();
  });
});
