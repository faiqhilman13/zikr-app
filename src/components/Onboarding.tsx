import { Check } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFocusTrap } from '../hooks/useFocusTrap';
import type { DhikrPreset } from '../domain/types';

export function Onboarding({ presets, onComplete, onClose }: { presets: DhikrPreset[]; onComplete: (id: string, target: number) => void; onClose: () => void }) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(presets[0].id);
  const [target, setTarget] = useState(presets[0].target);
  const trapRef = useFocusTrap<HTMLElement>(onClose);
  return <div className="modal-backdrop onboarding-backdrop">
    <section className="modal onboarding" role="dialog" aria-modal="true" aria-labelledby="onboarding-title" ref={trapRef}>
      <button className="text-link back-link" onClick={onClose}>← {t('notNow')}</button>
      <p className="eyebrow">{t('tagline')}</p><h2 id="onboarding-title">{t('onboardingTitle')}</h2><p>{t('onboardingBody')}</p>
      <fieldset><legend>{t('preferredDhikr')}</legend><div className="preset-list">
        {presets.map((preset) => <button type="button" className={`preset-choice ${selected === preset.id ? 'selected' : ''}`} key={preset.id} onClick={() => { setSelected(preset.id); setTarget(preset.target || 100); }}>
          <span><b>{preset.title}</b><small lang="ar" dir="rtl">{preset.arabic}</small></span>{selected === preset.id && <Check aria-hidden="true" />}
        </button>)}
      </div></fieldset>
      <label className="target-control"><span>{t('dailyTarget')}</span><output>{target}</output><input aria-label={t('dailyTarget')} type="range" min="10" max="500" step="1" value={target} onChange={(e) => setTarget(Number(e.target.value))} /></label>
      <button className="button full" onClick={() => onComplete(selected, target)}>{t('startCounting')}</button>
    </section>
  </div>;
}
