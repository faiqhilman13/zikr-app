import { ArrowRight, Check, Clock3, Pause, Play, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { dayKey, getToday, selectedPreset, totalForLog, uncreditedReps } from '../domain/state';
import type { ZikrState } from '../domain/types';

export function CounterView({ state, onIncrement, onUndo, onSelect, onStartTimer, onStopTimer, onTimerRollover }: {
  state: ZikrState; onIncrement: () => void; onUndo: () => void; onSelect: (id: string) => void;
  onStartTimer: () => void; onStopTimer: () => void; onTimerRollover: () => void;
}) {
  const { t } = useTranslation();
  const [now, setNow] = useState(() => Date.now());
  const [announce, setAnnounce] = useState('');
  const preset = selectedPreset(state);
  const stored = getToday(state);
  const timer = state.activeTimer?.presetId === preset.id ? state.activeTimer : null;
  const counting = Boolean(timer?.secondsPerRep);
  // Repetitions are banked every few seconds, so between credits the screen adds the ones
  // already earned. Every readout here reads the same live figures; the stored counts are
  // still the only thing history and streaks are built from.
  const pendingReps = timer ? uncreditedReps(timer, now) : 0;
  const counts = pendingReps > 0 ? { ...stored.counts, [preset.id]: (stored.counts[preset.id] ?? 0) + pendingReps } : stored.counts;
  const today = { ...stored, counts };
  const count = counts[preset.id] ?? 0;
  const hasTarget = preset.target > 0;
  const target = Math.max(1, preset.target);
  const ratio = hasTarget ? Math.min(1, count / target) : 0;
  const storedSeconds = today.timedSeconds[preset.id] ?? 0;
  const liveSeconds = timer ? Math.max(0, Math.floor((now - timer.startedAt) / 1000)) : 0;
  const seconds = storedSeconds + liveSeconds;

  const rollover = useRef(onTimerRollover);
  useEffect(() => { rollover.current = onTimerRollover; }, [onTimerRollover]);
  useEffect(() => {
    if (!state.activeTimer) return;
    const startedDay = dayKey(new Date(state.activeTimer.startedAt));
    const interval = window.setInterval(() => {
      setNow(Date.now());
      // Refresh at midnight. Suspended sessions are capped at midnight rather
      // than turning an overnight browser tab into hours of practice.
      if (dayKey() !== startedDay) rollover.current();
    }, 1000);
    return () => window.clearInterval(interval);
  }, [state.activeTimer]);

  const timeLabel = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  const countLabel = hasTarget ? t('countOf', { count, target }) : String(count);
  const phraseDone = hasTarget && count >= target;
  // The next phrase still short of its target, walking the preset order from the
  // current one, so finishing tasbih naturally offers tahmid, then takbir, and so on.
  const nextPhrase = (() => {
    if (!phraseDone) return null;
    const index = state.presets.findIndex((item) => item.id === preset.id);
    const ordered = [...state.presets.slice(index + 1), ...state.presets.slice(0, index)];
    return ordered.find((item) => item.target > 0 && (counts[item.id] ?? 0) < item.target) ?? null;
  })();
  const handleTap = () => {
    onIncrement();
    setAnnounce(`${preset.title}: ${hasTarget ? t('countOf', { count: count + 1, target }) : count + 1}`);
    if (state.settings.haptics && 'vibrate' in navigator) navigator.vibrate(hasTarget && count + 1 === target ? [10, 70, 16] : 8);
  };

  return <div className="view counter-view">
    <section className="daily-summary" aria-labelledby="daily-title">
      <div><p className="eyebrow" id="daily-title">{t('today')}</p><strong>{totalForLog(today)}</strong><span>{t('repetitions')}</span></div>
      <div className="streak-whisper">
        {hasTarget
          ? <><span>{count >= target ? t('complete') : `${Math.max(0, target - count)} ${t('remaining')}`}</span><div className="fine-progress"><i style={{ width: `${ratio * 100}%` }} /></div></>
          : <span>{t('noTarget')}</span>}
      </div>
    </section>

    <section className="count-stage">
      <button className={`count-orb${phraseDone ? ' complete' : ''}`} onClick={handleTap} aria-label={`${t('tap')}: ${preset.title}. ${countLabel}`} style={{ '--progress': `${ratio * 360}deg` } as React.CSSProperties}>
        <span className="orb-inner"><span className="arabic" lang="ar" dir="rtl">{preset.arabic}</span><span>{preset.transliteration}</span><strong>{count}</strong><small>{t('tap')}</small></span>
      </button>
      <div className="counter-tools">
        <button className="quiet-button" disabled={count === 0} onClick={onUndo}><RotateCcw />{t('undo')}</button>
        <button className={`quiet-button ${state.activeTimer ? 'active' : ''}`} onClick={state.activeTimer ? onStopTimer : onStartTimer}>{state.activeTimer ? <Pause /> : <Play />}{state.activeTimer ? t('pauseTimer') : t('startTimer')}</button>
      </div>
      {phraseDone && <div className="completion-note" role="status">
        <span className="completion-msg"><Check aria-hidden="true" />{t('phraseComplete', { title: preset.title })}</span>
        {nextPhrase
          ? <button className="quiet-button continue-chip" onClick={() => onSelect(nextPhrase.id)}>{t('continueWith', { title: nextPhrase.title })}<ArrowRight aria-hidden="true" /></button>
          : <span className="all-complete">{t('allComplete')}</span>}
      </div>}
      <div className="timer-readout" aria-live="off">
        <Clock3 /> <span>{timeLabel}</span>
        {counting && <em className="pace-badge">{t('countingAtPace', { pace: timer?.secondsPerRep })}</em>}
        <small>{counting ? t('timerCountNote', { minutes: 60 }) : t('timerNote')}</small>
      </div>
    </section>

    <section className="switcher" aria-labelledby="switch-title"><div className="section-heading"><p className="eyebrow" id="switch-title">{t('switchDhikr')}</p></div><div className="preset-scroll">
      {state.presets.map((item) => <button className={item.id === preset.id ? 'selected' : ''} key={item.id} onClick={() => onSelect(item.id)} aria-pressed={item.id === preset.id}><span lang="ar" dir="rtl">{item.arabic}</span><b>{item.title}</b><small>{item.target > 0 ? `${counts[item.id] ?? 0} / ${item.target}` : counts[item.id] ?? 0}</small></button>)}
    </div></section>
    <p className="sr-only" aria-live="polite">{announce}</p>
  </div>;
}
