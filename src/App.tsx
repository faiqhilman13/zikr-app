import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n, { detectedLanguage } from './i18n';
import { AppShell, type Tab } from './components/AppShell';
import { CounterView } from './components/CounterView';
import { TimerSetup } from './components/TimerSetup';
import { AnalyticsChoice } from './components/AnalyticsChoice';
import { Landing } from './components/Landing';
import { Onboarding } from './components/Onboarding';
import { ProgressView } from './components/ProgressView';
import { SettingsView } from './components/SettingsView';
import { StreakChip } from './components/streak/StreakChip';
import { StreakSheet } from './components/streak/StreakSheet';
import { ListenView, NowPlaying } from './components/ListenView';
import { listenLibrary } from './data/listen';
import { dayKey, selectedPreset } from './domain/state';
import { paletteFor } from './theme';
import { disablePushNotifications, pushConfigured, refreshPushSubscription } from './services/push';
import { reportUsage } from './data/usage';
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
  const [streakOpen, setStreakOpen] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const playing = listenLibrary.find((item) => item.id === playingId);
  const pwa = usePwaUpdate();

  const theme = controller.state.settings.theme;
  const palette = controller.state.settings.palette;
  const reducedMotion = controller.state.settings.reducedMotion;
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && media.matches);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
      document.documentElement.classList.toggle('reduce-motion', reducedMotion);
      // Derived here from the shipped seeds, never from stored text, then cached for the
      // pre-paint script so a chosen palette does not flash the default on next launch.
      const resolved = paletteFor(palette, dark ? 'dark' : 'light');
      for (const [name, value] of Object.entries(resolved)) document.documentElement.style.setProperty(name, value);
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved['--bg']);
      try {
        localStorage.setItem('zikr-theme', theme);
        localStorage.setItem('zikr-palette', JSON.stringify(resolved));
      } catch { /* pre-paint hint only */ }
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme, palette, reducedMotion]);

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

  // Optional usage reporting, off unless it was turned on, and never carrying anything
  // that was counted. Re-running is cheap: the reporter remembers what it already sent
  // today. The interval is here for an installed app left open across a UTC midnight,
  // and the listeners for a tab coming back or the network returning.
  const analyticsOptIn = controller.state.settings.analyticsOptIn;
  // Only reminders this build can deliver count as on, here and below.
  const remindersOn = controller.ready && pushConfigured && controller.state.settings.reminders.pushEnabled;
  useEffect(() => {
    if (!controller.ready) return;
    const report = () => void reportUsage(analyticsOptIn, onboarded, remindersOn);
    report();
    const interval = window.setInterval(report, 60_000);
    window.addEventListener('online', report);
    document.addEventListener('visibilitychange', report);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('online', report);
      document.removeEventListener('visibilitychange', report);
    };
  }, [analyticsOptIn, onboarded, remindersOn, controller.ready]);

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

  // Keeps the server's copy of this browser's reminder in step whenever the app opens or
  // comes back: a subscription the browser replaced, a move to another time zone, a copy
  // the server lost. Once notifications are switched off for the site outside the app, the
  // setting follows, so it never promises a reminder that cannot arrive.
  const reminderTime = controller.state.settings.reminders.time;
  const remindersBlocked = useEffectEvent(() => {
    void controller.patchSettings({ reminders: { enabled: false, pushEnabled: false, time: reminderTime } });
  });
  useEffect(() => {
    if (!remindersOn) return;
    const check = () => {
      if (document.visibilityState !== 'visible') return;
      void refreshPushSubscription(reminderTime).then((on) => { if (!on) remindersBlocked(); });
    };
    check();
    document.addEventListener('visibilitychange', check);
    return () => document.removeEventListener('visibilitychange', check);
  }, [remindersOn, reminderTime]);

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

  if (controller.storageFailed) return <main className="recovery-screen" role="alert"><h1>{t('storageBlockedTitle')}</h1><p>{t('storageBlockedBody')}</p><button className="button" onClick={() => window.location.reload()}>{t('retryLoad')}</button><a href="/support">{t('support')}</a>{notices}</main>;

  if (!controller.state.onboardingComplete) return <>
    {notices}
    <Landing onBegin={() => setShowOnboarding(true)} analyticsChoice={
      <AnalyticsChoice enabled={analyticsOptIn} onEnable={() => controller.patchSettings({ analyticsOptIn: true })} />
    } />
    {showOnboarding && <Onboarding presets={controller.state.presets} analyticsEnabled={analyticsOptIn} onClose={() => setShowOnboarding(false)} onComplete={(id, target, shareUsage) => { controller.completeOnboarding(id, target, language, shareUsage); void requestDurableStorage(); }} />}
  </>;

  // From the streak sheet straight to the switch that turns reminders on. Settings mounts
  // on this render, so the scroll and focus wait a frame for it.
  const openReminders = () => {
    setStreakOpen(false);
    setTab('settings');
    requestAnimationFrame(() => {
      document.getElementById('reminders-title')?.closest('section')?.scrollIntoView({ block: 'start' });
      document.getElementById('enable-reminders')?.focus({ preventScroll: true });
    });
  };

  return <>
    <a className="skip-link" href="#main-content">{t('skipToContent')}</a>
    <AppShell tab={tab} setTab={setTab} showListen={listenLibrary.length > 0} leading={<StreakChip state={controller.state} onOpen={() => setStreakOpen(true)} />}>
      {tab === 'count' && <CounterView state={controller.state} onIncrement={controller.increment} onUndo={controller.decrement} onSelect={controller.selectPreset} onStartTimer={() => setTimerSetup(true)} onStopTimer={() => void controller.stopTimer()} onTimerRollover={controller.refresh} />}
      {tab === 'progress' && <ProgressView state={controller.state} />}
      {/* Kept mounted once something plays, so the player survives a switch to the counter. */}
      {(tab === 'listen' || playing) && <div className={tab === 'listen' ? undefined : 'listen-parked'} inert={tab !== 'listen'}>
        <ListenView items={listenLibrary} playingId={playingId} onPlay={setPlayingId} onStop={() => setPlayingId(null)} />
      </div>}
      {tab === 'settings' && <SettingsView state={controller.state} setState={controller.setState} patchSettings={controller.patchSettings} setLanguage={controller.setLanguage} setTheme={controller.setTheme} updatePreset={controller.updatePreset} addPreset={controller.addPreset} removePreset={controller.removePreset} onReset={async () => { await disablePushNotifications(); if (await controller.reset()) setTab('count'); }} />}
    </AppShell>
    {playing && tab !== 'listen' && <NowPlaying item={playing} onOpen={() => setTab('listen')} onStop={() => setPlayingId(null)} />}
    {timerSetup && <TimerSetup
      preset={selectedPreset(controller.state)}
      onClose={() => setTimerSetup(false)}
      onStart={(secondsPerRep) => {
        setTimerSetup(false);
        void controller.startTimer(secondsPerRep);
      }}
    />}
    {streakOpen && <StreakSheet
      state={controller.state}
      onClose={() => setStreakOpen(false)}
      onReminders={pushConfigured && !controller.state.settings.reminders.pushEnabled ? openReminders : undefined}
    />}
    {notices}
  </>;
}
