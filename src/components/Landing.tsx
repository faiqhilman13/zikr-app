import { CloudOff, LockKeyhole, UserRoundX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { InstallCard } from './InstallCard';

export function Landing({ onBegin }: { onBegin: () => void }) {
  const { t } = useTranslation();
  return <main className="landing">
    <header className="landing-nav">
      <a className="brand" href="#top" aria-label={t('brandHome')}><span className="brand-mark"><img src="/brand-symbol.png" alt="" /></span><span>{t('brand')}</span></a>
      <a className="text-link" href="#privacy">{t('privacy')}</a>
    </header>
    <section className="hero" id="top">
      <div className="hero-copy">
        <p className="eyebrow">{t('tagline')}</p>
        <h1>{t('landingTitle')}</h1>
        <p className="hero-body">{t('landingBody')}</p>
        <div className="hero-actions"><button className="button" onClick={onBegin}>{t('begin')}</button></div>
        <div className="trust-row">
          <span><LockKeyhole />{t('private')}</span><span><CloudOff />{t('offline')}</span><span><UserRoundX />{t('noAccount')}</span>
        </div>
      </div>
      <div className="ritual-preview" aria-label={t('previewLabel')}>
        <div className="preview-orbit"><span lang="ar" dir="rtl">سُبْحَانَ ٱللَّٰهِ</span><small>SubhanAllah</small><strong>33</strong></div>
        <p>{t('previewTagline')}</p>
      </div>
    </section>
    <InstallCard />
    <section className="landing-section" id="privacy">
      <p className="eyebrow">{t('private')}</p><h2>{t('privacyTitle')}</h2>
      <p>{t('privacyBody')}</p>
      <div className="footer-links"><a href="/privacy.html">{t('privacy')}</a><a href="/support.html">{t('support')}</a></div>
    </section>
  </main>;
}
