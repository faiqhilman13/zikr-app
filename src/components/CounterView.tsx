import { ArrowRight, Check, Clock3, Flame, Hourglass, Pause, Play, RotateCcw, Snowflake } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { dayKey, getToday, selectedPreset, totalForLog, uncreditedReps } from '../domain/state';
import type { ZikrState } from '../domain/types';
import { gardenDays, UNLOCKS } from './garden/living/growth';
import { LivingGardenCard, MiniGarden } from './garden/living/LivingGardenCard';
import { formatDays, formatTimeLeft } from './streak/format';
import { resumeGardenSound } from '../services/gardenSound';
import { StreakNotices } from './streak/StreakNotices';
import { useStreak } from './streak/useStreak';

export function CounterView({ state, onIncrement, onUndo, onSelect, onStartTimer, onStopTimer, onTimerRollover, onSaveNote = async () => true }: {
  state: ZikrState; onIncrement: () => void; onUndo: () => void; onSelect: (id: string) => void;
  onStartTimer: () => void; onStopTimer: () => void; onTimerRollover: () => void;
  onSaveNote?: (date: string, note: string) => Promise<boolean>;
}) {
  const { t, i18n } = useTranslation();
  const language = i18n.language;
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
  const { streak, today: todayKey, status, msLeft, tracked } = useStreak(state);
  // The moment today completes with this screen open, the line above the orb that was
  // counting down turns into the streak's celebration, standing in for the note under the
  // orb. Coming back to the tab later shows the quieter note instead. A milestone says the
  // streak was kept, so it takes that line rather than adding one.
  const [wasDone, setWasDone] = useState(streak.todayDone);
  const [celebrating, setCelebrating] = useState(false);
  if (wasDone !== streak.todayDone) {
    setWasDone(streak.todayDone);
    setCelebrating(streak.todayDone);
  }

  // The garden is the one place progress is rewarded: when today's tending brought
  // something new, the celebration names it rather than a streak milestone.
  const tendedDays = gardenDays(state.logs, state.presets).tended;
  const arrival = UNLOCKS.find((unlock) => unlock.day === tendedDays && gardenDays(state.logs.filter((log) => log.date !== todayKey), state.presets).tended < unlock.day)?.id;

  // Each tap sends a spark of light from the orb into the garden beside it.
  const orbWrap = useRef<HTMLDivElement>(null);
  const [sparks, setSparks] = useState<{ id: number; style: React.CSSProperties }[]>([]);
  const sparkId = useRef(0);
  const spark = () => {
    const wrap = orbWrap.current;
    const bubble = wrap?.querySelector('.mini-garden');
    if (!wrap || !bubble || state.settings.reducedMotion) return;
    const from = wrap.getBoundingClientRect();
    const to = bubble.getBoundingClientRect();
    const id = ++sparkId.current;
    const angle = Math.random() * Math.PI * 2;
    const style = {
      '--sx': `${Math.cos(angle) * 40}px`, '--sy': `${Math.sin(angle) * 40}px`,
      '--dx': `${to.left + to.width / 2 - (from.left + from.width / 2)}px`, '--dy': `${to.top + to.height / 2 - (from.top + from.height / 2)}px`
    } as React.CSSProperties;
    setSparks((current) => [...current.slice(-6), { id, style }]);
    window.setTimeout(() => setSparks((current) => current.filter((item) => item.id !== id)), 700);
  };

  const handleTap = () => {
    onIncrement();
    spark();
    resumeGardenSound();
    setAnnounce(`${preset.title}: ${hasTarget ? t('countOf', { count: count + 1, target }) : count + 1}`);
    if (!state.settings.haptics || !('vibrate' in navigator)) return;
    const reachesTarget = hasTarget && count + 1 === target;
    // The last repetition of the whole day gets its own pattern, distinct from finishing one phrase.
    const completesDay = reachesTarget && !streak.todayDone
      && state.presets.every((item) => item.target <= 0 || item.id === preset.id || (counts[item.id] ?? 0) >= item.target);
    navigator.vibrate(completesDay ? [14, 60, 14, 60, 36] : reachesTarget ? [10, 70, 16] : 8);
  };

  return <div className="view counter-view">
    {tracked && <StreakNotices streak={streak} today={todayKey} />}
    <section className="daily-summary" aria-labelledby="daily-title">
      <div><p className="eyebrow" id="daily-title">{t('today')}</p><strong>{totalForLog(today)}</strong><span>{t('repetitions')}</span></div>
      <div className="streak-whisper">
        {hasTarget
          ? <><span>{count >= target ? t('complete') : `${Math.max(0, target - count)} ${t('remaining')}`}</span><div className="fine-progress"><i style={{ '--fill': ratio } as React.CSSProperties} /></div></>
          : <span>{t('noTarget')}</span>}
      </div>
    </section>
    {celebrating
      ? <div className="streak-celebration" role="status">
        <div className="celebration-line">
          <span className="celebration-flame" aria-hidden="true"><Flame /></span>
          <p><strong>{t('streakDay', { count: streak.current.toLocaleString(language) })}</strong>
            {arrival
              ? <span className="celebration-milestone">{t('gardenArrivedToday', { item: t(`gardenUnlock_${arrival}`) })}</span>
              : <span>{t(streak.current === 1 ? 'streakStarted' : 'streakKept')}</span>}</p>
        </div>
        {streak.freezeEarnedToday && <span className="celebration-freeze"><Snowflake aria-hidden="true" />{t('freezeEarned')}</span>}
      </div>
      : tracked && status !== 'done' && <p className={`streak-nudge ${status}`}>
        {status === 'at-risk' ? <Hourglass aria-hidden="true" /> : <Flame aria-hidden="true" />}
        <span>{status === 'at-risk' ? t('streakNudgeAtRisk', { time: formatTimeLeft(msLeft, language), days: formatDays(streak.current, language) })
          : status === 'pending' ? t('streakNudgePending', { days: formatDays(streak.current + 1, language) })
            : t('streakNudgeStart')}</span>
      </p>}

    <section className="count-stage">
      <div className="orb-wrap" ref={orbWrap}>
        <button className={`count-orb${phraseDone ? ' complete' : ''}`} onClick={handleTap} aria-label={`${t('tap')}: ${preset.title}. ${countLabel}`} style={{ '--progress': `${ratio * 360}deg` } as React.CSSProperties}>
          <span className="orb-inner"><span className="arabic" lang="ar" dir="rtl">{preset.arabic}</span><span>{preset.transliteration}</span><strong>{count}</strong><small>{t('tap')}</small></span>
        </button>
        <MiniGarden state={state} />
        <div className="orb-sparks" aria-hidden="true">{sparks.map((item) => <span key={item.id} className="orb-spark" style={item.style} />)}</div>
      </div>
      <div className="counter-tools">
        <button className="quiet-button" disabled={count === 0} onClick={onUndo}><RotateCcw />{t('undo')}</button>
        <button className={`quiet-button ${state.activeTimer ? 'active' : ''}`} onClick={state.activeTimer ? onStopTimer : onStartTimer}>{state.activeTimer ? <Pause /> : <Play />}{state.activeTimer ? t('pauseTimer') : t('startTimer')}</button>
      </div>
      {!celebrating && phraseDone && <div className="completion-note" role="status">
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

    <LivingGardenCard state={state} onSaveNote={onSaveNote} />

    <section className="switcher" aria-labelledby="switch-title"><div className="section-heading"><p className="eyebrow" id="switch-title">{t('switchDhikr')}</p></div><div className="preset-scroll">
      {state.presets.map((item) => <button className={item.id === preset.id ? 'selected' : ''} key={item.id} onClick={() => onSelect(item.id)} aria-pressed={item.id === preset.id}><span lang="ar" dir="rtl">{item.arabic}</span><b>{item.title}</b><small>{item.target > 0 ? `${counts[item.id] ?? 0} / ${item.target}` : counts[item.id] ?? 0}</small></button>)}
    </div></section>
    <p className="sr-only" aria-live="polite">{announce}</p>
  </div>;
}
