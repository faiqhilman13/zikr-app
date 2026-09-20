import { Check, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFocusTrap } from '../hooks/useFocusTrap';
import type { DhikrPreset } from '../domain/types';

export function Onboarding({ presets, analyticsEnabled, onComplete, onClose }: { presets: DhikrPreset[]; analyticsEnabled: boolean; onComplete: (id: string, target: number, analyticsEnabled: boolean) => void; onClose: () => void }) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(presets[0].id);
  const [target, setTarget] = useState(presets[0].target);
  const [shareUsage, setShareUsage] = useState(analyticsEnabled);
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
      <section className="onboarding-analytics" aria-labelledby="onboarding-analytics-title">
        <div className="onboarding-analytics-heading"><ShieldCheck aria-hidden="true" /><div><p className="eyebrow">{t('usageEyebrow')}</p><h3 id="onboarding-analytics-title">{t('usageTitle')}</h3></div></div>
        <p>{t('usageBody')}</p>
        <label className="toggle-row"><span>{t('analyticsToggle')}</span><input type="checkbox" checked={shareUsage} onChange={(event) => setShareUsage(event.target.checked)} /><i aria-hidden="true" /></label>
        <a className="text-link" href="/privacy">{t('privacy')}</a>
      </section>
      <button className="button full" onClick={() => onComplete(selected, target, shareUsage)}>{t('startCounting')}</button>
    </section>
  </div>;
}
