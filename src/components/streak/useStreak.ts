import { useMemo } from 'react';
import { dayKey } from '../../domain/state';
import { calculateStreak, msLeftToday, streakStatus } from '../../domain/streak';
import type { ZikrState } from '../../domain/types';
import { useNow } from '../../hooks/useNow';

/** The streak as of now, re-read on a clock so "at risk" and the time left move on their
 * own while the app sits open, and the day turns over at midnight without a tap. */
export function useStreak(state: ZikrState) {
  const now = useNow(30_000);
  // Its own Date, so nothing the readouts below do with theirs can reach the memo's key.
  const today = dayKey(new Date(now));
  const logs = state.logs;
  const streak = useMemo(() => calculateStreak({ logs }, today), [logs, today]);
  // Streaks need something to complete: with no daily target nothing ever counts.
  const tracked = state.presets.some((preset) => preset.target > 0);
  const clock = new Date(now);
  return { streak, today, status: streakStatus(streak, clock), msLeft: msLeftToday(clock), tracked };
}
