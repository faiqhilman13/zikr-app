import { afterEach, expect, it, vi } from 'vitest';
import { disablePushNotifications } from './push';
afterEach(()=>vi.unstubAllGlobals());
it('unsubscribes locally even while the backend is unreachable',async()=>{
  const unsubscribe=vi.fn().mockResolvedValue(true);
  vi.stubGlobal('navigator',{serviceWorker:{getRegistration:async()=>({pushManager:{getSubscription:async()=>({endpoint:'https://push.example/sub',unsubscribe})}})}});
  vi.stubGlobal('fetch',vi.fn(()=>new Promise(()=>{})));
  await disablePushNotifications();
  expect(unsubscribe).toHaveBeenCalledOnce();
});
it('does not report success when the browser refuses to unsubscribe',async()=>{
  const subscription={unsubscribe:async()=>false};
  vi.stubGlobal('navigator',{serviceWorker:{getRegistration:async()=>({pushManager:{getSubscription:async()=>subscription}})}});
  await expect(disablePushNotifications()).rejects.toThrow();
});
