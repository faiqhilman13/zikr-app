import { BookOpen, Share2, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { dayKey, totalForLog, totalToday } from '../../../domain/state';
import type { ZikrState } from '../../../domain/types';
import { formatDays } from '../../streak/format';
import { gardenSoundPlaying, onGardenSound, setGardenSound } from '../../../services/gardenSound';
import { FlowerMemory } from './FlowerMemory';
import { GardenJournal } from './GardenJournal';
import { gardenCard, shareFile } from './shareGarden';
import { daysAway, flowerCount, nextUnlock, ORCHARD, orchardOf, tendedDates, todayStage, UNLOCKS, type OrchardId, type UnlockId } from './growth';
import { LivingGarden } from './LivingGarden';
import { GARDEN_ANCHOR, scrollToGarden, useGarden } from './useGarden';

const SEEN_KEY = 'zikr-garden-seen';
const ORCHARD_SEEN_KEY = 'zikr-garden-seen-orchard';
const RAIN_KEY = 'zikr-garden-rain';
/** A return after this many days brings rain. */
const RAIN_AFTER_DAYS = 3;

const readJSON = <T,>(key: string, fallback: T): T => {
  try { const value = localStorage.getItem(key); return value === null ? fallback : JSON.parse(value) as T; } catch { return fallback; }
};
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* A convenience only. */ } };

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

export function LivingGardenCard({ state, onSaveNote }: { state: ZikrState; onSaveNote: (date: string, note: string) => Promise<boolean> }) {
  const { t, i18n } = useTranslation();
  const { now, motion, target, ratio, tended, full } = useGarden(state);
  const [journal, setJournal] = useState(false);
  const [focus, setFocus] = useState<UnlockId | null>(null);
  const [revealing, setRevealing] = useState(false);
  const stage = todayStage(ratio);
  const next = nextUnlock(tended);
  const card = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const today = dayKey();
  const [memory, setMemory] = useState<string | null>(null);
  const [sound, setSound] = useState(gardenSoundPlaying);
  useEffect(() => onGardenSound(setSound), []);
  const [toast, setToast] = useState('');

  // The orchard beyond the wall, and which kinds gained a tree since it was last seen.
  const orchard = orchardOf(state.logs);
  const [seenOrchard] = useState(() => readJSON<Partial<Record<OrchardId, number>>>(ORCHARD_SEEN_KEY, Object.fromEntries(ORCHARD.map(({ id }) => [id, orchard[id].plants]))));
  const freshOrchard = ORCHARD.filter(({ id }) => orchard[id].plants > (seenOrchard[id] ?? 0)).map(({ id }) => id);
  const plants = Object.fromEntries(ORCHARD.map(({ id }) => [id, orchard[id].plants]));
  const plantKey = JSON.stringify(plants);
  useEffect(() => {
    const timer = window.setTimeout(() => write(ORCHARD_SEEN_KEY, plantKey), 2500);
    return () => window.clearTimeout(timer);
  }, [plantKey]);

  // Coming back after some days away brings a soft rain, once, and a welcome.
  const [rain] = useState(() => {
    const away = daysAway(state.logs, state.presets, today);
    return away !== null && away >= RAIN_AFTER_DAYS && readJSON<string>(RAIN_KEY, '') !== today;
  });
  useEffect(() => { if (rain) write(RAIN_KEY, JSON.stringify(today)); }, [rain, today]);

  // The very first repetition ever plants the first seed.
  const [neverCounted] = useState(() => state.logs.every((log) => totalForLog(log) === 0));
  const firstSeed = neverCounted && ratio > 0;

  // Flowers are planted in the order their days were tended; the latest beds hold the latest days.
  const dates = tendedDates(state.logs, state.presets);
  const planted = flowerCount(tended);
  const dateOfFlower = (rank: number) => dates[dates.length - planted + rank];
  const memoryLog = memory ? state.logs.find((log) => log.date === memory) : undefined;

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
  const share = async () => {
    const svg = stageRef.current?.querySelector('svg');
    if (!svg) return;
    try {
      const file = await gardenCard(svg, {
        eyebrow: t('shareEyebrow'), title: t('gardenTended', { days: formatDays(tended, i18n.language) }), stage: t(`gardenToday${stage}`),
        arabic: 'وَأَنَّ غِرَاسَهَا: سُبْحَانَ اللَّهِ، وَالْحَمْدُ لِلَّهِ، وَلَا إِلَهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ',
        quote: t('shareQuote'), source: t('hadithIbrahimSource'), site: 'myzikr.netlify.app'
      });
      const result = await shareFile(file);
      if (result === 'saved') { setToast(t('shareSaved')); later(3500, () => setToast('')); }
    } catch {
      setToast(t('shareFailed')); later(3500, () => setToast(''));
    }
  };

  const pill = toast || (rain ? t('gardenWelcomeBack') : firstSeed ? t('gardenFirstSeed') : newest ? t('gardenNew', { item: t(`gardenUnlock_${newest}`) })
    : freshOrchard.length ? t('orchardNew', { item: t(`orchard_${freshOrchard[freshOrchard.length - 1]}`) }) : '');

  const label = t('gardenLivingAria', { stage: t(`gardenToday${stage}`), summary, tended: t('gardenTended', { days: formatDays(tended, i18n.language) }) });

  return <section ref={card} id={GARDEN_ANCHOR} className={`living-garden-card${revealing ? ' lg-reveal' : ''}`} aria-labelledby="garden-title">
    <div className="lg-stage" ref={stageRef}>
      <LivingGarden ratio={ratio} tended={tended} full={full} now={now} celebrate={celebrate} motion={motion} fresh={fresh} freshFlower={freshFlower} focus={focus} label={label}
        orchard={plants} freshOrchard={freshOrchard} rain={rain} onFlower={(rank) => { const date = dateOfFlower(rank); if (date) setMemory(date); }} />
      {pill && <p key={pill} className="lg-new-pill" role="status">{pill}</p>}
    </div>
    <div className="lg-info">
      <div><p className="eyebrow">{t('garden')}</p><h2 id="garden-title">{t(`gardenToday${stage}`)}</h2></div>
      <div className="lg-actions">
        <button type="button" className={`quiet-button lg-icon-button${sound ? ' on' : ''}`} aria-pressed={sound} aria-label={t('gardenSounds')} title={t('gardenSounds')} onClick={() => setGardenSound(!sound)}>{sound ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}</button>
        <button type="button" className="quiet-button lg-icon-button" aria-label={t('shareGarden')} title={t('shareGarden')} onClick={() => void share()}><Share2 aria-hidden="true" /></button>
        <button type="button" className="quiet-button lg-journal-button" onClick={() => setJournal(true)}><BookOpen aria-hidden="true" />{t('gardenJournal')}</button>
      </div>
    </div>
    <div className="fine-progress"><i style={{ '--fill': ratio } as React.CSSProperties} /></div>
    <p className="lg-meta"><span>{summary}</span><span>{next
      ? t('gardenNext', { item: t(`gardenUnlock_${next.id}`), when: t('gardenInDays', { days: formatDays(next.day - tended, i18n.language) }) })
      : t('gardenAllGrown')}</span></p>
    <p className="garden-note">{t('gardenBody')}</p>
    {memoryLog && <FlowerMemory log={memoryLog} presets={[...state.presets, ...(state.archivedPresets ?? [])]} onSave={(note) => onSaveNote(memoryLog.date, note)} onClose={() => setMemory(null)} />}
    {journal && <GardenJournal tended={tended} full={full} orchard={orchard} presets={state.presets} recent={[...dates].reverse().slice(0, 7)}
      onFlower={(date) => { setJournal(false); setMemory(date); }} onClose={() => setJournal(false)} onSelect={(id) => {
      setJournal(false);
      later(50, () => card.current?.scrollIntoView({ behavior: motion ? 'smooth' : 'auto', block: 'center' }));
      showPiece(id, 500);
    }} />}
  </section>;
}
