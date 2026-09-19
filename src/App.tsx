import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n, { detectedLanguage } from './i18n';
import { AppShell, type Tab } from './components/AppShell';
import { CounterView } from './components/CounterView';
import { TimerSetup } from './components/TimerSetup';
import { Landing } from './components/Landing';
import { Onboarding } from './components/Onboarding';
import { ProgressView } from './components/ProgressView';
import { SettingsView } from './components/SettingsView';
import { dayKey, selectedPreset } from './domain/state';
import { disablePushNotifications } from './services/push';
import { track } from './data/analytics';
import { usePwaUpdate } from './hooks/usePwaUpdate';
import { useZikrState } from './hooks/useZikrState';
import { requestDurableStorage } from './services/storage';

export function App() {
  const controller = useZikrState();
  const { t } = useTranslation();
  // Read once, before storage opens, the same way the theme and language hints are read.
  const [returning] = useState(() => {
    try { return localStorage.getItem('zikr-onboarded') === '1'; } catch { return false; }
  });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [timerSetup, setTimerSetup] = useState(false);
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
  // Before onboarding there is no chosen language yet, only the default that every new
  // state carries, so detection wins until the person actually picks one. Without this
  // the default overwrites detection on first load and everyone starts in English.
  const language = controller.state.onboardingComplete ? controller.state.settings.language : detectedLanguage;
  useEffect(() => {
    if (!controller.ready) return;
    void i18n.changeLanguage(language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    try { localStorage.setItem('zikr-language', language); } catch { /* first-run hint only */ }
  }, [language, controller.ready]);

  // Mirrors onboarding status for the next cold start, so the boot screen matches what
  // the person will actually land on. Cleared by a reset along with everything else.
  const onboarded = controller.state.onboardingComplete;
  useEffect(() => {
    if (!controller.ready) return;
    try {
      if (onboarded) localStorage.setItem('zikr-onboarded', '1');
      else localStorage.removeItem('zikr-onboarded');
    } catch { /* pre-boot hint only */ }
  }, [onboarded, controller.ready]);

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

  const notices = <>
    {controller.conflict && <aside className="update-toast storage-warning" role="alert"><span>{t('dataConflict')}</span><button className="text-link" onClick={controller.clearConflict}>{t('done')}</button></aside>}
    {(pwa.needRefresh || pwa.offlineReady) && <aside className="update-toast" role="status"><span>{pwa.needRefresh ? t('updateReady') : t('offlineReady')}</span>{pwa.needRefresh && <button className="button small" disabled={controller.pending} onClick={() => void pwa.update()}>{t('updateNow')}</button>}<button className="text-link" onClick={pwa.close}>{t('done')}</button></aside>}
  </>;

  // A first visit paints the prerendered landing before any script runs. Replacing it
  // with a splash while IndexedDB opens would flash the page for the one audience that
  // arrived from search, so the landing stands in as the loading state for anyone who
  // has not onboarded. Returning visitors still get the splash on their way to the app.
  if (!controller.ready) return returning
    ? <div className="splash" aria-label={t('loadingLabel')}><span>ذِكر</span></div>
    : <Landing onBegin={() => setShowOnboarding(true)} />;

  if (controller.storageFailed) return <main className="recovery-screen" role="alert"><h1>{t('storageBlockedTitle')}</h1><p>{t('storageBlockedBody')}</p><button className="button" onClick={() => window.location.reload()}>{t('retryLoad')}</button><a href="/support.html">{t('support')}</a>{notices}</main>;

  if (!controller.state.onboardingComplete) return <>
    {notices}
    <Landing onBegin={() => setShowOnboarding(true)} />
    {showOnboarding && <Onboarding presets={controller.state.presets} onClose={() => setShowOnboarding(false)} onComplete={(id, target) => { controller.completeOnboarding(id, target, language); void requestDurableStorage(); void track(controller.state, 'onboarding_complete'); }} />}
  </>;

  return <>
    <a className="skip-link" href="#main-content">{t('skipToContent')}</a>
    <AppShell tab={tab} setTab={(next) => { setTab(next); void track(controller.state, 'tab_view', { tab: next }); }}>
      {tab === 'count' && <CounterView state={controller.state} onIncrement={() => { controller.increment(); void track(controller.state, 'count_increment'); }} onUndo={controller.decrement} onSelect={controller.selectPreset} onStartTimer={() => setTimerSetup(true)} onStopTimer={() => { void controller.stopTimer(); void track(controller.state, 'timer_stop'); }} onTimerRollover={controller.refresh} />}
      {tab === 'progress' && <ProgressView state={controller.state} />}
      {tab === 'settings' && <SettingsView state={controller.state} setState={controller.setState} patchSettings={controller.patchSettings} setLanguage={controller.setLanguage} setTheme={controller.setTheme} updatePreset={controller.updatePreset} addPreset={controller.addPreset} removePreset={controller.removePreset} onReset={async () => { await disablePushNotifications(); if (await controller.reset()) setTab('count'); }} />}
    </AppShell>
    {timerSetup && <TimerSetup
      preset={selectedPreset(controller.state)}
      onClose={() => setTimerSetup(false)}
      onStart={(secondsPerRep) => {
        setTimerSetup(false);
        void controller.startTimer(secondsPerRep);
        void track(controller.state, 'timer_start', { counting: secondsPerRep !== null, ...(secondsPerRep === null ? {} : { secondsPerRep }) });
      }}
    />}
    {notices}
  </>;
}
