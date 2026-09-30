import { BookOpen } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getToday, totalTarget, totalToday } from '../../../domain/state';
import type { ZikrState } from '../../../domain/types';
import { useNow } from '../../../hooks/useNow';
import { formatDays } from '../../streak/format';
import { GardenJournal } from './GardenJournal';
import { completedDays, nextUnlock, todayStage, UNLOCKS, type UnlockId } from './growth';
import { LivingGarden } from './LivingGarden';

const SEEN_KEY = 'zikr-garden-seen';

/** Days of the garden last seen on this device, so what arrived since can be shown arriving. */
function readSeen(): number | null {
  try {
    const value = Number(localStorage.getItem(SEEN_KEY));
    return localStorage.getItem(SEEN_KEY) === null || !Number.isFinite(value) ? null : value;
  } catch { return null; }
}

function useReducedMotion(setting: boolean) {
  const [system, setSystem] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!media) return;
    const update = () => setSystem(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return setting || system;
}

export function LivingGardenCard({ state }: { state: ZikrState }) {
  const { t, i18n } = useTranslation();
  const now = useNow(60_000);
  const reduced = useReducedMotion(state.settings.reducedMotion);
  const [journal, setJournal] = useState(false);
  const target = Math.max(1, totalTarget(state));
  const intended = state.presets.reduce((sum, preset) => sum + Math.min(preset.target, getToday(state).counts[preset.id] ?? 0), 0);
  const ratio = Math.min(1, intended / target);
  const days = completedDays(state.logs);
  const stage = todayStage(ratio);
  const next = nextUnlock(days);

  // Completing the intention while the garden is on screen brings the birds in.
  const [startRatio] = useState(ratio);
  const celebrate = startRatio < 1 && ratio >= 1;

  // What arrived since this device last saw the garden. The first visit ever has nothing
  // new to show: everything simply is.
  const [seen] = useState(readSeen);
  const since = seen ?? days;
  const fresh: UnlockId[] = UNLOCKS.filter((unlock) => unlock.day > since && unlock.day <= days).map((unlock) => unlock.id);
  const freshFlower = days > since;
  useEffect(() => {
    const timer = window.setTimeout(() => { try { localStorage.setItem(SEEN_KEY, String(days)); } catch { /* A convenience only. */ } }, 2500);
    return () => window.clearTimeout(timer);
  }, [days]);
  const newest = fresh.at(-1);

  const summary = t('intentionSummary', { percent: Math.round(ratio * 100), count: totalToday(state).toLocaleString(i18n.language), target: target.toLocaleString(i18n.language) });
  const label = t('gardenLivingAria', { stage: t(`gardenToday${stage}`), summary, tended: t('gardenTended', { days: formatDays(days, i18n.language) }) });

  return <section className="living-garden-card" aria-labelledby="garden-title">
    <div className="lg-stage">
      <LivingGarden ratio={ratio} days={days} now={new Date(now)} celebrate={celebrate} motion={!reduced} fresh={fresh} freshFlower={freshFlower} label={label} />
      {newest && <p className="lg-new-pill" role="status">{t('gardenNew', { item: t(`gardenUnlock_${newest}`) })}</p>}
    </div>
    <div className="lg-info">
      <div><p className="eyebrow">{t('garden')}</p><h2 id="garden-title">{t(`gardenToday${stage}`)}</h2></div>
      <button type="button" className="quiet-button lg-journal-button" onClick={() => setJournal(true)}><BookOpen aria-hidden="true" />{t('gardenJournal')}</button>
    </div>
    <div className="fine-progress"><i style={{ '--fill': ratio } as React.CSSProperties} /></div>
    <p className="lg-meta"><span>{summary}</span><span>{next
      ? t('gardenNext', { item: t(`gardenUnlock_${next.id}`), when: t('gardenInDays', { days: formatDays(next.day - days, i18n.language) }) })
      : t('gardenAllGrown')}</span></p>
    <p className="garden-note">{t('gardenBody')}</p>
    {journal && <GardenJournal days={days} onClose={() => setJournal(false)} />}
  </section>;
}
