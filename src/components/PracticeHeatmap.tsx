import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { dayKey, totalForLog, totalTarget } from '../domain/state';
import type { ZikrState } from '../domain/types';

const WEEKS = 16;

interface HeatCell {
  date: string;
  label: string;
  total: number;
  level: number;
  completed: boolean;
  active: boolean;
}

export function PracticeHeatmap({ state, onSelectDay }: { state: ZikrState; onSelectDay: (date: string) => void }) {
  const { t, i18n } = useTranslation();
  const target = Math.max(1, totalTarget(state));

  const { weeks, months, weekdays } = useMemo(() => {
    const logs = new Map(state.logs.map((log) => [log.date, log]));
    const dayFormat = new Intl.DateTimeFormat(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' });
    const monthFormat = new Intl.DateTimeFormat(i18n.language, { month: 'short' });
    const narrowFormat = new Intl.DateTimeFormat(i18n.language, { weekday: 'narrow' });
    // Trailing weeks ending today: column c, row r is (WEEKS-1-c)*7 + (6-r) days ago,
    // so every row shares a weekday without depending on a locale week-start rule.
    const cellDate = (week: number, row: number) => {
      const date = new Date();
      date.setDate(date.getDate() - ((WEEKS - 1 - week) * 7 + (6 - row)));
      return date;
    };
    const weeks = Array.from({ length: WEEKS }, (_, week) => Array.from({ length: 7 }, (_, row): HeatCell => {
      const date = cellDate(week, row);
      const key = dayKey(date);
      const log = logs.get(key);
      const total = log ? totalForLog(log) : 0;
      const timed = log ? Object.values(log.timedSeconds).reduce((sum, value) => sum + value, 0) : 0;
      const ratio = total / target;
      const level = ratio >= 1 ? 4 : ratio >= .75 ? 3 : ratio >= .4 ? 2 : total > 0 || timed > 0 ? 1 : 0;
      return { date: key, label: dayFormat.format(date), total, level, completed: log?.completed === true, active: total > 0 || timed > 0 };
    }));
    const months = weeks.map((_, week) => {
      const label = monthFormat.format(cellDate(week, 0));
      return week > 0 && label === monthFormat.format(cellDate(week - 1, 0)) ? '' : label;
    });
    const weekdays = Array.from({ length: 7 }, (_, row) => row % 2 === 1 ? narrowFormat.format(cellDate(WEEKS - 1, row)) : '');
    return { weeks, months, weekdays };
  }, [state.logs, target, i18n.language]);

  return <section className="chart-card heatmap-card" aria-labelledby="heatmap-title">
    <div className="section-heading"><div><p className="eyebrow">{t('heatmapEyebrow')}</p><h2 id="heatmap-title">{t('heatmapTitle')}</h2><p className="chart-note">{t('heatmapNote')}</p></div></div>
    <div className="heatmap-wrap" role="group" aria-label={t('heatmapAria', { weeks: WEEKS })}>
      <div className="heatmap-months" aria-hidden="true">{months.map((label, index) => <span key={index}>{label}</span>)}</div>
      <div className="heatmap-weekdays" aria-hidden="true">{weekdays.map((label, index) => <span key={index}>{label}</span>)}</div>
      <div className="heatmap-grid">
        {weeks.map((week, index) => <div className="heatmap-week" key={index}>
          {week.map((cell) => cell.active
            ? <button key={cell.date} type="button" className={`heat-cell l${cell.level}${cell.completed ? ' done' : ''}`} title={`${cell.label} · ${cell.total}`} aria-label={`${cell.label} · ${cell.total} ${t('repetitions')}`} onClick={() => onSelectDay(cell.date)} />
            : <span key={cell.date} className={`heat-cell l${cell.level}`} aria-hidden="true" />)}
        </div>)}
      </div>
    </div>
    <div className="heatmap-legend">
      <span>{t('less')}</span>
      {[0, 1, 2, 3, 4].map((level) => <i key={level} className={`heat-cell l${level}`} aria-hidden="true" />)}
      <span>{t('more')}</span>
      <span className="legend-done"><i className="heat-cell l4 done" aria-hidden="true" />{t('completedLegend')}</span>
    </div>
  </section>;
}
