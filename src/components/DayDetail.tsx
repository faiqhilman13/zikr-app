import { Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { dayKey, totalForLog } from '../domain/state';
import type { DailyLog, DhikrPreset } from '../domain/types';

/**
 * Per-phrase rows for one day. Targets are only rendered when asked (today):
 * past targets are not stored, so history shows plain counts rather than
 * measuring old days against today's intention.
 */
export function BreakdownRows({ log, presets, showTargets = false }: { log: DailyLog; presets: DhikrPreset[]; showTargets?: boolean }) {
  const { t, i18n } = useTranslation();
  const rows = presets
    .map((preset) => ({ preset, count: log.counts[preset.id] ?? 0, minutes: Math.floor((log.timedSeconds[preset.id] ?? 0) / 60) }))
    .filter(({ preset, count, minutes }) => count > 0 || minutes > 0 || (showTargets && preset.target > 0));
  if (rows.length === 0) return <p className="quiet-day">{t('quietDay')}</p>;

  return <ul className="phrase-rows">
    {rows.map(({ preset, count, minutes }) => {
      const hasTarget = showTargets && preset.target > 0;
      const ratio = hasTarget ? Math.min(1, count / preset.target) : 0;
      return <li key={preset.id}>
        <span className="phrase-arabic" lang="ar" dir="rtl">{preset.arabic}</span>
        <div className="phrase-info">
          <b>{preset.title}</b>
          {minutes > 0 && <small>{t('minTimed', { minutes })}</small>}
          {hasTarget && <div className="fine-progress"><i style={{ width: `${ratio * 100}%` }} /></div>}
        </div>
        <span className="phrase-count"><strong>{count.toLocaleString(i18n.language)}</strong>{hasTarget && <small>/ {preset.target.toLocaleString(i18n.language)}</small>}</span>
      </li>;
    })}
  </ul>;
}

export function DayDetail({ log, presets, onClose }: { log: DailyLog; presets: DhikrPreset[]; onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const trapRef = useFocusTrap<HTMLElement>(onClose);
  const isToday = log.date === dayKey();
  const date = new Date(`${log.date}T12:00:00`);
  const minutes = Math.floor(Object.values(log.timedSeconds).reduce((sum, value) => sum + value, 0) / 60);

  return <div className="modal-backdrop">
    <button className="backdrop-dismiss" aria-label={t('done')} onClick={onClose} />
    <section className="modal day-detail" role="dialog" aria-modal="true" aria-labelledby="day-detail-title" ref={trapRef}>
      <button className="icon-button modal-close" aria-label={t('done')} onClick={onClose}><X /></button>
      <p className="eyebrow">{isToday ? t('today') : new Intl.DateTimeFormat(i18n.language, { weekday: 'long' }).format(date)}</p>
      <h2 id="day-detail-title">{new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' }).format(date)}</h2>
      <div className="day-totals">
        <div><strong>{totalForLog(log).toLocaleString(i18n.language)}</strong><span>{t('repetitions')}</span></div>
        {minutes > 0 && <div><strong>{minutes.toLocaleString(i18n.language)}</strong><span>{t('minutes')}</span></div>}
        {log.completed && <span className="done-badge"><Check aria-hidden="true" />{t('complete')}</span>}
      </div>
      <BreakdownRows log={log} presets={presets} showTargets={isToday} />
    </section>
  </div>;
}
