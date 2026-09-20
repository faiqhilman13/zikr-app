import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { starterPresets } from '../domain/state';
import { Onboarding } from './Onboarding';

describe('Onboarding', () => {
  it('keeps analytics off by default and saves the choice with the practice setup', () => {
    const complete = vi.fn();
    render(<Onboarding presets={starterPresets} analyticsEnabled={false} onComplete={complete} onClose={vi.fn()} />);
    expect(screen.queryByLabelText(/name/i)).not.toBeInTheDocument();
    const analytics = screen.getByRole('checkbox', { name: /share usage analytics/i });
    expect(analytics).not.toBeChecked();
    fireEvent.click(analytics);
    fireEvent.change(screen.getByRole('slider', { name: /daily target/i }), { target: { value: '50' } });
    fireEvent.click(screen.getByRole('button', { name: /start counting/i }));
    expect(complete).toHaveBeenCalledWith('tasbih', 50, true);
  });

  it('reflects consent already given on the landing page', () => {
    render(<Onboarding presets={starterPresets} analyticsEnabled onComplete={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole('checkbox', { name: /share usage analytics/i })).toBeChecked();
  });
});
