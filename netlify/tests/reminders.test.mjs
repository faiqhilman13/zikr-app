import { describe, expect, it, vi } from 'vitest';
import { generateVapidKeys } from '../lib/webpush.mjs';
import { due, endpointHash, localClock, parseScheduleKey, scheduleKey, update, validTime, validZone, vapidFromEnv } from '../lib/reminders.mjs';

const KL = 'Asia/Kuala_Lumpur';
const HASH = endpointHash('https://fcm.googleapis.com/fcm/send/abc');

describe('when a reminder is due', () => {
  it('opens at the chosen minute and stays open for thirty', () => {
    expect(due('21:00', KL, new Date('2026-09-24T12:59:59Z'))).toBeNull();
    expect(due('21:00', KL, new Date('2026-09-24T13:00:00Z'))).toEqual({ day: '2026-09-24', ttl: 10_800 });
    expect(due('21:00', KL, new Date('2026-09-24T13:29:59Z'))).toMatchObject({ day: '2026-09-24' });
    expect(due('21:00', KL, new Date('2026-09-24T13:30:00Z'))).toBeNull();
  });

  // Runs are five minutes apart, so a later minute would fall after the day's last run.
  it('brings the last minutes of the day forward to the last run', () => {
    expect(due('23:59', KL, new Date('2026-09-24T15:55:00Z'))).toMatchObject({ day: '2026-09-24', ttl: 300 });
    expect(due('23:57', KL, new Date('2026-09-24T15:59:00Z'))).toMatchObject({ day: '2026-09-24', ttl: 60 });
  });

  it('counts the day, and the time left in it, on the local clock', () => {
    // 00:10 in Kuala Lumpur is still the evening before in UTC.
    expect(due('00:05', KL, new Date('2026-09-24T16:10:00Z'))).toEqual({ day: '2026-09-25', ttl: 85_800 });
    expect(due('21:00', 'Asia/Kolkata', new Date('2026-09-24T15:30:00Z'))).toMatchObject({ day: '2026-09-24' });
    expect(due('21:00', 'Asia/Kolkata', new Date('2026-09-24T15:00:00Z'))).toBeNull();
  });

  // New York leaves daylight saving on 1 November 2026: 07:30 moves from 11:30 to 12:30 UTC.
  it('follows daylight saving', () => {
    expect(due('07:30', 'America/New_York', new Date('2026-10-31T11:30:00Z'))).toMatchObject({ day: '2026-10-31' });
    expect(due('07:30', 'America/New_York', new Date('2026-11-01T11:30:00Z'))).toBeNull();
    expect(due('07:30', 'America/New_York', new Date('2026-11-01T12:30:00Z'))).toMatchObject({ day: '2026-11-01' });
  });

  it('reads midnight as hour zero', () => {
    expect(localClock('UTC', new Date('2026-09-24T00:00:05Z'))).toEqual({ day: '2026-09-24', seconds: 5 });
  });
});

describe('schedule keys', () => {
  it('round-trip the time, the zone and the subscription', () => {
    for (const zone of [KL, 'UTC', 'America/Argentina/Buenos_Aires', 'Etc/GMT+5']) {
      expect(parseScheduleKey(scheduleKey('06:05', zone, HASH))).toEqual({ time: '06:05', timeZone: zone, hash: HASH });
    }
  });

  it('refuse anything this code did not write', () => {
    const good = scheduleKey('21:00', KL, HASH);
    const [, , zone] = good.split('/');
    for (const key of [
      `sub/2100/${zone}/${HASH}`,
      `at/2460/${zone}/${HASH}`,
      `at/21:00/${zone}/${HASH}`,
      `at/2100/${zone}/${HASH.slice(1)}`,
      `at/2100/${zone}/${HASH}/extra`,
      `at/2100/${Buffer.from('Mars/Olympus_Mons').toString('base64url')}/${HASH}`,
      'at/2100', '', 'at'
    ]) expect(parseScheduleKey(key), key).toBeNull();
  });
});

describe('what a subscription may ask for', () => {
  it('accepts a 24-hour HH:MM time only', () => {
    for (const time of ['00:00', '09:05', '23:59']) expect(validTime(time)).toBe(true);
    for (const time of ['24:00', '9:05', '09:5', '21:00:00', 'nine', 2100, null]) expect(validTime(time)).toBe(false);
  });

  it('accepts real zones only', () => {
    for (const zone of [KL, 'UTC', 'Europe/Istanbul', 'Etc/GMT-14']) expect(validZone(zone)).toBe(true);
    for (const zone of ['Mars/Olympus_Mons', '', 'A'.repeat(65), '../etc/passwd', 'UTC; rm -rf', null, 8]) expect(validZone(zone)).toBe(false);
  });
});

describe('updating a record', () => {
  /** A store whose record changes under the reader for the first `races` reads. */
  function racingStore(races) {
    let version = 1;
    let value = { lastSentDay: null, time: '21:00' };
    return {
      getWithMetadata: vi.fn(async () => {
        const read = { data: { ...value }, etag: String(version), metadata: {} };
        if (races-- > 0) { version += 1; value = { ...value, time: `0${version}:00` }; }
        return read;
      }),
      setJSON: vi.fn(async (key, next, { onlyIfMatch }) => {
        if (onlyIfMatch !== String(version)) return { modified: false };
        version += 1;
        value = next;
        return { modified: true };
      }),
      get value() { return value; }
    };
  }

  it('reads again when another write lands first, so neither is lost', async () => {
    const store = racingStore(1);
    await update(store, 'sub/x', (record) => ({ ...record, lastSentDay: '2026-09-24' }));
    expect(store.getWithMetadata).toHaveBeenCalledTimes(2);
    expect(store.value).toEqual({ lastSentDay: '2026-09-24', time: '02:00' });
  });

  it('gives up rather than loop forever', async () => {
    const store = racingStore(10);
    await expect(update(store, 'sub/x', (record) => record)).rejects.toThrow(/kept changing/);
    expect(store.setJSON).toHaveBeenCalledTimes(3);
  });

  it('creates only if still absent, and writes nothing when there is nothing to change', async () => {
    const store = { getWithMetadata: vi.fn(async () => null), setJSON: vi.fn(async () => ({ modified: true })) };
    await update(store, 'sub/x', () => ({ v: 1 }));
    expect(store.setJSON).toHaveBeenCalledWith('sub/x', { v: 1 }, { onlyIfNew: true });
    store.setJSON.mockClear();
    expect(await update(store, 'sub/x', () => undefined)).toEqual({ previous: null, next: null });
    expect(store.setJSON).not.toHaveBeenCalled();
  });
});

describe('the VAPID identity', () => {
  const keys = generateVapidKeys();
  const env = { VITE_VAPID_PUBLIC_KEY: keys.publicKey, VAPID_PRIVATE_KEY: keys.privateKey, VAPID_SUBJECT: 'mailto:hello@example.com' };

  it('comes from the environment when both halves and a contact are there', () => {
    expect(vapidFromEnv(env)).toEqual({ vapid: { publicKey: keys.publicKey, privateKey: keys.privateKey, subject: 'mailto:hello@example.com' } });
    expect(vapidFromEnv({ ...env, VAPID_SUBJECT: 'https://myzikr.netlify.app' }).vapid).toBeTruthy();
    // Padding and surrounding space from a copy and paste are forgiven.
    expect(vapidFromEnv({ ...env, VITE_VAPID_PUBLIC_KEY: ` ${keys.publicKey}= ` }).vapid?.publicKey).toBe(keys.publicKey);
  });

  it('says what is wrong, without repeating a key', () => {
    const problems = [
      vapidFromEnv({}),
      vapidFromEnv({ ...env, VAPID_PRIVATE_KEY: '' }),
      vapidFromEnv({ ...env, VAPID_SUBJECT: 'hello@example.com' }),
      vapidFromEnv({ ...env, VAPID_SUBJECT: 'http://example.com' }),
      vapidFromEnv({ ...env, VAPID_PRIVATE_KEY: generateVapidKeys().privateKey })
    ];
    for (const result of problems) {
      expect(result.vapid).toBeUndefined();
      expect(result.problem).toEqual(expect.any(String));
      expect(result.problem).not.toContain(keys.publicKey);
      expect(result.problem).not.toContain(keys.privateKey);
    }
  });
});
