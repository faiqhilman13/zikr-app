import { BookOpen } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { totalToday } from '../../../domain/state';
import type { ZikrState } from '../../../domain/types';
import { formatDays } from '../../streak/format';
import { GardenJournal } from './GardenJournal';
import { nextUnlock, todayStage, UNLOCKS, type UnlockId } from './growth';
import { LivingGarden } from './LivingGarden';
import { GARDEN_ANCHOR, scrollToGarden, useGarden } from './useGarden';

const SEEN_KEY = 'zikr-garden-seen';

/** Tended days last seen on this device, so what arrived since can be shown arriving. */
function readSeen(): number | null {
  try {
    const stored = localStorage.getItem(SEEN_KEY);
    const value = Number(stored);
    return stored === null || !Number.isFinite(value) ? null : value;
  } catch { return null; }
}

/** A small round window onto the olive, beside the counter, so each tap can be seen landing. */
export function MiniGarden({ state }: { state: ZikrState }) {
  const { t } = useTranslation();
  const garden = useGarden(state);
  return <button type="button" className="mini-garden" onClick={() => scrollToGarden(garden.motion)} aria-label={t('gardenSeeGarden')}>
    <LivingGarden mini ratio={garden.ratio} tended={garden.tended} full={garden.full} now={garden.now} celebrate={false} motion={garden.motion} fresh={[]} freshFlower={false} label="" />
  </button>;
}

export function LivingGardenCard({ state }: { state: ZikrState }) {
  const { t, i18n } = useTranslation();
  const { now, motion, target, ratio, tended, full } = useGarden(state);
  const [journal, setJournal] = useState(false);
  const [focus, setFocus] = useState<UnlockId | null>(null);
  const [revealing, setRevealing] = useState(false);
  const stage = todayStage(ratio);
  const next = nextUnlock(tended);
  const card = useRef<HTMLElement>(null);

  // Completing the intention while the garden is on screen brings the birds in.
  const [startRatio] = useState(ratio);
  const celebrate = startRatio < 1 && ratio >= 1;

  // What arrived since this device last saw the garden. The very first visit has nothing
  // new to show: everything simply is.
  const [seen] = useState(readSeen);
  const since = seen ?? tended;
  const fresh: UnlockId[] = UNLOCKS.filter((unlock) => unlock.day > since && unlock.day <= tended).map((unlock) => unlock.id);
  const freshFlower = tended > since;
  const newest = fresh.at(-1);
  useEffect(() => {
    const timer = window.setTimeout(() => { try { localStorage.setItem(SEEN_KEY, String(tended)); } catch { /* A convenience only. */ } }, 2500);
    return () => window.clearTimeout(timer);
  }, [tended]);

  const timers = useRef<number[]>([]);
  const later = (ms: number, run: () => void) => { timers.current.push(window.setTimeout(run, ms)); };
  useEffect(() => () => timers.current.forEach((timer) => window.clearTimeout(timer)), []);

  /** Brings the camera in on one piece of the garden, then back out. */
  const showPiece = (id: UnlockId, delay: number) => {
    later(delay, () => setFocus(id));
    later(delay + 3400, () => setFocus(null));
  };

  // The day's completion reveals the garden: the page glides to it and it rises into view.
  useEffect(() => {
    if (!celebrate) return;
    const lead = window.setTimeout(() => { scrollToGarden(motion); setRevealing(true); }, 450);
    const end = window.setTimeout(() => setRevealing(false), 2600);
    return () => { window.clearTimeout(lead); window.clearTimeout(end); };
  }, [celebrate, motion]);

  // Something new arrived: take a closer look at it.
  useEffect(() => {
    if (!newest || !motion) return;
    const lead = window.setTimeout(() => setFocus(newest), celebrate ? 2200 : 1100);
    const back = window.setTimeout(() => setFocus(null), (celebrate ? 2200 : 1100) + 3400);
    return () => { window.clearTimeout(lead); window.clearTimeout(back); };
  }, [newest, motion, celebrate]);

  const summary = t('intentionSummary', { percent: Math.round(ratio * 100), count: totalToday(state).toLocaleString(i18n.language), target: target.toLocaleString(i18n.language) });
  const label = t('gardenLivingAria', { stage: t(`gardenToday${stage}`), summary, tended: t('gardenTended', { days: formatDays(tended, i18n.language) }) });

  return <section ref={card} id={GARDEN_ANCHOR} className={`living-garden-card${revealing ? ' lg-reveal' : ''}`} aria-labelledby="garden-title">
    <div className="lg-stage">
      <LivingGarden ratio={ratio} tended={tended} full={full} now={now} celebrate={celebrate} motion={motion} fresh={fresh} freshFlower={freshFlower} focus={focus} label={label} />
      {newest && <p className="lg-new-pill" role="status">{t('gardenNew', { item: t(`gardenUnlock_${newest}`) })}</p>}
    </div>
    <div className="lg-info">
      <div><p className="eyebrow">{t('garden')}</p><h2 id="garden-title">{t(`gardenToday${stage}`)}</h2></div>
      <button type="button" className="quiet-button lg-journal-button" onClick={() => setJournal(true)}><BookOpen aria-hidden="true" />{t('gardenJournal')}</button>
    </div>
    <div className="fine-progress"><i style={{ '--fill': ratio } as React.CSSProperties} /></div>
    <p className="lg-meta"><span>{summary}</span><span>{next
      ? t('gardenNext', { item: t(`gardenUnlock_${next.id}`), when: t('gardenInDays', { days: formatDays(next.day - tended, i18n.language) }) })
      : t('gardenAllGrown')}</span></p>
    <p className="garden-note">{t('gardenBody')}</p>
    {journal && <GardenJournal tended={tended} full={full} onClose={() => setJournal(false)} onSelect={(id) => {
      setJournal(false);
      later(50, () => card.current?.scrollIntoView({ behavior: motion ? 'smooth' : 'auto', block: 'center' }));
      showPiece(id, 500);
    }} />}
  </section>;
}
