import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { privacySignalSet, reportUsage } from './usage';
import { isStandalone } from '../services/platform';

vi.mock('../services/platform', () => ({ isStandalone: vi.fn(() => false), isAppleMobile: vi.fn(() => false) }));

const ENDPOINT = '/.netlify/functions/usage';
const ok = () => Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }));
const sent = () => vi.mocked(fetch).mock.calls.map(([, init]) => JSON.parse(String(init?.body)) as { id: string; kinds: string[] });
const define = (target: object, property: string, value: unknown) =>
  Object.defineProperty(target, property, { configurable: true, value });

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('fetch', vi.fn(ok));
  vi.mocked(isStandalone).mockReturnValue(false);
});
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });

describe('what gets reported', () => {
  it('reports only a visit before onboarding, and adds active after it', async () => {
    await reportUsage(true, false);
    expect(sent()[0].kinds).toEqual(['visit']);

    localStorage.clear();
    vi.mocked(fetch).mockClear();
    await reportUsage(true, true);
    expect(sent()[0].kinds).toEqual(['visit', 'active']);
  });

  it('adds standalone only for an installed app in use', async () => {
    vi.mocked(isStandalone).mockReturnValue(true);
    await reportUsage(true, true);
    expect(sent()[0].kinds).toEqual(['visit', 'active', 'standalone']);

    // Installed but not yet onboarded is a visit and nothing else.
    localStorage.clear();
    vi.mocked(fetch).mockClear();
    await reportUsage(true, false);
    expect(sent()[0].kinds).toEqual(['visit']);
  });

  it('adds reminders only for a browser in use with daily reminders on, as soon as they are', async () => {
    await reportUsage(true, true);
    await reportUsage(true, true, true);
    expect(sent().map((body) => body.kinds)).toEqual([['visit', 'active'], ['reminders']]);

    // Switched on before setup is finished is a visit and nothing else.
    localStorage.clear();
    vi.mocked(fetch).mockClear();
    await reportUsage(true, false, true);
    expect(sent()[0].kinds).toEqual(['visit']);
  });

  // The whole promise of the feature. If this ever fails, the endpoint is being handed
  // something it was built never to receive.
  it('sends nothing but a random identifier and those flags', async () => {
    await reportUsage(true, true);
    const [body] = sent();
    expect(Object.keys(body).sort()).toEqual(['id', 'kinds']);
    expect(body.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect(init?.credentials).toBe('omit');
    expect(vi.mocked(fetch).mock.calls[0][0]).toBe(ENDPOINT);
  });

  it('keeps the same identifier across reports, so a browser counts once', async () => {
    await reportUsage(true, false);
    localStorage.removeItem('zikr-usage-sent');
    await reportUsage(true, false);
    const [first, second] = sent();
    expect(second.id).toBe(first.id);
  });
});

describe('opened from a reminder', () => {
  // The marker is read once, as the app loads, so each case loads a fresh copy of the
  // module from the address it is about.
  const openedAt = async (address: string) => {
    window.history.replaceState(null, '', address);
    vi.resetModules();
    return (await import('./usage')).reportUsage;
  };
  afterEach(() => { vi.useRealTimers(); window.history.replaceState(null, '', '/'); });

  it('reports the open once the browser is in use, and takes the marker out of the address', async () => {
    const report = await openedAt('/?source=reminder&lang=tr');
    expect(window.location.search).toBe('?lang=tr');

    await report(true, false, true);
    await report(true, true, true);
    await report(true, true, true);
    expect(sent().map((body) => body.kinds)).toEqual([['visit'], ['active', 'reminders', 'reminded']]);
  });

  it('says nothing of a reminder for any other open', async () => {
    const report = await openedAt('/?source=pwa');
    expect(window.location.search).toBe('?source=pwa');
    await report(true, true, true);
    expect(sent()[0].kinds).toEqual(['visit', 'active', 'reminders']);
  });

  // A page left open overnight was opened from yesterday's reminder, not today's.
  it('counts the open on the UTC day it happened and no other', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-20T23:59:00Z'));
    const report = await openedAt('/?source=reminder');
    vi.setSystemTime(new Date('2026-09-21T00:01:00Z'));
    await report(true, true, true);
    expect(sent()[0].kinds).toEqual(['visit', 'active', 'reminders']);
  });
});

describe('when nothing should be sent', () => {
  it('sends nothing, and forgets the identifier, once switched off', async () => {
    await reportUsage(true, true);
    expect(localStorage.getItem('zikr-usage-id')).toBeTruthy();
    vi.mocked(fetch).mockClear();

    await reportUsage(false, true);
    expect(fetch).not.toHaveBeenCalled();
    expect(localStorage.getItem('zikr-usage-id')).toBeNull();
    expect(localStorage.getItem('zikr-usage-sent')).toBeNull();
  });

  it('honours Do Not Track and Global Privacy Control over the toggle', async () => {
    define(navigator, 'doNotTrack', '1');
    expect(privacySignalSet()).toBe(true);
    await reportUsage(true, true);
    expect(fetch).not.toHaveBeenCalled();

    define(navigator, 'doNotTrack', undefined);
    define(navigator, 'globalPrivacyControl', true);
    expect(privacySignalSet()).toBe(true);
    await reportUsage(true, true);
    expect(fetch).not.toHaveBeenCalled();

    define(navigator, 'globalPrivacyControl', undefined);
    expect(privacySignalSet()).toBe(false);
  });

  it('waits rather than reporting while offline or in a hidden tab', async () => {
    define(navigator, 'onLine', false);
    await reportUsage(true, true);
    expect(fetch).not.toHaveBeenCalled();
    define(navigator, 'onLine', true);

    define(document, 'visibilityState', 'hidden');
    await reportUsage(true, true);
    expect(fetch).not.toHaveBeenCalled();
    define(document, 'visibilityState', 'visible');
  });

  it('sits the count out when storage is unavailable, rather than reporting every tick', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('denied'); });
    await reportUsage(true, true);
    expect(fetch).not.toHaveBeenCalled();
    setItem.mockRestore();
  });
});

describe('sending each fact once a day', () => {
  it('does not send again for facts already reported today', async () => {
    await reportUsage(true, true);
    await reportUsage(true, true);
    await reportUsage(true, true);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('sends only the facts that are new since the last report', async () => {
    await reportUsage(true, false);
    vi.mocked(isStandalone).mockReturnValue(true);
    await reportUsage(true, true);
    expect(sent().map((body) => body.kinds)).toEqual([['visit'], ['active', 'standalone']]);
  });

  it('starts again when the UTC day rolls over', async () => {
    await reportUsage(true, true);
    const stored = JSON.parse(localStorage.getItem('zikr-usage-sent') ?? '{}') as { day: string };
    localStorage.setItem('zikr-usage-sent', JSON.stringify({ ...stored, day: '2000-01-01' }));
    await reportUsage(true, true);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('retries after a rejected or failed request rather than marking the day done', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('{"error":"nope"}', { status: 503 }));
    await reportUsage(true, true);
    expect(localStorage.getItem('zikr-usage-sent')).toBeNull();

    vi.mocked(fetch).mockRejectedValueOnce(new Error('offline'));
    await reportUsage(true, true);
    expect(localStorage.getItem('zikr-usage-sent')).toBeNull();

    await reportUsage(true, true);
    expect(localStorage.getItem('zikr-usage-sent')).toContain('active');
  });

  it('treats a 200 that is not an acknowledgement as a failure', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('{"ok":false}', { status: 200 }));
    await reportUsage(true, true);
    expect(localStorage.getItem('zikr-usage-sent')).toBeNull();
  });

  // Someone can switch it off while a request is in the air. The reply must not put an
  // identifier back that the opt-out just removed.
  it('does not resurrect the identifier if it was cleared mid-request', async () => {
    vi.mocked(fetch).mockImplementationOnce(async () => { localStorage.removeItem('zikr-usage-id'); return (await ok()); });
    await reportUsage(true, true);
    expect(localStorage.getItem('zikr-usage-sent')).toBeNull();
    expect(localStorage.getItem('zikr-usage-id')).toBeNull();
  });
});
