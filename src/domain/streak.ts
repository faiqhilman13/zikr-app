import { dayKey } from './state';
import type { DailyLog } from './types';

/** A freeze is earned for every seven days kept in a row, and at most two are held. */
export const FREEZE_EVERY = 7;
export const MAX_FREEZES = 2;
/** An unfinished day counts as at risk once this little of it is left. */
export const AT_RISK_HOURS = 6;
const MILESTONES = [3, 7, 14, 30, 50, 100, 200, 365, 500, 1000];

export interface StreakSummary {
  /** Completed days in the unbroken run. Frozen days hold the run together without adding to it. */
  current: number;
  longest: number;
  /** Freezes held now. Each one covers a single missed day, spent automatically. */
  freezes: number;
  /** Every day a freeze covered, oldest first. */
  frozenDays: string[];
  /** Days a freeze covered since the last completed day, when the run survived them. */
  recentlyFrozen: string[];
  todayDone: boolean;
  /** Completing today brought the run to a multiple of seven and a freeze with it. */
  freezeEarnedToday: boolean;
  /** The last run that ended, and the first day nothing covered. */
  lost: { length: number; date: string } | null;
}

const noon = (key: string) => new Date(`${key}T12:00:00`);
export const addDays = (key: string, days: number) => {
  const date = noon(key);
  date.setDate(date.getDate() + days);
  return dayKey(date);
};
const daysBetween = (from: string, to: string) => Math.round((noon(to).getTime() - noon(from).getTime()) / 86_400_000);

/** Replays the whole history, so freezes need no stored state and a restored backup
 * or a second device arrives at the same streak. Today only counts once it is done:
 * an unfinished today is still open, never a missed day. */
export function calculateStreak({ logs }: { logs: DailyLog[] }, today = dayKey()): StreakSummary {
  const done = [...new Set(logs.filter((log) => log.completed && log.date <= today).map((log) => log.date))].sort();
  const summary: StreakSummary = {
    current: 0, longest: 0, freezes: 0, frozenDays: [], recentlyFrozen: [],
    todayDone: done[done.length - 1] === today, freezeEarnedToday: false, lost: null
  };
  const bridge = (after: string, before: string) => {
    summary.recentlyFrozen = [];
    const missed = daysBetween(after, before) - 1;
    if (missed <= 0 || summary.current === 0) return;
    const covered = Math.min(missed, summary.freezes);
    const frozen = Array.from({ length: covered }, (_, index) => addDays(after, index + 1));
    summary.frozenDays.push(...frozen);
    summary.freezes -= covered;
    if (missed > covered) {
      summary.lost = { length: summary.current, date: addDays(after, covered + 1) };
      summary.current = 0;
    } else summary.recentlyFrozen = frozen;
  };
  const keep = () => {
    summary.current += 1;
    summary.longest = Math.max(summary.longest, summary.current);
    const earned = summary.current % FREEZE_EVERY === 0 && summary.freezes < MAX_FREEZES;
    if (earned) summary.freezes += 1;
    return earned;
  };
  let previous: string | null = null;
  for (const day of done) {
    if (day === today) break;
    if (previous) bridge(previous, day);
    keep();
    previous = day;
  }
  if (previous) bridge(previous, today);
  if (summary.todayDone) summary.freezeEarnedToday = keep();
  return summary;
}

export type StreakStatus = 'done' | 'pending' | 'at-risk' | 'none';

/** Milliseconds until local midnight, when an unfinished day stops being open. */
export const msLeftToday = (now = new Date()) =>
  new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();

export const streakStatus = (streak: StreakSummary, now = new Date()): StreakStatus =>
  streak.todayDone ? 'done'
    : streak.current === 0 ? 'none'
      : msLeftToday(now) <= AT_RISK_HOURS * 3_600_000 ? 'at-risk' : 'pending';

/** The run that just ended, while it is still news: long enough to have mattered, lost
 * within the last week, and not yet followed by a completed day that starts a new one. */
export const recentLoss = (streak: StreakSummary, today = dayKey()) =>
  streak.current === 0 && streak.lost && streak.lost.length >= 3 && streak.lost.date >= addDays(today, -7) ? streak.lost : null;

export type DayMark = 'done' | 'frozen' | 'missed' | 'open';

/** The last `count` days ending today, oldest first, as the streak saw them. */
export const recentDays = ({ logs }: { logs: DailyLog[] }, frozenDays: string[], today = dayKey(), count = 7) => {
  const done = new Set(logs.filter((log) => log.completed).map((log) => log.date));
  const frozen = new Set(frozenDays);
  return Array.from({ length: count }, (_, index) => {
    const date = addDays(today, index - count + 1);
    const mark: DayMark = done.has(date) ? 'done' : frozen.has(date) ? 'frozen' : date === today ? 'open' : 'missed';
    return { date, mark };
  });
};

// Past a thousand days every further year is a milestone.
export const isMilestone = (days: number) => MILESTONES.includes(days) || (days > 1000 && days % 365 === 0);
export const nextMilestone = (days: number) => MILESTONES.find((milestone) => milestone > days) ?? (Math.floor(days / 365) + 1) * 365;
export const milestoneProgress = (days: number) => {
  const next = nextMilestone(days);
  const previous = days >= 1000
    ? Math.max(1000, Math.floor(days / 365) * 365)
    : [0, ...MILESTONES].filter((milestone) => milestone <= days).pop() ?? 0;
  return { next, previous, remaining: next - days, ratio: (days - previous) / (next - previous) };
};
