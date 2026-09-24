import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../i18n';
import { disablePushNotifications, enablePushNotifications, refreshPushSubscription } from './push';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.useRealTimers();
  localStorage.clear();
});

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

const ENDPOINT = '/.netlify/functions/push';
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
/** Shaped like an uncompressed P-256 point, which is all the app looks at. */
const keyBytes = (seed: number) => Uint8Array.from({ length: 65 }, (_, index) => index === 0 ? 4 : (index * seed) % 256);
const base64Url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const KEY = keyBytes(7);
const OLD_KEY = keyBytes(11);

type FakeSubscription = {
  endpoint: string;
  options: { applicationServerKey: ArrayBuffer; userVisibleOnly: boolean };
  unsubscribe: () => Promise<boolean>;
  toJSON: () => object;
};

let serial = 0;
/** A browser's push service holding at most one subscription, as a real one does. */
function pushService(key: Uint8Array | null = KEY) {
  let current: FakeSubscription | null = null;
  const make = (made: Uint8Array): FakeSubscription => {
    const id = ++serial;
    const endpoint = `https://fcm.googleapis.com/fcm/send/test-${id}`;
    const subscription: FakeSubscription = {
      endpoint,
      options: { applicationServerKey: new Uint8Array(made).buffer, userVisibleOnly: true },
      unsubscribe: vi.fn(async () => { if (current === subscription) current = null; return true; }),
      toJSON: () => ({ endpoint, expirationTime: null, keys: { p256dh: `p256dh-${id}`, auth: `auth-${id}` } })
    };
    return subscription;
  };
  current = key && make(key);
  const pushManager = {
    getSubscription: vi.fn(async () => current),
    subscribe: vi.fn(async ({ applicationServerKey }: { applicationServerKey: Uint8Array }) => (current ??= make(applicationServerKey)))
  };
  return { pushManager, get current() { return current; }, drop() { current = null; } };
}

function install(service: ReturnType<typeof pushService>, { permission = 'granted', onLine = true, active = true } = {}) {
  vi.stubGlobal('navigator', {
    onLine,
    standalone: true,
    serviceWorker: { getRegistration: async () => ({ active: active ? {} : null, pushManager: service.pushManager }) }
  });
  vi.stubGlobal('PushManager', class {});
  vi.stubGlobal('Notification', { permission, requestPermission: vi.fn(async () => permission) });
}

function server(status = 200) {
  const fetch = vi.fn<typeof globalThis.fetch>(async () => new Response('{"ok":true}', { status }));
  vi.stubGlobal('fetch', fetch);
  return fetch;
}
const sent = (fetch: ReturnType<typeof server>) => fetch.mock.calls.map(([url, init]) => {
  expect(url).toBe(ENDPOINT);
  return JSON.parse(String(init?.body)) as Record<string, unknown>;
});
const subscribed = (subscription: FakeSubscription | null, preferredTime = '21:00', timeZone = 'Asia/Kuala_Lumpur') =>
  ({ action: 'subscribe', subscription: subscription?.toJSON(), preferredTime, timeZone });

function inZone(timeZone: string) {
  vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({ timeZone } as Intl.ResolvedDateTimeFormatOptions);
}

describe('keeping the server in step', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_PUSH_ENDPOINT', ENDPOINT);
    vi.stubEnv('VITE_VAPID_PUBLIC_KEY', base64Url(KEY));
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-24T12:00:00Z'));
    inZone('Asia/Kuala_Lumpur');
  });

  it('confirms once, then again only after a week', async () => {
    const service = pushService();
    install(service);
    const fetch = server();
    expect(await refreshPushSubscription('21:00')).toBe(true);
    expect(sent(fetch)).toEqual([subscribed(service.current)]);

    vi.setSystemTime(Date.now() + 6 * DAY);
    await refreshPushSubscription('21:00');
    expect(fetch).toHaveBeenCalledOnce();

    vi.setSystemTime(Date.now() + 2 * DAY);
    await refreshPushSubscription('21:00');
    expect(sent(fetch)).toEqual([subscribed(service.current), subscribed(service.current)]);
  });

  it('tells the server at once about a new time or time zone', async () => {
    const service = pushService();
    install(service);
    const fetch = server();
    await refreshPushSubscription('21:00');
    await refreshPushSubscription('06:30');
    inZone('Europe/London');
    await refreshPushSubscription('06:30');
    expect(sent(fetch)).toEqual([
      subscribed(service.current),
      subscribed(service.current, '06:30'),
      subscribed(service.current, '06:30', 'Europe/London')
    ]);
  });

  it('replaces a subscription made for an earlier key, and has the server forget it', async () => {
    const service = pushService(OLD_KEY);
    const old = service.current!;
    install(service);
    const fetch = server();
    await refreshPushSubscription('21:00');
    expect(old.unsubscribe).toHaveBeenCalledOnce();
    expect(service.pushManager.subscribe).toHaveBeenCalledWith({ userVisibleOnly: true, applicationServerKey: KEY });
    expect(service.current).not.toBe(old);
    expect(sent(fetch)).toEqual([{ action: 'unsubscribe', endpoint: old.endpoint }, subscribed(service.current)]);
  });

  it('subscribes again when the browser dropped its subscription, and has the server forget that one', async () => {
    const service = pushService();
    install(service);
    const fetch = server();
    await refreshPushSubscription('21:00');
    const dropped = service.current!;
    service.drop();
    await refreshPushSubscription('21:00');
    expect(service.current).not.toBeNull();
    expect(sent(fetch).slice(1)).toEqual([{ action: 'unsubscribe', endpoint: dropped.endpoint }, subscribed(service.current)]);
  });

  it('reports reminders off once notifications are switched off for the site, and tidies up', async () => {
    for (const permission of ['denied', 'default']) {
      const service = pushService();
      install(service);
      const fetch = server();
      await refreshPushSubscription('21:00');
      const confirmed = service.current!;

      install(service, { permission });
      expect(await refreshPushSubscription('21:00')).toBe(false);
      expect(confirmed.unsubscribe).toHaveBeenCalledOnce();
      expect(service.pushManager.subscribe).not.toHaveBeenCalled();
      expect(sent(fetch).slice(1)).toEqual([{ action: 'unsubscribe', endpoint: confirmed.endpoint }]);
      expect(localStorage.getItem('zikr-push-confirmed')).toBeNull();
    }
  });

  it('asks a server that refused again an hour later, not every time the app comes back', async () => {
    const service = pushService();
    install(service);
    const fetch = server(503);
    await refreshPushSubscription('21:00');
    await refreshPushSubscription('21:00');
    vi.setSystemTime(Date.now() + 59 * 60 * 1000);
    await refreshPushSubscription('21:00');
    expect(fetch).toHaveBeenCalledOnce();

    vi.setSystemTime(Date.now() + 2 * 60 * 1000);
    await refreshPushSubscription('21:00');
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('waits while offline or before the service worker runs, and never rejects', async () => {
    const service = pushService();
    const fetch = server();
    install(service, { onLine: false });
    expect(await refreshPushSubscription('21:00')).toBe(true);
    install(service, { active: false });
    expect(await refreshPushSubscription('21:00')).toBe(true);
    expect(fetch).not.toHaveBeenCalled();

    service.pushManager.getSubscription.mockRejectedValueOnce(new Error('broken'));
    install(service);
    expect(await refreshPushSubscription('21:00')).toBe(true);
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
    expect(await refreshPushSubscription('21:00')).toBe(true);
  });
});

describe('turning reminders on and off', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_PUSH_ENDPOINT', ENDPOINT);
    vi.stubEnv('VITE_VAPID_PUBLIC_KEY', base64Url(KEY));
    inZone('Asia/Kuala_Lumpur');
  });

  it('remembers what it told the server, so the next visit need not say it again', async () => {
    const service = pushService(null);
    install(service);
    const fetch = server();
    await enablePushNotifications('21:00');
    await refreshPushSubscription('21:00');
    expect(sent(fetch)).toEqual([subscribed(service.current)]);
  });

  it('drops a subscription it made when the server does not take it, and says so plainly', async () => {
    for (const fetch of [server(503), vi.fn(async () => { throw new TypeError('Failed to fetch'); })]) {
      vi.stubGlobal('fetch', fetch);
      const service = pushService(null);
      install(service);
      await expect(enablePushNotifications('21:00')).rejects.toThrow(i18n.t('pushRegisterFailed'));
      expect(service.pushManager.subscribe).toHaveBeenCalledOnce();
      expect(service.current).toBeNull();
      expect(localStorage.getItem('zikr-push-confirmed')).toBeNull();
    }
  });

  it('keeps a subscription that was already there when the server fails', async () => {
    const service = pushService();
    const existing = service.current!;
    install(service);
    server(503);
    await expect(enablePushNotifications('21:00')).rejects.toThrow(i18n.t('pushRegisterFailed'));
    expect(existing.unsubscribe).not.toHaveBeenCalled();
  });

  it('has the server forget the subscription it knows, even one the browser already dropped', async () => {
    const service = pushService();
    install(service);
    const fetch = server();
    await enablePushNotifications('21:00');
    const known = service.current!;
    service.drop();
    await disablePushNotifications();
    expect(sent(fetch).slice(1)).toEqual([{ action: 'unsubscribe', endpoint: known.endpoint }]);
    expect(localStorage.getItem('zikr-push-confirmed')).toBeNull();
  });
});
