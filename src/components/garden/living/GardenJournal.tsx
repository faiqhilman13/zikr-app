import { Armchair, Bird, Citrus, Droplets, Flower, Flower2, Footprints, Grape, Lamp, LampWallDown, Lock, Moon, Sparkle, Sparkles, Sprout, TreeDeciduous, TreePalm, TreePine, Waves, X, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { DhikrPreset } from '../../../domain/types';
import { useFocusTrap } from '../../../hooks/useFocusTrap';
import { formatDays } from '../../streak/format';
import { flowerCount, nextUnlock, ORCHARD, PLANTS_MAX, treeStage, UNLOCKS, type OrchardId, type UnlockId } from './growth';

const ICONS: Record<UnlockId, LucideIcon> = {
  firstBloom: Flower2, path: Footprints, lavender: Sprout, fountain: Droplets, butterflies: Sparkle, pomegranate: TreeDeciduous,
  lantern: Lamp, lemons: Citrus, pool: Waves, bench: Armchair, palm: TreePalm, songbirds: Bird, lanternString: LampWallDown,
  cypresses: TreePine, roses: Flower, vine: Grape, fireflies: Sparkles, shootingStars: Moon, goldArch: Sparkles
};

/** Everything the garden holds and everything still to come: the collection that brings people back. */
export function GardenJournal({ tended, full, orchard, presets, recent, onClose, onSelect, onFlower }: {
  tended: number; full: number;
  orchard: Record<OrchardId, { phrase: string; reps: number; plants: number; next: number | null }>;
  presets: DhikrPreset[];
  /** Recent tended days, newest first, each opening its flower. */
  recent: string[];
  onClose: () => void; onSelect: (id: UnlockId) => void; onFlower: (date: string) => void;
}) {
  const [why, setWhy] = useState(false);
  const phraseName = (id: string) => presets.find((preset) => preset.id === id)?.title ?? id;
  const days = tended;
  const { t, i18n } = useTranslation();
  const trapRef = useFocusTrap<HTMLElement>(onClose);
  const short = new Intl.DateTimeFormat(i18n.language, { weekday: 'short', day: 'numeric', month: 'short' });
  const next = nextUnlock(days);
  const previous = [...UNLOCKS].reverse().find((unlock) => unlock.day <= days)?.day ?? 0;
  const toNext = next ? (days - previous) / (next.day - previous) : 1;
  return <div className="modal-backdrop">
    <button className="backdrop-dismiss" aria-label={t('cancel')} onClick={onClose} />
    <section className="modal garden-journal" role="dialog" aria-modal="true" aria-labelledby="garden-journal-title" ref={trapRef}>
      <button className="icon-button modal-close" aria-label={t('cancel')} onClick={onClose}><X /></button>
      <p className="eyebrow">{t('gardenJournal')}</p>
      <h2 id="garden-journal-title">{t('gardenTended', { days: formatDays(days, i18n.language) })}</h2>
      <p className="journal-body">{t('gardenJournalBody')}</p>
      <dl className="journal-stats">
        <div><dt>{t('gardenTreeLabel')}</dt><dd>{t(`gardenTree${treeStage(full)}`)}</dd></div>
        <div><dt>{t('gardenFlowersLabel')}</dt><dd>{flowerCount(days).toLocaleString(i18n.language)}</dd></div>
      </dl>
      {next && <div className="journal-next">
        <span>{t('gardenNext', { item: t(`gardenUnlock_${next.id}`), when: t('gardenInDays', { days: formatDays(next.day - days, i18n.language) }) })}</span>
        <div className="fine-progress"><i style={{ '--fill': toNext } as React.CSSProperties} /></div>
      </div>}
      <ul className="journal-grid">
        {UNLOCKS.map((unlock) => {
          const open = days >= unlock.day;
          const Icon = open ? ICONS[unlock.id] : Lock;
          const body = <>
            <span className="journal-icon" aria-hidden="true"><Icon /></span>
            <strong>{open ? t(`gardenUnlock_${unlock.id}`) : t('gardenLockedName')}</strong>
            <small>{open ? t('gardenArrivedOn', { day: unlock.day }) : t('gardenArrivesOn', { day: unlock.day })}</small>
          </>;
          // Collected pieces take you to them in the garden.
          return <li key={unlock.id} className={open ? 'open' : 'locked'}>
            {open ? <button type="button" onClick={() => onSelect(unlock.id)} aria-label={t('gardenShowMe', { item: t(`gardenUnlock_${unlock.id}`) })}>{body}</button> : body}
          </li>;
        })}
      </ul>
      <section className="journal-section" aria-labelledby="orchard-title">
        <h3 id="orchard-title">{t('orchardTitle')}</h3>
        <ul className="orchard-list">{ORCHARD.map(({ id }) => {
          const grove = orchard[id];
          return <li key={id}>
            <strong>{t(`orchard_${id}`)}</strong>
            <span>{grove.plants} / {PLANTS_MAX}</span>
            <small>{grove.next === null ? t('orchardFull', { phrase: phraseName(grove.phrase) }) : t('orchardNext', { phrase: phraseName(grove.phrase), count: grove.next.toLocaleString(i18n.language) })}</small>
          </li>;
        })}</ul>
      </section>
      {recent.length > 0 && <section className="journal-section" aria-labelledby="recent-flowers-title">
        <h3 id="recent-flowers-title">{t('recentFlowers')}</h3>
        <div className="recent-flowers">{recent.map((date) => <button key={date} type="button" className="quiet-button" onClick={() => onFlower(date)}>{short.format(new Date(`${date}T12:00:00`))}</button>)}</div>
      </section>}
      <section className="journal-section">
        <button type="button" className="text-link" aria-expanded={why} onClick={() => setWhy(!why)}>{t('whyGarden')}</button>
        {why && <div className="why-garden">
          <p className="journal-body">{t('whyGardenIntro')}</p>
          <blockquote>
            <p lang="ar" dir="rtl">«لَقِيتُ إِبْرَاهِيمَ لَيْلَةَ أُسْرِيَ بِي فَقَالَ: يَا مُحَمَّدُ، أَقْرِئْ أُمَّتَكَ مِنِّي السَّلَامَ، وَأَخْبِرْهُمْ أَنَّ الْجَنَّةَ طَيِّبَةُ التُّرْبَةِ، عَذْبَةُ الْمَاءِ، وَأَنَّهَا قِيعَانٌ، وَأَنَّ غِرَاسَهَا: سُبْحَانَ اللَّهِ، وَالْحَمْدُ لِلَّهِ، وَلَا إِلَهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ»</p>
            {t('hadithIbrahim') && <p>{t('hadithIbrahim')}</p>}
            <cite>{t('hadithIbrahimSource')}</cite>
          </blockquote>
          <blockquote>
            <p lang="ar" dir="rtl">«مَنْ قَالَ: سُبْحَانَ اللَّهِ الْعَظِيمِ وَبِحَمْدِهِ، غُرِسَتْ لَهُ نَخْلَةٌ فِي الْجَنَّةِ»</p>
            {t('hadithPalm') && <p>{t('hadithPalm')}</p>}
            <cite>{t('hadithPalmSource')}</cite>
          </blockquote>
          <p className="fine-print">{t('whyGardenNote')}</p>
        </div>}
      </section>
      <p className="fine-print">{t('gardenBody')}</p>
    </section>
  </div>;
}
