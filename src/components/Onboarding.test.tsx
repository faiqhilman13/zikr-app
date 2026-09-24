import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { starterPresets } from '../domain/state';
import { Onboarding } from './Onboarding';

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1';
const ANDROID = 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36';

const onPhone = (userAgent: string) => vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(userAgent);
const renderOnboarding = () => render(<Onboarding presets={starterPresets} analyticsEnabled={false} onComplete={vi.fn()} onClose={vi.fn()} />);

describe('Onboarding', () => {
  afterEach(() => vi.restoreAllMocks());

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

  it('asks an iPhone browser to add Zikr to the Home Screen before any setup', () => {
    onPhone(IPHONE);
    renderOnboarding();
    expect(screen.getByRole('heading', { name: /add zikr to your home screen/i })).toBeInTheDocument();
    expect(screen.getByText(/reminders only work in the home screen app/i)).toBeInTheDocument();
    expect(screen.getByText(/tap share/i)).toBeInTheDocument();
    expect(screen.getByText(/in safari first/i)).toBeInTheDocument();
    expect(screen.getByText(/keeps its own data/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /start counting/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /continue in the browser/i }));
    expect(screen.getByRole('heading', { name: /shape your daily rhythm/i })).toHaveFocus();
    expect(screen.getByRole('button', { name: /start counting/i })).toBeInTheDocument();
    expect(screen.getByText(/any time from settings/i)).toBeInTheDocument();
  });

  it('goes straight to setup inside the Home Screen app', () => {
    onPhone(IPHONE);
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({ matches: query === '(display-mode: standalone)', media: query }) as MediaQueryList);
    renderOnboarding();
    expect(screen.getByRole('heading', { name: /shape your daily rhythm/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /add zikr to your home screen/i })).not.toBeInTheDocument();
  });

  it('offers the browser’s own install prompt on Android and moves on once accepted', async () => {
    onPhone(ANDROID);
    renderOnboarding();
    expect(screen.getByText(/open your browser menu/i)).toBeInTheDocument();

    // Chrome offers installation a moment after the page loads.
    const prompt = vi.fn(async () => undefined);
    act(() => {
      window.dispatchEvent(Object.assign(new Event('beforeinstallprompt', { cancelable: true }), { prompt, userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }) }));
    });
    expect(screen.queryByText(/open your browser menu/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /install zikr/i }));
    expect(prompt).toHaveBeenCalledOnce();
    expect(await screen.findByRole('heading', { name: /shape your daily rhythm/i })).toHaveFocus();
    expect(screen.queryByText(/any time from settings/i)).not.toBeInTheDocument();
  });

  it('shows the manual steps on Android when the browser has no prompt to offer', () => {
    onPhone(ANDROID);
    renderOnboarding();
    expect(screen.getByRole('heading', { name: /add zikr to your home screen/i })).toBeInTheDocument();
    expect(screen.getByText(/open your browser menu/i)).toBeInTheDocument();
    expect(screen.getByText(/in chrome first/i)).toBeInTheDocument();
    // Chrome shares storage with the app it installs, so there is no warning about separate data.
    expect(screen.queryByText(/keeps its own data/i)).not.toBeInTheDocument();
  });
});
