import { X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NOTE_LIMIT } from '../../../domain/state';
import type { DailyLog, DhikrPreset } from '../../../domain/types';
import { useFocusTrap } from '../../../hooks/useFocusTrap';
import { dayRatio } from './growth';

/** One flower, one day: what was recited, and a line to remember it by. */
export function FlowerMemory({ log, presets, onSave, onClose }: {
  log: DailyLog;
  presets: DhikrPreset[];
  onSave: (note: string) => Promise<boolean> | void;
  onClose: () => void;
}) {
  const { t, i18n } = useTranslation();
  const trapRef = useFocusTrap<HTMLElement>(onClose);
  const [note, setNote] = useState(log.note ?? '');
  const [saved, setSaved] = useState(false);
  const date = new Intl.DateTimeFormat(i18n.language, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${log.date}T12:00:00`));
  const recited = presets.filter((preset) => (log.counts[preset.id] ?? 0) > 0);
  const full = dayRatio(log, presets) >= 1;

  const save = async () => {
    const ok = await onSave(note);
    if (ok !== false) setSaved(true);
  };

  return <div className="modal-backdrop">
    <button className="backdrop-dismiss" aria-label={t('done')} onClick={onClose} />
    <section className="modal flower-memory" role="dialog" aria-modal="true" aria-labelledby="flower-memory-title" ref={trapRef}>
      <button className="icon-button modal-close" aria-label={t('done')} onClick={onClose}><X /></button>
      <p className="eyebrow">{t('flowerEyebrow')}</p>
      <h2 id="flower-memory-title">{date}</h2>
      <p className="journal-body">{full ? t('flowerFull') : t('flowerHalf')}</p>
      {recited.length > 0 && <ul className="memory-phrases">
        {recited.map((preset) => <li key={preset.id}><span>{preset.title}</span><strong>{(log.counts[preset.id] ?? 0).toLocaleString(i18n.language)}</strong></li>)}
      </ul>}
      <label>{t('flowerNoteLabel')}
        <textarea value={note} maxLength={NOTE_LIMIT} placeholder={t('flowerNotePlaceholder')} onChange={(event) => { setNote(event.target.value); setSaved(false); }} />
      </label>
      <div className="memory-foot">
        <small>{saved ? t('flowerSaved') : t('flowerPrivate')}</small>
        <button type="button" className="button small" disabled={note === (log.note ?? '')} onClick={() => void save()}>{t('flowerSave')}</button>
      </div>
    </section>
  </div>;
}
