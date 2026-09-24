import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initialState, withIncrement } from '../../domain/state';
import { addDays, calculateStreak } from '../../domain/streak';
import type { ZikrState } from '../../domain/types';
import { CounterView } from '../CounterView';
import { ProgressView } from '../ProgressView';
import { StreakChip } from './StreakChip';
import { StreakNotices } from './StreakNotices';
import { StreakSheet } from './StreakSheet';

// A Saturday. Morning leaves the day open; evening puts an unfinished streak at risk.
const TODAY = '2026-09-19';
const MORNING = new Date(2026, 8, 19, 9, 0, 0);
const EVENING = new Date(2026, 8, 19, 20, 0, 0);

/** Days before today, oldest first and ending yesterday: x kept, - missed. */
const withHistory = (pattern: string, state: ZikrState = initialState()): ZikrState => ({
  ...state,
  logs: [
    ...[...pattern].map((mark, index) => ({ date: addDays(TODAY, index - pattern.length), counts: {}, timedSeconds: {}, completed: mark === 'x' })),
    ...state.logs
  ]
});

/** Today one repetition short: every phrase at its target but the last tasbih. */
const oneShort = (pattern: string) => {
  const state = initialState();
  const counts = Object.fromEntries(state.presets.map((preset) => [preset.id, preset.id === 'tasbih' ? preset.target - 1 : preset.target]));
  return withHistory(pattern, { ...state, logs: [{ ...state.logs[0], counts }] });
};

const counter = (state: ZikrState) => <CounterView state={state} onIncrement={vi.fn()} onUndo={vi.fn()} onSelect={vi.fn()} onStartTimer={vi.fn()} onStopTimer={vi.fn()} onTimerRollover={vi.fn()} />;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(MORNING);
  localStorage.clear();
});
afterEach(() => vi.useRealTimers());

describe('StreakChip', () => {
  it('stays out of the header while nothing has a daily target to complete', () => {
    const base = initialState();
    const state = { ...base, presets: base.presets.map((preset) => ({ ...preset, target: 0 })) };
    const { container } = render(<StreakChip state={state} onOpen={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('names the run and what today still needs', () => {
    const onOpen = vi.fn();
    render(<StreakChip state={withHistory('xxxxx')} onOpen={onOpen} />);
    fireEvent.click(screen.getByRole('button', { name: 'Streak: 5 days. Today is still open.' }));
    expect(onOpen).toHaveBeenCalledOnce();
  });

  it('counts down the hours once an unfinished streak is at risk', () => {
    vi.setSystemTime(EVENING);
    render(<StreakChip state={withHistory('xxxxx')} onOpen={vi.fn()} />);
    const chip = screen.getByRole('button', { name: 'Streak: 5 days. 4 hr left to keep it.' });
    expect(chip).toHaveClass('at-risk');
    expect(chip).toHaveTextContent('4h');
  });
});

describe('the moment today completes', () => {
  it('turns the line above the orb into the streak, on the tap that completes the day', () => {
    const before = oneShort('xxxx');
    const { rerender } = render(counter(before));
    expect(screen.getByText('Complete today to extend your streak to 5 days')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    rerender(counter(withIncrement(before, 'tasbih', 1)));
    const celebration = screen.getByRole('status');
    expect(celebration).toHaveTextContent('Day 5');
    expect(celebration).toHaveTextContent('Streak kept. See you tomorrow.');
    // Above the orb, where it is on screen while the orb is.
    const orb = screen.getByRole('button', { name: /^Tap to count: Tasbih/ });
    expect(celebration.compareDocumentPosition(orb) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByText('Tasbih complete for today')).not.toBeInTheDocument();
    expect(screen.queryByText(/extend your streak/)).not.toBeInTheDocument();
  });

  it('marks the seventh day as a milestone and hands over a freeze', () => {
    const before = oneShort('xxxxxx');
    const { rerender } = render(counter(before));
    rerender(counter(withIncrement(before, 'tasbih', 1)));
    const celebration = screen.getByRole('status');
    expect(celebration).toHaveTextContent('Milestone: 7 days in a row.');
    expect(celebration).not.toHaveTextContent('Streak kept');
    expect(celebration).toHaveTextContent('You earned a streak freeze.');
  });

  it('keeps the quieter note when the app opens on a day already complete', () => {
    render(counter(withIncrement(oneShort('xxxx'), 'tasbih', 1)));
    expect(screen.getByText('Tasbih complete for today')).toBeInTheDocument();
    expect(screen.queryByText('Day 5')).not.toBeInTheDocument();
  });
});

describe('StreakSheet', () => {
  // Seven days earn a freeze, and yesterday spent it.
  const covered = () => withHistory('xxxxxxx-');

  it('shows the run, the week as the streak saw it, and the freezes held', () => {
    render(<StreakSheet state={covered()} onClose={vi.fn()} />);
    const dialog = screen.getByRole('dialog', { name: '7 day streak' });
    expect(within(dialog).getByText('Today is still open, with 15 hr to go.')).toBeInTheDocument();
    const week = within(dialog).getByRole('list', { name: 'Last seven days' });
    const days = within(week).getAllByRole('listitem');
    expect(days).toHaveLength(7);
    expect(days[5]).toHaveTextContent(/Friday.*: Covered by a freeze/);
    expect(days[6]).toHaveTextContent(/Saturday.*: Still open/);
    expect(within(dialog).getByText('0 of 2 held')).toBeInTheDocument();
    expect(within(dialog).getByText('14 days')).toBeInTheDocument();
  });

  it('warns while the day is at risk, and says when a freeze would cover it', () => {
    vi.setSystemTime(EVENING);
    render(<StreakSheet state={withHistory('xxxxxxx')} onClose={vi.fn()} />);
    expect(screen.getByText('Only 4 hr left today. Complete your intention to keep your streak. If today slips by, a freeze will cover it.')).toBeInTheDocument();
  });

  it('offers reminders only when given a way to set them, and closes on Escape', () => {
    const onClose = vi.fn();
    const onReminders = vi.fn();
    const { rerender } = render(<StreakSheet state={covered()} onClose={onClose} />);
    expect(screen.queryByRole('button', { name: 'Get a daily reminder' })).not.toBeInTheDocument();
    rerender(<StreakSheet state={covered()} onClose={onClose} onReminders={onReminders} />);
    fireEvent.click(screen.getByRole('button', { name: 'Get a daily reminder' }));
    expect(onReminders).toHaveBeenCalledOnce();
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });
});

describe('StreakNotices', () => {
  it('tells of a freeze once, and remembers it was read', () => {
    const streak = calculateStreak(withHistory('xxxxxxx-'), TODAY);
    const { unmount } = render(<StreakNotices streak={streak} today={TODAY} />);
    expect(screen.getByText('A freeze covered Friday, so your streak is safe.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.queryByText(/A freeze covered/)).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('zikr-streak-notices') ?? '[]')).toEqual(['freeze:2026-09-18']);
    unmount();
    render(<StreakNotices streak={streak} today={TODAY} />);
    expect(screen.queryByText(/A freeze covered/)).not.toBeInTheDocument();
  });

  it('owns up to a run that ended while it is still news', () => {
    render(<StreakNotices streak={calculateStreak(withHistory('xxxx--'), TODAY)} today={TODAY} />);
    expect(screen.getByText('Your streak of 4 days ended. Complete today’s intention to start a new one.')).toBeInTheDocument();
  });

  it('says nothing of a short run, or one long past', () => {
    const { container } = render(<>
      <StreakNotices streak={calculateStreak(withHistory('xx--'), TODAY)} today={TODAY} />
      <StreakNotices streak={calculateStreak(withHistory('xxxx--------'), TODAY)} today={TODAY} />
    </>);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('ProgressView', () => {
  it('reports the current streak and the freezes behind it', () => {
    render(<ProgressView state={withHistory('xxxxxxx')} />);
    const metric = screen.getByText('Current streak').closest('article');
    expect(metric).toHaveTextContent('7');
    expect(metric).toHaveTextContent('Streak freezes: 1 of 2 held');
  });
});
