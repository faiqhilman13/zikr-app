import { Flame, Hourglass } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ZikrState } from '../../domain/types';
import { formatDays, formatTimeLeft } from './format';
import { useStreak } from './useStreak';

/** The streak in the header, on every tab: lit once today is done, and counting down
 * the hours once the day is nearly over and the streak depends on it. */
export function StreakChip({ state, onOpen }: { state: ZikrState; onOpen: () => void }) {
  const { t, i18n } = useTranslation();
  const { streak, status, msLeft, tracked } = useStreak(state);
  if (!tracked) return null;
  const language = i18n.language;
  const statusText = status === 'done' ? t('streakStatusDone')
    : status === 'at-risk' ? t('streakStatusAtRisk', { time: formatTimeLeft(msLeft, language) })
      : status === 'pending' ? t('streakStatusPending') : t('streakStatusNone');
  return <button type="button" className={`streak-chip ${status}`} onClick={onOpen} aria-haspopup="dialog"
    aria-label={t('streakChipLabel', { days: formatDays(streak.current, language), status: statusText })}>
    <Flame aria-hidden="true" />
    <span className="streak-chip-count" aria-hidden="true">{streak.current.toLocaleString(language)}</span>
    {status === 'at-risk' && <span className="streak-chip-time" aria-hidden="true"><Hourglass />{formatTimeLeft(msLeft, language, true)}</span>}
  </button>;
}
