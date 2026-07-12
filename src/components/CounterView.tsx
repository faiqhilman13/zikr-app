import { Clock3, Pause, Play, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { dayKey, getToday, selectedCount, selectedPreset, totalToday } from '../domain/state';
import type { ZikrState } from '../domain/types';

export function CounterView({ state, onIncrement, onUndo, onSelect, onToggleTimer, onTimerRollover }: {
  state: ZikrState; onIncrement: () => void; onUndo: () => void; onSelect: (id: string) => void; onToggleTimer: () => void; onTimerRollover: () => void;
}) {
  const { t } = useTranslation();
  const [now, setNow] = useState(() => Date.now());
  const [announce, setAnnounce] = useState('');
  const preset = selectedPreset(state);
  const count = selectedCount(state);
  const hasTarget = preset.target > 0;
  const target = Math.max(1, preset.target);
  const ratio = hasTarget ? Math.min(1, count / target) : 0;
  const today = getToday(state);
  const storedSeconds = today.timedSeconds[preset.id] ?? 0;
  const liveSeconds = state.activeTimer?.presetId === preset.id ? Math.max(0, Math.floor((now - state.activeTimer.startedAt) / 1000)) : 0;
  const seconds = storedSeconds + liveSeconds;

  const rollover = useRef(onTimerRollover);
  useEffect(() => { rollover.current = onTimerRollover; }, [onTimerRollover]);
  useEffect(() => {
    if (!state.activeTimer) return;
    const startedDay = dayKey(new Date(state.activeTimer.startedAt));
    const timer = window.setInterval(() => {
      setNow(Date.now());
      // A live session crossing midnight: bank yesterday's portion and restart the
      // timer for today, so the practice continues instead of silently stopping.
      if (dayKey() !== startedDay) rollover.current();
    }, 1000);
    return () => window.clearInterval(timer);
  }, [state.activeTimer]);

  const timeLabel = useMemo(() => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`, [seconds]);
  const countLabel = hasTarget ? t('countOf', { count, target }) : String(count);
  const handleTap = () => {
    onIncrement();
    setAnnounce(`${preset.title}: ${hasTarget ? t('countOf', { count: count + 1, target }) : count + 1}`);
    if (state.settings.haptics && 'vibrate' in navigator) navigator.vibrate(8);
  };

  return <div className="view counter-view">
    <section className="daily-summary" aria-labelledby="daily-title">
      <div><p className="eyebrow" id="daily-title">{t('today')}</p><strong>{totalToday(state)}</strong><span>{t('repetitions')}</span></div>
      <div className="streak-whisper">
        {hasTarget
          ? <><span>{count >= target ? t('complete') : `${Math.max(0, target - count)} ${t('remaining')}`}</span><div className="fine-progress"><i style={{ width: `${ratio * 100}%` }} /></div></>
          : <span>{t('noTarget')}</span>}
      </div>
    </section>

    <section className="count-stage">
      <button className="count-orb" onClick={handleTap} aria-label={`${t('tap')}: ${preset.title}. ${countLabel}`} style={{ '--progress': `${ratio * 360}deg` } as React.CSSProperties}>
        <span className="orb-inner"><span className="arabic" lang="ar" dir="rtl">{preset.arabic}</span><span>{preset.transliteration}</span><strong>{count}</strong><small>{t('tap')}</small></span>
      </button>
      <div className="counter-tools">
        <button className="quiet-button" disabled={count === 0} onClick={onUndo}><RotateCcw />{t('undo')}</button>
        <button className={`quiet-button ${state.activeTimer ? 'active' : ''}`} onClick={onToggleTimer}>{state.activeTimer ? <Pause /> : <Play />}{state.activeTimer ? t('pauseTimer') : t('startTimer')}</button>
      </div>
      <div className="timer-readout" aria-live="off"><Clock3 /> <span>{timeLabel}</span><small>{t('timerNote')}</small></div>
    </section>

    <section className="switcher" aria-labelledby="switch-title"><div className="section-heading"><p className="eyebrow" id="switch-title">{t('switchDhikr')}</p></div><div className="preset-scroll">
      {state.presets.map((item) => <button className={item.id === preset.id ? 'selected' : ''} key={item.id} onClick={() => onSelect(item.id)} aria-pressed={item.id === preset.id}><span lang="ar" dir="rtl">{item.arabic}</span><b>{item.title}</b><small>{item.target > 0 ? `${getToday(state).counts[item.id] ?? 0} / ${item.target}` : getToday(state).counts[item.id] ?? 0}</small></button>)}
    </div></section>
    <p className="sr-only" aria-live="polite">{announce}</p>
  </div>;
}
