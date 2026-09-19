import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { starterPresets } from '../domain/state';
import { TimerSetup } from './TimerSetup';

const tasbih = starterPresets[0];

describe('TimerSetup', () => {
  it('asks how long the chosen phrase takes and estimates the resulting pace', () => {
    render(<TimerSetup preset={tasbih} onStart={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText(/How many seconds does it take you to say Tasbih once\?/i)).toBeInTheDocument();
    expect(screen.getByText(/About 20 repetitions a minute/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Seconds per repetition/i), { target: { value: '2' } });
    expect(screen.getByText(/About 30 repetitions a minute/i)).toBeInTheDocument();
  });

  it('starts a counting session with the entered pace', () => {
    const onStart = vi.fn();
    render(<TimerSetup preset={tasbih} onStart={onStart} onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/Seconds per repetition/i), { target: { value: '2.5' } });
    fireEvent.click(screen.getByRole('button', { name: /Count repetitions/i }));
    expect(onStart).toHaveBeenCalledWith(2.5);
  });

  it('offers the last pace used for this phrase', () => {
    render(<TimerSetup preset={{ ...tasbih, secondsPerRep: 4 }} onStart={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByLabelText(/Seconds per repetition/i)).toHaveValue(4);
  });

  it('keeps time-only practice available, with no pace attached', () => {
    const onStart = vi.fn();
    render(<TimerSetup preset={tasbih} onStart={onStart} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Just track time/i }));
    expect(onStart).toHaveBeenCalledWith(null);
  });

  it('refuses to start counting from a pace that is not a duration', () => {
    render(<TimerSetup preset={tasbih} onStart={vi.fn()} onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/Seconds per repetition/i), { target: { value: '0' } });
    expect(screen.getByRole('button', { name: /Count repetitions/i })).toBeDisabled();
    expect(screen.getByText(/Enter how many seconds one repetition takes/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Just track time/i })).toBeEnabled();
  });
});
