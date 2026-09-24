import { Bell, Check, ShieldCheck, Smartphone } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { isAndroid } from '../services/platform';
import { InstallSteps } from './InstallCard';
import type { DhikrPreset } from '../domain/types';

export function Onboarding({ presets, analyticsEnabled, onComplete, onClose }: { presets: DhikrPreset[]; analyticsEnabled: boolean; onComplete: (id: string, target: number, analyticsEnabled: boolean) => void; onClose: () => void }) {
  const { t } = useTranslation();
  const install = useInstallPrompt();
  // A phone reading Zikr in a browser tab is asked to add it to the Home Screen before
  // anything else. Reminders only work from there, and on iPhone the Home Screen app keeps
  // its own storage, so a practice set up in the tab would not follow it across.
  const [step, setStep] = useState<'install' | 'setup'>(() => !install.standalone && (install.isIos || isAndroid()) ? 'install' : 'setup');
  const [inBrowser, setInBrowser] = useState(false);
  const [selected, setSelected] = useState(presets[0].id);
  const [target, setTarget] = useState(presets[0].target);
  const [shareUsage, setShareUsage] = useState(analyticsEnabled);
  const trapRef = useFocusTrap<HTMLElement>(onClose);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const firstStep = useRef(step);

  // The focus trap only moves focus in when the dialog opens, and the button that moved
  // on has just gone, so the new step's title takes focus and is read out.
  useEffect(() => {
    if (step !== firstStep.current) titleRef.current?.focus();
  }, [step]);

  const promptInstall = async () => {
    if (await install.install() === 'accepted') setStep('setup');
  };

  return <div className="modal-backdrop onboarding-backdrop">
    <section className="modal onboarding" role="dialog" aria-modal="true" aria-labelledby="onboarding-title" ref={trapRef}>
      <button className="text-link back-link" onClick={onClose}>← {t('notNow')}</button>
      {step === 'install' ? <>
        <p className="eyebrow">{t('installFirstEyebrow')}</p><h2 id="onboarding-title" ref={titleRef} tabIndex={-1}>{t('installFirstTitle')}</h2><p>{t('installFirstBody')}</p>
        <ul className="install-reasons">
          <li><Bell aria-hidden="true" /><span>{t('installWhyReminders')}</span></li>
          <li><ShieldCheck aria-hidden="true" /><span>{t('installWhySafe')}</span></li>
          <li><Smartphone aria-hidden="true" /><span>{t('installWhyApp')}</span></li>
        </ul>
        <section className="install-how" aria-labelledby="install-how-title">
          <h3 id="install-how-title">{t('installHowTitle')}</h3>
          {install.canPrompt
            ? <button className="button full" onClick={() => void promptInstall()}>{t('install')}</button>
            : <InstallSteps isIos={install.isIos} />}
          {install.isIos && <p className="fine-print">{t('installSeparateData')}</p>}
        </section>
        <button className="text-link continue-link" onClick={() => { setInBrowser(true); setStep('setup'); }}>{t('continueInBrowser')}</button>
      </> : <>
        <p className="eyebrow">{t('tagline')}</p><h2 id="onboarding-title" ref={titleRef} tabIndex={-1}>{t('onboardingTitle')}</h2><p>{t('onboardingBody')}</p>
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
        {inBrowser && <p className="fine-print install-later">{t('installLater')}</p>}
      </>}
    </section>
  </div>;
}
