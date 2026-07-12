import { useRegisterSW } from 'virtual:pwa-register/react';

export function usePwaUpdate() {
  const { needRefresh: [needRefresh, setNeedRefresh], offlineReady: [offlineReady, setOfflineReady], updateServiceWorker } = useRegisterSW();
  return { needRefresh, offlineReady, close: () => { setNeedRefresh(false); setOfflineReady(false); }, update: () => updateServiceWorker(true) };
}
