import { Bell, Flame, Snowflake, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FREEZE_EVERY, MAX_FREEZES, milestoneProgress, recentDays, recentLoss, type DayMark } from '../../domain/streak';
import type { ZikrState } from '../../domain/types';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { formatDays, formatTimeLeft } from './format';
import { useStreak } from './useStreak';

const markLabel: Record<DayMark, string> = { done: 'dayKept', frozen: 'dayFrozen', missed: 'dayMissed', open: 'dayOpen' };

export function StreakSheet({ state, onClose, onReminders }: { state: ZikrState; onClose: () => void; onReminders?: () => void }) {
  const { t, i18n } = useTranslation();
  const language = i18n.language;
  const trapRef = useFocusTrap<HTMLElement>(onClose);
  const { streak, today, status, msLeft } = useStreak(state);
  const week = recentDays({ logs: state.logs }, streak.frozenDays, today);
  const milestone = milestoneProgress(streak.current);
  const narrow = new Intl.DateTimeFormat(language, { weekday: 'narrow' });
  const full = new Intl.DateTimeFormat(language, { weekday: 'long', day: 'numeric', month: 'long' });
  const time = formatTimeLeft(msLeft, language);
  const lost = recentLoss(streak, today);
  const line = status === 'done' ? t('streakDoneLine')
    : status === 'at-risk' ? t('streakAtRiskLine', { time })
      : status === 'pending' ? t('streakPendingLine', { time })
        : lost ? t('streakLostLine', { days: formatDays(lost.length, language) }) : t('streakNoneLine');
  const covered = (status === 'at-risk' || status === 'pending') && streak.freezes > 0;

  return <div className="modal-backdrop">
    <button className="backdrop-dismiss" aria-label={t('done')} onClick={onClose} />
    <section className={`modal streak-sheet ${status}`} role="dialog" aria-modal="true" aria-labelledby="streak-sheet-title" ref={trapRef}>
      <button className="icon-button modal-close" aria-label={t('done')} onClick={onClose}><X /></button>
      <p className="eyebrow">{t('streakEyebrow')}</p>
      <div className="streak-hero">
        <span className="streak-flame" aria-hidden="true"><Flame /></span>
        <h2 id="streak-sheet-title"><strong>{streak.current.toLocaleString(language)}</strong> <span>{t('streakDaysCaption')}</span></h2>
      </div>
      <p className="streak-line">{line}{covered && ` ${t('streakFreezeWillCover')}`}</p>
      <ol className="streak-week" aria-label={t('lastSeven')}>
        {week.map(({ date, mark }) => {
          const day = new Date(`${date}T12:00:00`);
          return <li key={date} className={mark}>
            <span className="streak-day-mark" aria-hidden="true">{mark === 'done' ? <Flame /> : mark === 'frozen' ? <Snowflake /> : null}</span>
            <span className="streak-day-name" aria-hidden="true">{narrow.format(day)}</span>
            <span className="sr-only">{`${full.format(day)}: ${t(markLabel[mark])}`}</span>
          </li>;
        })}
      </ol>
      <div className="streak-facts">
        <div className="streak-fact freeze-fact">
          <span className="streak-fact-label"><Snowflake aria-hidden="true" />{t('streakFreezes')}</span>
          <strong>{t('freezesHeld', { count: streak.freezes.toLocaleString(language), max: MAX_FREEZES.toLocaleString(language) })}</strong>
          <p>{t('freezeExplain', { every: FREEZE_EVERY.toLocaleString(language), max: MAX_FREEZES.toLocaleString(language) })}</p>
        </div>
        <div className="streak-fact">
          <span className="streak-fact-label">{t('nextMilestone')}</span>
          <strong>{formatDays(milestone.next, language)}</strong>
          <div className="fine-progress"><i style={{ '--fill': milestone.ratio } as React.CSSProperties} /></div>
          <small>{t('milestoneToGo', { days: formatDays(milestone.remaining, language) })}</small>
        </div>
        <div className="streak-fact">
          <span className="streak-fact-label">{t('longest')}</span>
          <strong>{formatDays(streak.longest, language)}</strong>
        </div>
      </div>
      {onReminders && <button className="button secondary full" onClick={onReminders}><Bell />{t('streakRemindCta')}</button>}
    </section>
  </div>;
}
