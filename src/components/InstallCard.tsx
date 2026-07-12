import { Download, Share, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

export function InstallCard({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  const install = useInstallPrompt();
  if (!install.canInstall) return null;

  return <>
    <aside className={`install-card ${compact ? 'compact' : ''}`} aria-labelledby="install-title">
      <div className="install-glyph"><Download aria-hidden="true" /></div>
      <div><strong id="install-title">{t('install')}</strong><p>{install.isIos ? t('installIos') : t('installAndroid')}</p></div>
      <button className="button small" onClick={() => void install.install()}>{t('install')}</button>
    </aside>
    {install.showInstructions && <InstallInstructions isIos={install.isIos} onClose={() => install.setShowInstructions(false)} />}
  </>;
}

function InstallInstructions({ isIos, onClose }: { isIos: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const trapRef = useFocusTrap<HTMLElement>(onClose);
  const steps = isIos ? ['iosStep1', 'iosStep2', 'iosStep3'] : ['androidStep1', 'androidStep2', 'androidStep3'];
  return <div className="modal-backdrop">
    <button className="backdrop-dismiss" aria-label={t('cancel')} onClick={onClose} />
    <section className="modal" role="dialog" aria-modal="true" aria-labelledby="install-dialog-title" ref={trapRef}>
      <button className="icon-button modal-close" aria-label={t('cancel')} onClick={onClose}><X /></button>
      <div className="modal-icon"><Share aria-hidden="true" /></div>
      <h2 id="install-dialog-title">{t('install')}</h2>
      <p>{isIos ? t('installIos') : t('installAndroid')}</p>
      <ol className="install-steps">{steps.map((step) => <li key={step}>{t(step)}</li>)}</ol>
      <button className="button full" onClick={onClose}>{t('done')}</button>
    </section>
  </div>;
}
