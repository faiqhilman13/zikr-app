import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { starterPresets } from '../domain/state';
import { Onboarding } from './Onboarding';

describe('Onboarding', () => {
  it('asks only for a preferred phrase and target', () => {
    const complete = vi.fn();
    render(<Onboarding presets={starterPresets} onComplete={complete} onClose={vi.fn()} />);
    expect(screen.queryByLabelText(/name/i)).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole('slider', { name: /daily target/i }), { target: { value: '50' } });
    fireEvent.click(screen.getByRole('button', { name: /start counting/i }));
    expect(complete).toHaveBeenCalledWith('tasbih', 50);
  });
});
