import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { generateVapidKeys } from '../lib/webpush.mjs';
import { decrypt, subscriber } from './support/subscriber.mjs';

/**
 * Turning reminders on and off, and the sender that runs every five minutes, against a
 * stand-in store that honours conditional writes the way Netlify Blobs does. Pushes go to
 * a stand-in fetch and are decrypted with the subscriber's own keys, so what the sender
 * puts on the wire is checked, not just that it called something.
 */

const blobs = new Map();
let etags = 0;
const fake = {
  get: vi.fn(async (key) => (blobs.has(key) ? JSON.parse(blobs.get(key).value) : null)),
  getWithMetadata: vi.fn(async (key) => (blobs.has(key) ? { data: JSON.parse(blobs.get(key).value), etag: blobs.get(key).etag, metadata: {} } : null)),
  setJSON: vi.fn(async (key, value, options = {}) => {
    const found = blobs.get(key);
    if ((options.onlyIfNew && found) || (options.onlyIfMatch && found?.etag !== options.onlyIfMatch)) return { modified: false };
    const etag = `"${++etags}"`;
    blobs.set(key, { value: JSON.stringify(value), etag });
    return { modified: true, etag };
  }),
  delete: vi.fn(async (key) => { blobs.delete(key); }),
  list: vi.fn(async ({ prefix = '' } = {}) => ({
    blobs: [...blobs].filter(([key]) => key.startsWith(prefix)).map(([key, { etag }]) => ({ key, etag })),
    directories: []
  }))
};
vi.mock('@netlify/blobs', () => ({ getStore: () => fake }));

const { default: handler, validSubscribe } = await import('../functions/push.mjs');
const { run } = await import('../functions/push-send.mjs');
const { sweep } = await import('../functions/push-sweep.mjs');
const { endpointHash, recordKey, scheduleKey } = await import('../lib/reminders.mjs');

const ORIGIN = 'https://myzikr.netlify.app';
const KL = 'Asia/Kuala_Lumpur';
const NEW_YORK = 'America/New_York';
const keys = generateVapidKeys();
const ENV = { VITE_VAPID_PUBLIC_KEY: keys.publicKey, VAPID_PRIVATE_KEY: keys.privateKey, VAPID_SUBJECT: 'mailto:hello@example.com' };

const post = (body, overrides = {}) => new Request(`${ORIGIN}/.netlify/functions/push`, {
  method: 'POST',
  headers: { origin: ORIGIN, 'content-type': 'application/json', ...overrides.headers },
  body: typeof body === 'string' ? body : JSON.stringify(body)
});
const subscribe = (browser, preferredTime = '21:00', timeZone = KL) =>
  handler(post({ action: 'subscribe', subscription: browser.subscription, preferredTime, timeZone }));
const unsubscribe = (endpoint) => handler(post({ action: 'unsubscribe', endpoint }));
const record = (browser) => fake.get(recordKey(endpointHash(browser.subscription.endpoint)));
const scheduled = () => [...blobs.keys()].filter((key) => key.startsWith('at/'));

/** A push service that answers every request with `status`, keeping what it was sent. */
function pushService(status = 201) {
  const fetch = vi.fn(async () => new Response(null, { status: typeof status === 'function' ? status() : status }));
  vi.stubGlobal('fetch', fetch);
  return fetch;
}
const delivered = (fetch, browser) => fetch.mock.calls
  .filter(([url]) => url === browser.subscription.endpoint)
  .map(([, init]) => ({ headers: init.headers, payload: JSON.parse(decrypt(init.body, browser)) }));

beforeEach(() => {
  blobs.clear();
  vi.clearAllMocks();
  Object.assign(process.env, ENV);
});
afterEach(() => {
  vi.unstubAllGlobals();
  for (const name of Object.keys(ENV)) delete process.env[name];
});

describe('turning reminders on', () => {
  it('keeps the subscription, the time and the zone, and nothing else', async () => {
    const browser = subscriber();
    const response = await subscribe(browser);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    const hash = endpointHash(browser.subscription.endpoint);
    expect(await record(browser)).toEqual({
      v: 1,
      subscription: { endpoint: browser.subscription.endpoint, keys: browser.subscription.keys },
      time: '21:00',
      timeZone: KL,
      lastSentDay: null
    });
    expect([...blobs.keys()].sort()).toEqual([scheduleKey('21:00', KL, hash), recordKey(hash)].sort());
    // Keyed by a hash, so a listing of the store never shows an endpoint.
    expect([...blobs.keys()].join()).not.toContain(browser.subscription.endpoint);
  });

  it('moves the reminder when the time or zone changes, leaving one entry', async () => {
    const browser = subscriber();
    const hash = endpointHash(browser.subscription.endpoint);
    await subscribe(browser, '21:00', KL);
    await subscribe(browser, '06:30', KL);
    expect(scheduled()).toEqual([scheduleKey('06:30', KL, hash)]);
    await subscribe(browser, '06:30', NEW_YORK);
    expect(scheduled()).toEqual([scheduleKey('06:30', NEW_YORK, hash)]);
    expect(await record(browser)).toMatchObject({ time: '06:30', timeZone: NEW_YORK });
  });

  it('accepts a subscription with or without an expiry, as browsers send it', async () => {
    const browser = subscriber();
    const { expirationTime, ...withoutExpiry } = browser.subscription;
    expect(expirationTime).toBeNull();
    expect((await handler(post({ action: 'subscribe', subscription: withoutExpiry, preferredTime: '21:00', timeZone: KL }))).status).toBe(200);
    expect((await handler(post({ action: 'subscribe', subscription: { ...withoutExpiry, expirationTime: 1_800_000_000_000 }, preferredTime: '21:00', timeZone: KL }))).status).toBe(200);
  });

  // The endpoint is the whole point of this function, and the sender POSTs to it daily.
  it('refuses a subscription pointing anywhere but a push service', async () => {
    for (const endpoint of ['https://169.254.169.254/latest/meta-data', 'https://example.com/hook', 'http://fcm.googleapis.com/fcm/send/x']) {
      const browser = subscriber(endpoint);
      expect((await subscribe(browser)).status, endpoint).toBe(400);
    }
    expect(blobs.size).toBe(0);
  });

  it('refuses a payload carrying anything it did not ask for', async () => {
    const { subscription } = subscriber();
    const good = { action: 'subscribe', subscription, preferredTime: '21:00', timeZone: KL };
    expect(validSubscribe(good)).toBe(true);
    for (const body of [
      { ...good, streak: 12 },
      { ...good, counts: { tasbih: 33 } },
      { ...good, subscription: { ...subscription, streak: 12 } },
      { ...good, subscription: { ...subscription, keys: { ...subscription.keys, extra: 'x' } } },
      { ...good, subscription: { ...subscription, expirationTime: 'soon' } },
      { ...good, preferredTime: '24:00' },
      { ...good, preferredTime: '9:00' },
      { ...good, timeZone: 'Mars/Olympus_Mons' },
      { ...good, timeZone: '../../etc' },
      { ...good, action: 'subscribed' },
      { action: 'subscribe', subscription, preferredTime: '21:00' },
      [good], null, 'subscribe', 42
    ]) {
      expect(validSubscribe(body), JSON.stringify(body)).toBe(false);
      expect((await handler(post(body))).status).toBe(400);
    }
    expect(blobs.size).toBe(0);
  });

  it('turns away requests that are not the app on this origin', async () => {
    const { subscription } = subscriber();
    const body = { action: 'subscribe', subscription, preferredTime: '21:00', timeZone: KL };
    expect((await handler(post(body, { headers: { origin: 'https://evil.test' } }))).status).toBe(403);
    expect((await handler(post(body, { headers: { origin: undefined } }))).status).toBe(403);
    expect((await handler(post(body, { headers: { 'content-type': 'text/plain' } }))).status).toBe(415);
    expect((await handler(post('x'.repeat(3000)))).status).toBe(413);
    expect((await handler(post('{not json'))).status).toBe(400);
    expect((await handler(new Request(`${ORIGIN}/.netlify/functions/push`, { method: 'GET' }))).status).toBe(405);
    expect(blobs.size).toBe(0);
  });

  // Otherwise the app would say reminders are on while nothing could ever send one.
  it('fails honestly while the site cannot send reminders', async () => {
    delete process.env.VAPID_PRIVATE_KEY;
    expect((await subscribe(subscriber())).status).toBe(503);
    process.env.VAPID_PRIVATE_KEY = generateVapidKeys().privateKey;
    expect((await subscribe(subscriber())).status).toBe(503);
    expect(blobs.size).toBe(0);
  });

  it('answers a store failure with a bare 503', async () => {
    fake.setJSON.mockRejectedValueOnce(new Error('blobs: internal detail'));
    const response = await subscribe(subscriber());
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('internal detail');
  });
});

describe('turning reminders off', () => {
  it('deletes the record and its entry', async () => {
    const browser = subscriber();
    await subscribe(browser);
    const response = await unsubscribe(browser.subscription.endpoint);
    expect(response.status).toBe(200);
    expect(blobs.size).toBe(0);
  });

  it('answers the same for an endpoint it never had, and works while sending is not set up', async () => {
    for (const name of Object.keys(ENV)) delete process.env[name];
    const response = await unsubscribe(subscriber().subscription.endpoint);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it('refuses anything but a push endpoint', async () => {
    expect((await handler(post({ action: 'unsubscribe', endpoint: 'https://example.com/' }))).status).toBe(400);
    expect((await handler(post({ action: 'unsubscribe', endpoint: subscriber().subscription.endpoint, why: 'x' }))).status).toBe(400);
  });
});

describe('sending', () => {
  // 21:00 in Kuala Lumpur (UTC+8) is 13:00 UTC.
  const at = (iso) => new Date(iso);

  it('sends at the chosen local time, once, with only the day in the message', async () => {
    const fetch = pushService();
    const browser = subscriber();
    await subscribe(browser);

    expect(await run(at('2026-09-24T12:55:00Z'), ENV)).toMatchObject({ due: 0, sent: 0 });
    expect(await run(at('2026-09-24T13:00:00Z'), ENV)).toMatchObject({ due: 1, sent: 1 });
    const [push] = delivered(fetch, browser);
    expect(push.payload).toEqual({ v: 1, day: '2026-09-24' });
    // Worth delivering only until the local day it is about ends: three hours after 21:00.
    expect(push.headers).toMatchObject({ TTL: '10800', Urgency: 'high', Topic: 'zikr-daily' });
    expect(await record(browser)).toMatchObject({ lastSentDay: '2026-09-24' });

    expect(await run(at('2026-09-24T13:05:00Z'), ENV)).toMatchObject({ due: 1, sent: 0, repeat: 1 });
    expect(await run(at('2026-09-24T13:31:00Z'), ENV)).toMatchObject({ due: 0 });
    expect(fetch).toHaveBeenCalledTimes(1);

    expect(await run(at('2026-09-25T13:02:00Z'), ENV)).toMatchObject({ sent: 1 });
    expect(delivered(fetch, browser).map((sent) => sent.payload.day)).toEqual(['2026-09-24', '2026-09-25']);
  });

  it('reads the time on the wall clock of the zone it was set in', async () => {
    const fetch = pushService();
    const browser = subscriber();
    await subscribe(browser, '07:30', NEW_YORK);
    expect(await run(at('2026-09-24T07:30:00Z'), ENV)).toMatchObject({ due: 0 });
    expect(await run(at('2026-09-24T11:30:00Z'), ENV)).toMatchObject({ sent: 1 });
    expect(delivered(fetch, browser)[0].payload.day).toBe('2026-09-24');
  });

  it('follows the time to wherever it was moved, and does not remind twice for one day', async () => {
    const fetch = pushService();
    const browser = subscriber();
    await subscribe(browser, '21:00');
    await subscribe(browser, '06:00');
    expect(await run(at('2026-09-24T13:00:00Z'), ENV)).toMatchObject({ due: 0 });
    // 06:00 on the 25th in Kuala Lumpur.
    expect(await run(at('2026-09-24T22:00:00Z'), ENV)).toMatchObject({ sent: 1 });
    await subscribe(browser, '21:00');
    expect(await record(browser)).toMatchObject({ time: '21:00', lastSentDay: '2026-09-25' });
    expect(await run(at('2026-09-25T13:00:00Z'), ENV)).toMatchObject({ due: 1, repeat: 1 });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('forgets a subscription the push service says is gone', async () => {
    for (const status of [404, 410]) {
      pushService(status);
      await subscribe(subscriber());
      expect(await run(at('2026-09-24T13:00:00Z'), ENV)).toMatchObject({ gone: 1 });
      expect(blobs.size).toBe(0);
    }
  });

  it('tries again on the next run when the push service fails or cannot be reached', async () => {
    const browser = subscriber();
    await subscribe(browser);
    pushService(503);
    expect(await run(at('2026-09-24T13:00:00Z'), ENV)).toMatchObject({ failed: 1 });
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('fetch failed'); }));
    expect(await run(at('2026-09-24T13:05:00Z'), ENV)).toMatchObject({ failed: 1 });
    expect(await record(browser)).toMatchObject({ lastSentDay: null });
    const fetch = pushService(201);
    expect(await run(at('2026-09-24T13:10:00Z'), ENV)).toMatchObject({ sent: 1 });
    expect(delivered(fetch, browser)).toHaveLength(1);
  });

  // 21:00 in Kuala Lumpur on the nth day after the 24th.
  const evening = (n, minutes = 0) => new Date(Date.UTC(2026, 8, 24 + n, 13, minutes));

  it('gives up on a subscription its push service refuses every day for a month', async () => {
    const browser = subscriber();
    await subscribe(browser);
    const fetch = pushService(403);
    for (let n = 0; n < 29; n++) {
      expect(await run(evening(n), ENV)).toMatchObject({ failed: 1 });
      // Tried again inside the window, but counted once for the day.
      expect(await run(evening(n, 5), ENV)).toMatchObject({ failed: 1 });
    }
    expect(await record(browser)).toMatchObject({ refusals: 29 });
    expect(await run(evening(29), ENV)).toMatchObject({ gone: 1 });
    expect(blobs.size).toBe(0);
    expect(fetch).toHaveBeenCalledTimes(59);
  });

  it('starts that count again after a delivery, or when the browser confirms it is still there', async () => {
    const browser = subscriber();
    await subscribe(browser);
    let status = 403;
    pushService(() => status);
    for (let n = 0; n < 29; n++) await run(evening(n), ENV);
    status = 201;
    expect(await run(evening(29), ENV)).toMatchObject({ sent: 1 });
    expect(await record(browser)).not.toHaveProperty('refusals');

    status = 403;
    for (let n = 30; n < 59; n++) await run(evening(n), ENV);
    await subscribe(browser);
    expect(await record(browser)).not.toHaveProperty('refusals');
    for (let n = 59; n < 88; n++) await run(evening(n), ENV);
    expect(await record(browser)).toMatchObject({ refusals: 29 });
  });

  it('drops entries left behind, without touching the record they no longer match', async () => {
    const fetch = pushService();
    const browser = subscriber();
    await subscribe(browser, '06:00');
    const hash = endpointHash(browser.subscription.endpoint);
    const orphan = endpointHash('https://fcm.googleapis.com/fcm/send/gone');
    await fake.setJSON(scheduleKey('21:00', KL, hash), {});
    await fake.setJSON(scheduleKey('21:00', KL, orphan), {});
    expect(await run(at('2026-09-24T13:00:00Z'), ENV)).toMatchObject({ due: 2, stale: 2, sent: 0 });
    expect(scheduled()).toEqual([scheduleKey('06:00', KL, hash)]);
    expect(await record(browser)).toMatchObject({ time: '06:00' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('never sends to a stored endpoint that is not a push service', async () => {
    const fetch = pushService();
    const hash = endpointHash('https://example.com/hook');
    const { subscription } = subscriber('https://example.com/hook');
    await fake.setJSON(recordKey(hash), { v: 1, subscription, time: '21:00', timeZone: KL, lastSentDay: null });
    await fake.setJSON(scheduleKey('21:00', KL, hash), {});
    expect(await run(at('2026-09-24T13:00:00Z'), ENV)).toMatchObject({ stale: 1, sent: 0 });
    expect(fetch).not.toHaveBeenCalled();
    expect(blobs.size).toBe(0);
  });

  it('keeps at most ten sends in flight, and reaches everyone due', async () => {
    let inFlight = 0;
    let most = 0;
    vi.stubGlobal('fetch', vi.fn(async () => {
      most = Math.max(most, ++inFlight);
      await new Promise((resolve) => setTimeout(resolve, 5));
      inFlight -= 1;
      return new Response(null, { status: 201 });
    }));
    for (let index = 0; index < 25; index++) await subscribe(subscriber());
    expect(await run(at('2026-09-24T13:00:00Z'), ENV)).toMatchObject({ due: 25, sent: 25 });
    expect(most).toBe(10);
  });

  it('leaves what it has no time for to the next run', async () => {
    const fetch = pushService();
    await subscribe(subscriber());
    expect(await run(at('2026-09-24T13:00:00Z'), ENV, { budgetMs: 0 })).toMatchObject({ due: 1, deferred: 1, sent: 0 });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('reports a missing or mismatched key pair instead of sending', async () => {
    const fetch = pushService();
    await subscribe(subscriber());
    expect(await run(at('2026-09-24T13:00:00Z'), {})).toEqual({ error: expect.stringMatching(/not set up/) });
    expect(await run(at('2026-09-24T13:00:00Z'), { ...ENV, VAPID_SUBJECT: 'hello' })).toEqual({ error: expect.stringMatching(/VAPID_SUBJECT/) });
    const mismatched = await run(at('2026-09-24T13:00:00Z'), { ...ENV, VAPID_PRIVATE_KEY: generateVapidKeys().privateKey });
    expect(mismatched).toEqual({ error: expect.stringMatching(/private half/) });
    expect(JSON.stringify(mismatched)).not.toContain(ENV.VITE_VAPID_PUBLIC_KEY);
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('the daily sweep', () => {
  it('schedules again a record that lost its entry, which is then reminded as usual', async () => {
    const fetch = pushService();
    const browser = subscriber();
    await subscribe(browser);
    blobs.delete(scheduled()[0]);
    expect(await sweep(fake)).toEqual({ records: 1, rescheduled: 1, removed: 0 });
    expect(await run(new Date('2026-09-24T13:00:00Z'), ENV)).toMatchObject({ sent: 1 });
    expect(delivered(fetch, browser)).toHaveLength(1);
  });

  it('leaves scheduled records alone, and deletes one that cannot be scheduled', async () => {
    await subscribe(subscriber());
    const broken = recordKey(endpointHash('https://fcm.googleapis.com/fcm/send/broken'));
    await fake.setJSON(broken, { v: 1, time: 'whenever', timeZone: KL });
    const before = [...blobs.keys()].filter((key) => key !== broken).sort();
    expect(await sweep(fake)).toEqual({ records: 2, rescheduled: 0, removed: 1 });
    expect([...blobs.keys()].sort()).toEqual(before);
  });
});
