import { CalendarDays, ChevronRight, Flame, Leaf, Snowflake } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { dayKey, emptyLog, getToday, totalForLog, totalTarget, totalToday } from '../domain/state';
import { MAX_FREEZES } from '../domain/streak';
import type { ZikrState } from '../domain/types';
import { BreakdownRows, DayDetail } from './DayDetail';
import { GardenScene } from './garden/GardenScene';
import { gardenStage } from './garden/stage';
import { PracticeHeatmap } from './PracticeHeatmap';
import { useStreak } from './streak/useStreak';

const HISTORY_PAGE = 14;

export function ProgressView({ state }: { state: ZikrState }) {
  const { t, i18n } = useTranslation();
  const [visibleDays, setVisibleDays] = useState(HISTORY_PAGE);
  const [detailDate, setDetailDate] = useState<string | null>(null);
  const detailLog = detailDate ? state.logs.find((log) => log.date === detailDate) ?? emptyLog(detailDate) : null;
  // The same reading as the streak chip, so the two agree when the day turns over while open.
  const { streak } = useStreak(state);
  const allTime = state.logs.reduce((sum, log) => sum + totalForLog(log), 0);
  const target = Math.max(1, totalTarget(state));
  const intendedCount = state.presets.reduce((sum, preset) => sum + Math.min(preset.target, getToday(state).counts[preset.id] ?? 0), 0);
  const ratio = intendedCount / target;
  const last7 = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(); date.setDate(date.getDate() - (6 - offset));
    const key = dayKey(date); const log = state.logs.find((item) => item.date === key);
    return { key, date, total: log ? totalForLog(log) : 0 };
  });
  const stage = gardenStage(ratio);

  return <div className="view progress-view">
    <header className="view-title"><p className="eyebrow">{t('progress')}</p><h1>{t('progressTitle')}</h1><p>{t('progressBody')}</p></header>
    <section className="metric-grid" aria-label={t('progressSummary')}>
      <article><Flame /><span>{t('streak')}</span><strong>{streak.current}</strong><small>{t('daysUnit')}</small><small className="metric-freezes"><Snowflake aria-hidden="true" />{`${t('streakFreezes')}: ${t('freezesHeld', { count: streak.freezes, max: MAX_FREEZES })}`}</small></article>
      <article><CalendarDays /><span>{t('longest')}</span><strong>{streak.longest}</strong><small>{t('daysUnit')}</small></article>
      <article><Leaf /><span>{t('total')}</span><strong>{allTime.toLocaleString(i18n.language)}</strong><small>{t('repetitions')}</small></article>
    </section>
    <section className="chart-card" aria-labelledby="week-chart-title"><div className="section-heading"><div><p className="eyebrow">{t('lastSeven')}</p><h2 id="week-chart-title">{t('rhythmTitle')}</h2><p className="chart-note">{t('chartNote', { target: target.toLocaleString(i18n.language) })}</p></div><span>{t('weekTotal', { total: last7.reduce((sum, item) => sum + item.total, 0) })}</span></div>
      <div className="bar-chart">{last7.map((item) => { const percent = Math.min(100, item.total / target * 100); return <div className="bar-column" key={item.key}><span className="bar-value">{item.total}</span><div className="bar-track" role="meter" aria-label={t('barAria', { total: item.total, target })} aria-valuemin={0} aria-valuemax={target} aria-valuenow={Math.min(item.total, target)}><i className={item.total >= target ? 'goal-met' : ''} style={{ '--fill': percent / 100 } as React.CSSProperties} /></div><small>{new Intl.DateTimeFormat(i18n.language, { weekday: 'narrow' }).format(item.date)}</small></div>; })}</div>
    </section>
    <PracticeHeatmap state={state} frozenDays={streak.frozenDays} onSelectDay={setDetailDate} />
    <section className="garden-card" aria-labelledby="garden-title">
      <div className={`garden-visual stage-${stage}`}><GardenScene stage={stage} label={t('gardenAria', { stage: stage + 1 })} /></div>
      <div className="garden-copy"><p className="eyebrow">{t('garden')}</p><h2 id="garden-title">{t(`gardenStage${stage}`)}</h2><p>{t('gardenBody')}</p><div className="fine-progress"><i style={{ '--fill': ratio } as React.CSSProperties} /></div><small>{t('intentionSummary', { percent: Math.round(ratio * 100), count: totalToday(state).toLocaleString(i18n.language), target: target.toLocaleString(i18n.language) })}</small></div>
    </section>
    <section className="breakdown-card" aria-labelledby="breakdown-title"><div className="section-heading"><div><p className="eyebrow">{t('today')}</p><h2 id="breakdown-title">{t('breakdownTitle')}</h2><p className="chart-note">{t('breakdownBody')}</p></div></div>
      <BreakdownRows log={getToday(state)} presets={[...state.presets, ...(state.archivedPresets ?? [])]} showTargets />
    </section>
    <section className="history-list" aria-labelledby="history-title"><div className="section-heading"><h2 id="history-title">{t('historyTitle')}</h2><span>{t('daysStored', { count: state.logs.length })}</span></div>{state.logs.slice(0, visibleDays).map((log) => { const timedMinutes = Math.floor(Object.values(log.timedSeconds).reduce((a, b) => a + b, 0) / 60); return <button type="button" className="history-item" key={log.date} onClick={() => setDetailDate(log.date)}><time dateTime={log.date}>{new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${log.date}T12:00:00`))}</time><span>{timedMinutes > 0 ? t('minTimed', { minutes: timedMinutes }) : t('countedPractice')}</span><strong>{totalForLog(log)}</strong><ChevronRight className="row-chevron" aria-hidden="true" /></button>; })}
      {state.logs.length > visibleDays && <button className="quiet-button show-more" onClick={() => setVisibleDays((days) => days + 30)}>{t('showMore')}</button>}
    </section>
    {detailLog && <DayDetail log={detailLog} presets={[...state.presets, ...(state.archivedPresets ?? [])]} onClose={() => setDetailDate(null)} />}
  </div>;
}
