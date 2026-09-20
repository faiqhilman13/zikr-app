import { useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * The one place Zikr asks for anything. It explains what would be sent before asking, in
 * the same words the privacy page uses, and takes no for an answer permanently: dismissing
 * it is remembered, and the toggle in Settings stays as the way back in.
 */
export function AnalyticsChoice({ enabled, onEnable }: { enabled: boolean; onEnable: () => Promise<boolean> }) {
  const { t } = useTranslation();
  // Read once, before the first paint. A browser with storage blocked is treated as
  // already asked, because a prompt it can never dismiss would return on every load.
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem('zikr-usage-choice') === 'done'; } catch { return true; }
  });
  const [busy, setBusy] = useState(false);

  const close = () => {
    setDismissed(true);
    try { localStorage.setItem('zikr-usage-choice', 'done'); } catch { /* Asked once either way. */ }
  };

  if (enabled || dismissed) return null;

  return <section className="landing-section analytics-choice" aria-labelledby="analytics-choice-title">
    <p className="eyebrow">{t('usageEyebrow')}</p>
    <h2 id="analytics-choice-title">{t('usageTitle')}</h2>
    <p>{t('usageBody')}</p>
    <div className="button-stack">
      <button className="button secondary" disabled={busy} onClick={async () => {
        setBusy(true);
        try { if (await onEnable()) close(); } finally { setBusy(false); }
      }}>{t('usageAllow')}</button>
      <button className="text-link" disabled={busy} onClick={close}>{t('notNow')}</button>
    </div>
    <div className="footer-links"><a href="/privacy">{t('privacy')}</a></div>
  </section>;
}
