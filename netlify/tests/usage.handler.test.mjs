import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Exercises the request handling itself against a stand-in store, so the checks that keep
 * practice data and strangers out are tested as HTTP rather than as functions someone
 * remembered to call.
 */

const blobs = new Map();
const writes = [];
const fake = {
  setJSON: vi.fn(async (key, value, options) => {
    writes.push({ key, options });
    if (options?.onlyIfNew && blobs.has(key)) return { modified: false };
    blobs.set(key, value);
    return { modified: true };
  }),
  delete: vi.fn(async (key) => { blobs.delete(key); }),
  list: vi.fn(async ({ prefix } = {}) => ({
    blobs: [...blobs.keys()].filter((key) => !prefix || key.startsWith(prefix)).map((key) => ({ key })),
    directories: []
  }))
};
vi.mock('@netlify/blobs', () => ({ getStore: () => fake }));

const { default: handler } = await import('../functions/usage.mjs');
const { default: cleanup } = await import('../functions/usage-cleanup.mjs');

const ORIGIN = 'https://myzikr.netlify.app';
const ID = 'd1f0a2b4-1c3e-4a5b-8c7d-9e0f1a2b3c4d';
const post = (body, overrides = {}) => new Request(`${ORIGIN}/.netlify/functions/usage`, {
  method: 'POST',
  headers: { origin: ORIGIN, 'content-type': 'application/json', ...overrides.headers },
  body: typeof body === 'string' ? body : JSON.stringify(body),
  ...overrides.init
});
const get = (key) => new Request(`${ORIGIN}/.netlify/functions/usage`, {
  method: 'GET', headers: key ? { authorization: `Bearer ${key}` } : {}
});

beforeEach(() => { blobs.clear(); writes.length = 0; vi.clearAllMocks(); process.env.ANALYTICS_ADMIN_KEY = 'test-key'; });

describe('collecting', () => {
  it('stores one record per kind and answers ok', async () => {
    const response = await handler(post({ id: ID, kinds: ['visit', 'active'] }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect([...blobs.keys()].map((key) => key.split('/').slice(1).join('/')).sort())
      .toEqual([`active/${ID}`, `visit/${ID}`]);
  });

  // The client retries on every tick and across tabs; the store must not inflate because
  // of it, so every write is conditional.
  it('writes each record only if new, so a repeat cannot double a count', async () => {
    await handler(post({ id: ID, kinds: ['visit'] }));
    await handler(post({ id: ID, kinds: ['visit'] }));
    // Repeating a fact inside one report is refused outright.
    expect((await handler(post({ id: ID, kinds: ['visit', 'visit'] }))).status).toBe(400);
    expect(blobs.size).toBe(1);
    expect(writes.every((write) => write.options?.onlyIfNew === true)).toBe(true);
  });

  it('turns away a request that is not the app on this origin', async () => {
    expect((await handler(post({ id: ID, kinds: ['visit'] }, { headers: { origin: 'https://evil.test' } }))).status).toBe(403);
    expect((await handler(post({ id: ID, kinds: ['visit'] }, { headers: { origin: undefined } }))).status).toBe(403);
    expect(blobs.size).toBe(0);
  });

  it('refuses anything but JSON, and anything oversized', async () => {
    expect((await handler(post({ id: ID, kinds: ['visit'] }, { headers: { 'content-type': 'text/plain' } }))).status).toBe(415);
    expect((await handler(post('x'.repeat(600)))).status).toBe(413);
    expect((await handler(post('{not json'))).status).toBe(400);
    expect(blobs.size).toBe(0);
  });

  it('refuses a payload carrying practice data rather than storing what it recognises', async () => {
    const response = await handler(post({ id: ID, kinds: ['visit'], counts: { tasbih: 33 } }));
    expect(response.status).toBe(400);
    expect(blobs.size).toBe(0);
  });

  it('answers 405 to any other method', async () => {
    for (const method of ['PUT', 'DELETE', 'PATCH']) {
      expect((await handler(new Request(`${ORIGIN}/.netlify/functions/usage`, { method }))).status).toBe(405);
    }
  });

  it('reports a storage failure as unavailable, without a stack trace', async () => {
    fake.setJSON.mockRejectedValueOnce(new Error('blobs are down at /var/task/usage.mjs:42'));
    const response = await handler(post({ id: ID, kinds: ['visit'] }));
    expect(response.status).toBe(503);
    expect(JSON.stringify(await response.json())).not.toMatch(/var\/task|Error:/);
  });
});

describe('the dashboard read', () => {
  it('refuses without the key, with the wrong key, and when no key is configured', async () => {
    expect((await handler(get())).status).toBe(401);
    expect((await handler(get('wrong'))).status).toBe(401);
    delete process.env.ANALYTICS_ADMIN_KEY;
    expect((await handler(get('test-key'))).status).toBe(401);
  });

  it('summarises what was collected', async () => {
    await handler(post({ id: ID, kinds: ['visit', 'active', 'standalone', 'reminders', 'reminded'] }));
    const response = await handler(get('test-key'));
    expect(response.status).toBe(200);
    const report = await response.json();
    expect(report).toMatchObject({ visitors: 1, activeToday: 1, standalone: 1, reminders7d: 1, reminded7d: 1, timezone: 'UTC' });
    expect(report.daily).toHaveLength(30);
    expect(report.daily.at(-1)).toMatchObject({ active: 1, reminders: 1, reminded: 1 });
  });

  // Ten seconds is the whole budget, so the read asks for the days it shows and no more.
  it('reads one prefix per reported day rather than scanning the store', async () => {
    await handler(get('test-key'));
    expect(fake.list).toHaveBeenCalledTimes(30);
    for (const [options] of fake.list.mock.calls) expect(options.prefix).toMatch(/^\d{4}-\d{2}-\d{2}\/$/);
  });

  it('never sets a cacheable response on either verb', async () => {
    for (const response of [await handler(get('test-key')), await handler(post({ id: ID, kinds: ['visit'] }))]) {
      expect(response.headers.get('cache-control')).toBe('no-store');
    }
  });
});

describe('the nightly sweep', () => {
  it('deletes what has aged out and leaves the reported window alone', async () => {
    const day = (offset) => new Date(Date.now() - offset * 86_400_000).toISOString().slice(0, 10);
    blobs.set(`${day(0)}/visit/${ID}`, { v: 1 });
    blobs.set(`${day(89)}/visit/${ID}`, { v: 1 });
    blobs.set(`${day(90)}/visit/${ID}`, { v: 1 });
    blobs.set(`${day(119)}/visit/${ID}`, { v: 1 });

    const response = await cleanup();
    await expect(response.json()).resolves.toEqual({ deleted: 2 });
    expect([...blobs.keys()].sort()).toEqual([`${day(89)}/visit/${ID}`, `${day(0)}/visit/${ID}`].sort());
  });
});
