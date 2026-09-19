import { Clock3, Play, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { DEFAULT_SECONDS_PER_REP, MAX_SECONDS_PER_REP, MIN_SECONDS_PER_REP, clampPace } from '../domain/state';
import type { DhikrPreset } from '../domain/types';

/**
 * Asks how long one recitation takes before a session starts. The answer turns elapsed
 * time into repetitions, so it is asked plainly rather than guessed, and the estimate is
 * shown before starting. Time-only practice stays available and remains the default for
 * anyone who would rather not have repetitions inferred at all.
 */
export function TimerSetup({ preset, onStart, onClose }: {
  preset: DhikrPreset; onStart: (secondsPerRep: number | null) => void; onClose: () => void;
}) {
  const { t } = useTranslation();
  const trapRef = useFocusTrap<HTMLElement>(onClose);
  const [value, setValue] = useState(String(preset.secondsPerRep ?? DEFAULT_SECONDS_PER_REP));
  const pace = clampPace(Number(value));
  const perMinute = pace === null ? 0 : Math.floor(60 / pace);

  return <div className="modal-backdrop">
    <button className="backdrop-dismiss" aria-label={t('cancel')} onClick={onClose} />
    <section className="modal timer-setup" role="dialog" aria-modal="true" aria-labelledby="timer-setup-title" ref={trapRef}>
      <button className="icon-button modal-close" aria-label={t('cancel')} onClick={onClose}><X /></button>
      <div className="modal-icon"><Clock3 aria-hidden="true" /></div>
      <p className="eyebrow">{t('timedPractice')}</p>
      <h2 id="timer-setup-title">{t('timerSetupTitle')}</h2>
      <p>{t('timerSetupBody', { title: preset.title })}</p>
      <label className="pace-field" htmlFor="seconds-per-rep">
        <span>{t('secondsPerRep')}</span>
        <input
          id="seconds-per-rep"
          type="number"
          inputMode="decimal"
          step="0.5"
          min={MIN_SECONDS_PER_REP}
          max={MAX_SECONDS_PER_REP}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </label>
      <p className="pace-estimate" aria-live="polite">
        {pace === null ? t('paceInvalid') : t('paceEstimate', { count: perMinute, pace })}
      </p>
      <p className="pace-note">{t('timerCountNote', { minutes: 60 })}</p>
      <div className="button-stack">
        <button className="button" disabled={pace === null} onClick={() => onStart(pace)}><Play aria-hidden="true" />{t('startCountingTimer')}</button>
        <button className="button secondary" onClick={() => onStart(null)}>{t('trackTimeOnly')}</button>
      </div>
    </section>
  </div>;
}
