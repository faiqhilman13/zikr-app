import { useEffect, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export function usePwaUpdate() {
  const registration = useRef<ServiceWorkerRegistration | undefined>(undefined);
  const { needRefresh: [needRefresh, setNeedRefresh], offlineReady: [offlineReady, setOfflineReady], updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_url, value) { registration.current = value; void value?.update().catch(() => undefined); }
  });
  useEffect(() => {
    const check = () => { if (navigator.onLine && document.visibilityState === 'visible') void registration.current?.update().catch(() => undefined); };
    const interval = window.setInterval(check, 60 * 60 * 1000);
    document.addEventListener('visibilitychange', check);
    return () => { window.clearInterval(interval); document.removeEventListener('visibilitychange', check); };
  }, []);
  return { needRefresh, offlineReady, close: () => { setNeedRefresh(false); setOfflineReady(false); }, update: () => updateServiceWorker(true) };
}
