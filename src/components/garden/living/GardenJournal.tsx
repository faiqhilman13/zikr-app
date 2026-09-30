import { Bird, Droplets, Flower2, Footprints, Grape, Lamp, Lock, Sparkles, Sprout, TreeDeciduous, TreePalm, Waves, X, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useFocusTrap } from '../../../hooks/useFocusTrap';
import { formatDays } from '../../streak/format';
import { flowerCount, nextUnlock, treeStage, UNLOCKS, type UnlockId } from './growth';

const ICONS: Record<UnlockId, LucideIcon> = {
  firstBloom: Flower2, path: Footprints, lavender: Sprout, fountain: Droplets, pomegranate: TreeDeciduous, lantern: Lamp,
  butterflies: Sparkles, pool: Waves, palm: TreePalm, songbirds: Bird, vine: Grape, goldArch: Sparkles
};

/** Everything the garden holds and everything still to come: the collection that brings people back. */
export function GardenJournal({ days, onClose }: { days: number; onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const trapRef = useFocusTrap<HTMLElement>(onClose);
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
        <div><dt>{t('gardenTreeLabel')}</dt><dd>{t(`gardenTree${treeStage(days)}`)}</dd></div>
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
          return <li key={unlock.id} className={open ? 'open' : 'locked'}>
            <span className="journal-icon" aria-hidden="true"><Icon /></span>
            <strong>{open ? t(`gardenUnlock_${unlock.id}`) : t('gardenLockedName')}</strong>
            <small>{open ? t('gardenArrivedOn', { day: unlock.day }) : t('gardenArrivesOn', { day: unlock.day })}</small>
          </li>;
        })}
      </ul>
      <p className="fine-print">{t('gardenBody')}</p>
    </section>
  </div>;
}
