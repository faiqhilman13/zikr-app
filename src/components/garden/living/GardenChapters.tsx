import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BIOMES } from '../../../domain/state';
import type { BiomeId } from '../../../domain/types';
import { useFocusTrap } from '../../../hooks/useFocusTrap';
import { formatDays } from '../../streak/format';
import { flowerCount, type Chapter } from './growth';
import { LivingGarden } from './LivingGarden';

const NOON = new Date(2026, 0, 1, 12, 0);

/** A garden painted still, at noon, for choosing between them or looking back. Memoised
 * because a scene is costly to draw and a still one never changes: a picker re-rendering
 * for a slider or a selection must not paint every garden again. */
export const GardenPreview = memo(function GardenPreview({ biome, tended, full, label }: { biome: BiomeId; tended: number; full: number; label: string }) {
  return <LivingGarden biome={biome} ratio={1} tended={tended} full={full} now={NOON} celebrate={false} motion={false} fresh={[]} freshFlower={false} label={label} />;
});

/** Offered when a garden is complete: the person chooses where to plant next. */
export function GardenChooser({ current, onChoose, onClose }: { current: BiomeId; onChoose: (biome: BiomeId) => void; onClose: () => void }) {
  const { t } = useTranslation();
  const trapRef = useFocusTrap<HTMLElement>(onClose);
  return <div className="modal-backdrop">
    <button className="backdrop-dismiss" aria-label={t('cancel')} onClick={onClose} />
    <section className="modal garden-chooser" role="dialog" aria-modal="true" aria-labelledby="garden-chooser-title" ref={trapRef}>
      <button className="icon-button modal-close" aria-label={t('cancel')} onClick={onClose}><X /></button>
      <p className="eyebrow">{t('chooserEyebrow')}</p>
      <h2 id="garden-chooser-title">{t('chooserTitle')}</h2>
      <p className="journal-body">{t('chooserBody')}</p>
      <ul className="biome-list">
        {BIOMES.map((biome) => <li key={biome}>
          <button type="button" className="biome-option" onClick={() => onChoose(biome)}>
            <span className="biome-preview"><GardenPreview biome={biome} tended={60} full={60} label={t(`biome_${biome}`)} /></span>
            <strong>{t(`biome_${biome}`)}{biome === current && <small> · {t('biomeAgain')}</small>}</strong>
            <span>{t(`biome_${biome}_body`)}</span>
          </button>
        </li>)}
      </ul>
    </section>
  </div>;
}

/** Every garden kept, drawn again from the days that grew it. Nothing is stored but the days. */
export function GardenGallery({ chapters, onClose }: { chapters: Chapter[]; onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const trapRef = useFocusTrap<HTMLElement>(onClose);
  const month = new Intl.DateTimeFormat(i18n.language, { month: 'short', year: 'numeric' });
  const span = (chapter: Chapter) => {
    const dates = chapter.logs.map((log) => log.date).sort();
    if (!dates.length) return '';
    const from = month.format(new Date(`${chapter.startedOn ?? dates[0]}T12:00:00`));
    const to = chapter.endedBefore ? month.format(new Date(`${dates[dates.length - 1]}T12:00:00`)) : t('galleryNow');
    return from === to ? from : `${from} – ${to}`;
  };
  return <div className="modal-backdrop">
    <button className="backdrop-dismiss" aria-label={t('done')} onClick={onClose} />
    <section className="modal garden-gallery" role="dialog" aria-modal="true" aria-labelledby="garden-gallery-title" ref={trapRef}>
      <button className="icon-button modal-close" aria-label={t('done')} onClick={onClose}><X /></button>
      <p className="eyebrow">{t('galleryEyebrow')}</p>
      <h2 id="garden-gallery-title">{t('galleryTitle')}</h2>
      <ul className="gallery-list">
        {[...chapters].reverse().map((chapter) => <li key={chapter.index} className={chapter.endedBefore ? undefined : 'current'}>
          <span className="gallery-painting"><GardenPreview biome={chapter.biome} tended={chapter.tended} full={chapter.full} label={t(`biome_${chapter.biome}`)} /></span>
          <div>
            <strong>{t('galleryNumber', { number: chapter.index + 1 })} · {t(`biome_${chapter.biome}`)}</strong>
            <small>{span(chapter)}</small>
            <small>{t('gardenTended', { days: formatDays(chapter.tended, i18n.language) })} · {t('galleryFlowers', { count: flowerCount(chapter.tended) })}</small>
          </div>
        </li>)}
      </ul>
    </section>
  </div>;
}

/** A month of days; the tended ones open their memory. */
export function DayCalendar({ tended, onDay }: { tended: Set<string>; onDay: (date: string) => void }) {
  const { t, i18n } = useTranslation();
  const latest = [...tended].sort().at(-1);
  const [cursor, setCursor] = useState(() => {
    const base = latest ? new Date(`${latest}T12:00:00`) : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1, 12);
  });
  const year = cursor.getFullYear();
  const monthIndex = cursor.getMonth();
  const days = new Date(year, monthIndex + 1, 0).getDate();
  const lead = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const pad = (n: number) => String(n).padStart(2, '0');
  const keyOf = (day: number) => `${year}-${pad(monthIndex + 1)}-${pad(day)}`;
  const title = new Intl.DateTimeFormat(i18n.language, { month: 'long', year: 'numeric' }).format(cursor);
  const weekday = new Intl.DateTimeFormat(i18n.language, { weekday: 'narrow' });
  const move = (step: number) => setCursor(new Date(year, monthIndex + step, 1, 12));
  return <div className="day-calendar">
    <div className="calendar-head">
      <button type="button" className="icon-button" aria-label={t('calendarPrevious')} onClick={() => move(-1)}><ChevronLeft /></button>
      <strong>{title}</strong>
      <button type="button" className="icon-button" aria-label={t('calendarNext')} onClick={() => move(1)}><ChevronRight /></button>
    </div>
    <div className="calendar-grid" role="group" aria-label={title}>
      {Array.from({ length: 7 }, (_, i) => <span key={`w${i}`} className="calendar-weekday" aria-hidden="true">{weekday.format(new Date(2024, 0, 1 + i))}</span>)}
      {Array.from({ length: lead }, (_, i) => <span key={`b${i}`} />)}
      {Array.from({ length: days }, (_, i) => {
        const key = keyOf(i + 1);
        return tended.has(key)
          ? <button key={key} type="button" className="calendar-day kept" onClick={() => onDay(key)} aria-label={t('calendarOpen', { date: new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'long' }).format(new Date(`${key}T12:00:00`)) })}>{i + 1}</button>
          : <span key={key} className="calendar-day">{i + 1}</span>;
      })}
    </div>
  </div>;
}
