import { CalendarDays, Flame, Leaf } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { calculateStreak, dayKey, totalForLog, totalTarget, totalToday } from '../domain/state';
import type { ZikrState } from '../domain/types';

const HISTORY_PAGE = 14;

export function ProgressView({ state }: { state: ZikrState }) {
  const { t, i18n } = useTranslation();
  const [visibleDays, setVisibleDays] = useState(HISTORY_PAGE);
  const streak = calculateStreak(state);
  const allTime = state.logs.reduce((sum, log) => sum + totalForLog(log), 0);
  const target = Math.max(1, totalTarget(state));
  const ratio = Math.min(1, totalToday(state) / target);
  const last7 = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(); date.setDate(date.getDate() - (6 - offset));
    const key = dayKey(date); const log = state.logs.find((item) => item.date === key);
    return { key, date, total: log ? totalForLog(log) : 0 };
  });
  const stage = ratio >= 1 ? 4 : ratio >= .75 ? 3 : ratio >= .4 ? 2 : ratio > 0 ? 1 : 0;

  return <div className="view progress-view">
    <header className="view-title"><p className="eyebrow">{t('progress')}</p><h1>{t('progressTitle')}</h1><p>{t('progressBody')}</p></header>
    <section className="metric-grid" aria-label={t('progressSummary')}>
      <article><Flame /><span>{t('streak')}</span><strong>{streak.current}</strong><small>{t('daysUnit')}</small></article>
      <article><CalendarDays /><span>{t('longest')}</span><strong>{streak.longest}</strong><small>{t('daysUnit')}</small></article>
      <article><Leaf /><span>{t('total')}</span><strong>{allTime.toLocaleString(i18n.language)}</strong><small>{t('repetitions')}</small></article>
    </section>
    <section className="chart-card" aria-labelledby="week-chart-title"><div className="section-heading"><div><p className="eyebrow">{t('lastSeven')}</p><h2 id="week-chart-title">{t('rhythmTitle')}</h2><p className="chart-note">{t('chartNote', { target: target.toLocaleString(i18n.language) })}</p></div><span>{t('weekTotal', { total: last7.reduce((sum, item) => sum + item.total, 0) })}</span></div>
      <div className="bar-chart">{last7.map((item) => { const percent = Math.min(100, item.total / target * 100); return <div className="bar-column" key={item.key}><span className="bar-value">{item.total}</span><div className="bar-track" role="meter" aria-label={t('barAria', { total: item.total, target })} aria-valuemin={0} aria-valuemax={target} aria-valuenow={Math.min(item.total, target)}><i className={item.total >= target ? 'goal-met' : ''} style={{ height: `${percent}%` }} /></div><small>{new Intl.DateTimeFormat(i18n.language, { weekday: 'narrow' }).format(item.date)}</small></div>; })}</div>
    </section>
    <section className="garden-card" aria-labelledby="garden-title"><div className={`garden-visual stage-${stage}`}><GardenPlant stage={stage} label={t('gardenAria', { stage: stage + 1 })} /></div><div><p className="eyebrow">{t('garden')}</p><h2 id="garden-title">{t(`gardenStage${stage}`)}</h2><p>{t('gardenBody')}</p><div className="fine-progress"><i style={{ width: `${ratio * 100}%` }} /></div><small>{t('intentionSummary', { percent: Math.round(ratio * 100), count: totalToday(state).toLocaleString(i18n.language), target: target.toLocaleString(i18n.language) })}</small></div></section>
    <section className="history-list" aria-labelledby="history-title"><div className="section-heading"><h2 id="history-title">{t('historyTitle')}</h2><span>{t('daysStored', { count: state.logs.length })}</span></div>{state.logs.slice(0, visibleDays).map((log) => { const timedMinutes = Math.floor(Object.values(log.timedSeconds).reduce((a, b) => a + b, 0) / 60); return <article key={log.date}><time dateTime={log.date}>{new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${log.date}T12:00:00`))}</time><span>{timedMinutes > 0 ? t('minTimed', { minutes: timedMinutes }) : t('countedPractice')}</span><strong>{totalForLog(log)}</strong></article>; })}
      {state.logs.length > visibleDays && <button className="quiet-button show-more" onClick={() => setVisibleDays((days) => days + 30)}>{t('showMore')}</button>}
    </section>
  </div>;
}

function GardenPlant({ stage, label }: { stage: number; label: string }) {
  return <svg className="garden-plant" viewBox="0 0 180 180" role="img" aria-label={label}>
    <ellipse className="garden-soil" cx="90" cy="151" rx="55" ry="9" />
    {stage === 0 && <><path className="garden-seed" d="M83 143c0-10 14-16 20-7 6 10-7 18-20 7Z" /><path className="garden-spark" d="M91 122v-8m-12 13-6-6m31 6 6-6" /></>}
    {stage >= 1 && <path className="garden-stem" d="M91 147c-1-31 3-55 1-79" />}
    {stage >= 1 && <path className="garden-leaf leaf-left-low" d="M89 127c-21 1-31-12-32-26 18-1 31 8 32 26Z" />}
    {stage >= 2 && <path className="garden-leaf leaf-right-low" d="M93 111c21 0 31-13 32-27-18 0-31 9-32 27Z" />}
    {stage >= 2 && <path className="garden-leaf leaf-left-high" d="M91 93C75 91 67 81 68 69c15 1 24 9 23 24Z" />}
    {stage >= 3 && <path className="garden-leaf leaf-right-high" d="M93 82c15-2 24-12 23-25-14 2-23 10-23 25Z" />}
    {stage === 3 && <path className="garden-bud" d="M92 70c-13-8-12-24 0-33 12 9 13 25 0 33Z" />}
    {stage >= 4 && <g className="garden-flower"><path d="M92 69c-14-8-17-22-8-31 7 2 11 8 12 15 3-8 10-13 18-11 5 12-3 25-22 27Z" /><path d="M91 68c-17 1-28-9-26-21 7-4 15-2 21 4-1-9 4-17 11-20 10 8 8 25-6 37Z" /><circle cx="92" cy="58" r="7" /></g>}
  </svg>;
}
