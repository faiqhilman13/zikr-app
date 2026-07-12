import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from './i18n';
import { AppShell, type Tab } from './components/AppShell';
import { CounterView } from './components/CounterView';
import { Landing } from './components/Landing';
import { Onboarding } from './components/Onboarding';
import { ProgressView } from './components/ProgressView';
import { SettingsView } from './components/SettingsView';
import { dayKey } from './domain/state';
import { resetDatabase } from './data/db';
import { track } from './data/analytics';
import { usePwaUpdate } from './hooks/usePwaUpdate';
import { useZikrState } from './hooks/useZikrState';
import { requestDurableStorage } from './services/storage';

export function App() {
  const controller = useZikrState();
  const { t } = useTranslation();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [tab, setTab] = useState<Tab>('count');
  const pwa = usePwaUpdate();

  const theme = controller.state.settings.theme;
  const reducedMotion = controller.state.settings.reducedMotion;
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && media.matches);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
      document.documentElement.classList.toggle('reduce-motion', reducedMotion);
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0a1628' : '#faf8f5');
      try { localStorage.setItem('zikr-theme', theme); } catch { /* pre-paint hint only */ }
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme, reducedMotion]);

  // Single source of truth for language: whatever lands in state (settings screen,
  // backup restore, reset) is mirrored to i18next, the document, and the pre-boot hint.
  const language = controller.state.settings.language;
  useEffect(() => {
    if (!controller.ready) return;
    void i18n.changeLanguage(language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    try { localStorage.setItem('zikr-language', language); } catch { /* first-run hint only */ }
  }, [language, controller.ready]);

  // Installed PWAs stay resident overnight; refresh state when the day rolls over so
  // the header date and today's counts do not show yesterday.
  const refresh = controller.refresh;
  const lastDay = useRef(dayKey());
  useEffect(() => {
    const checkDay = () => {
      const today = dayKey();
      if (today !== lastDay.current) {
        lastDay.current = today;
        refresh();
      }
    };
    const interval = window.setInterval(checkDay, 60_000);
    document.addEventListener('visibilitychange', checkDay);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', checkDay);
    };
  }, [refresh]);

  if (!controller.ready) return <div className="splash" aria-label={t('loadingLabel')}><span>ذِكر</span></div>;

  if (!controller.state.onboardingComplete) return <>
    <Landing onBegin={() => setShowOnboarding(true)} />
    {showOnboarding && <Onboarding presets={controller.state.presets} onClose={() => setShowOnboarding(false)} onComplete={(id, target) => { controller.completeOnboarding(id, target); void requestDurableStorage(); void track(controller.state, 'onboarding_complete'); }} />}
  </>;

  return <>
    <a className="skip-link" href="#main-content">{t('skipToContent')}</a>
    <AppShell tab={tab} setTab={(next) => { setTab(next); void track(controller.state, 'tab_view', { tab: next }); }}>
      {tab === 'count' && <CounterView state={controller.state} onIncrement={() => { controller.increment(); void track(controller.state, 'count_increment'); }} onUndo={controller.decrement} onSelect={(id) => { if (controller.state.activeTimer) controller.setTimerRunning(false); controller.selectPreset(id); }} onToggleTimer={() => controller.setTimerRunning(!controller.state.activeTimer)} onTimerRollover={() => controller.setTimerRunning(true)} />}
      {tab === 'progress' && <ProgressView state={controller.state} />}
      {tab === 'settings' && <SettingsView state={controller.state} setState={controller.setState} patchSettings={controller.patchSettings} setLanguage={controller.setLanguage} setTheme={controller.setTheme} updatePreset={controller.updatePreset} addPreset={controller.addPreset} removePreset={controller.removePreset} onReset={async () => { controller.setState(await resetDatabase()); setTab('count'); }} />}
    </AppShell>
    {controller.storageFailed && <aside className="update-toast storage-warning" role="alert"><span>{t('storageWarning')}</span></aside>}
    {(pwa.needRefresh || pwa.offlineReady) && <aside className="update-toast" role="status"><span>{pwa.needRefresh ? t('updateReady') : t('offlineReady')}</span>{pwa.needRefresh && <button className="button small" onClick={() => void pwa.update()}>{t('updateNow')}</button>}<button className="text-link" onClick={pwa.close}>{t('done')}</button></aside>}
  </>;
}
