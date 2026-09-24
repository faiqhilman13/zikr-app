import { getStore } from '@netlify/blobs';
import { createHash } from 'node:crypto';
import { keysMatch } from './webpush.mjs';

/**
 * Where daily reminders live, and the clock arithmetic for sending them.
 *
 * One record per subscription, `sub/<hash of endpoint>`, is the truth: the push endpoint
 * and its keys, the wall-clock time and zone to remind at, and the last local day a
 * reminder went out. Beside each sits an empty schedule entry, `at/<HHMM>/<zone>/<hash>`,
 * so the sender finds who is due from one listing without opening every record. Entries
 * are hints: the sender checks each against its record and drops any a later change
 * left behind, so a subscription can never be reminded twice or at an old time.
 *
 * Nothing else is kept. No count, phrase or streak reaches the server; the service worker
 * works out what the reminder says from what is already on the device.
 */

export const STORE = 'zikr-push-v1';
export const store = () => getStore({ name: STORE, consistency: 'strong' });

const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;
const ZONE = /^[A-Za-z0-9_+\-/]{1,64}$/;
/** The sender runs every five minutes, so a later time would fall after its last run of the day. */
const LAST_MINUTE = 23 * 60 + 55;
/** How long after the chosen time a reminder can still go out, for runs that start late. */
export const WINDOW_MINUTES = 30;

export const validTime = (value) => typeof value === 'string' && TIME.test(value);

const SUBJECT = /^(mailto:\S+@\S+|https:\/\/\S+)$/;

/**
 * The VAPID identity reminders are sent under, read from the site's environment, or what
 * is wrong with it. The public half is the one the app subscribes with, so a private key
 * from another pair is caught here instead of being refused by every push service in turn.
 * The key values never appear in what this returns about a problem.
 */
export function vapidFromEnv(env) {
  const publicKey = env.VITE_VAPID_PUBLIC_KEY?.trim();
  const privateKey = env.VAPID_PRIVATE_KEY?.trim();
  const subject = env.VAPID_SUBJECT?.trim();
  if (!publicKey && !privateKey && !subject) return { problem: 'Reminders are not set up: VITE_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY and VAPID_SUBJECT are unset' };
  if (!publicKey || !privateKey || !subject) return { problem: 'VITE_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY and VAPID_SUBJECT must all be set' };
  if (!SUBJECT.test(subject)) return { problem: 'VAPID_SUBJECT must be a mailto: address or an https:// URL' };
  if (!keysMatch(publicKey, privateKey)) return { problem: 'VAPID_PRIVATE_KEY is not the private half of VITE_VAPID_PUBLIC_KEY' };
  // Push services read the key in the Authorization header as unpadded base64url.
  return { vapid: { publicKey: Buffer.from(publicKey, 'base64url').toString('base64url'), privateKey, subject } };
}

/**
 * One wall-clock formatter per zone. Building them is the slow part of reading a clock and
 * every run reads one per reminder, so each is made once. Only zones that construct are
 * kept, and the cache starts over rather than grow without end.
 */
const clocks = new Map();
function clockFor(timeZone) {
  let clock = clocks.get(timeZone);
  if (!clock) {
    clock = new Intl.DateTimeFormat('en-US', {
      timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
    if (clocks.size >= 1000) clocks.clear();
    clocks.set(timeZone, clock);
  }
  return clock;
}

export function validZone(value) {
  if (typeof value !== 'string' || !ZONE.test(value)) return false;
  try {
    clockFor(value);
    return true;
  } catch {
    return false;
  }
}

export const endpointHash = (endpoint) => createHash('sha256').update(endpoint).digest('hex');
export const recordKey = (hash) => `sub/${hash}`;
export const scheduleKey = (time, zone, hash) => `at/${time.replace(':', '')}/${Buffer.from(zone).toString('base64url')}/${hash}`;

export function parseScheduleKey(key) {
  const [prefix, hhmm, zone, hash, ...rest] = key.split('/');
  if (prefix !== 'at' || rest.length || !/^\d{4}$/.test(hhmm ?? '') || !/^[0-9a-f]{64}$/.test(hash ?? '')) return null;
  const time = `${hhmm.slice(0, 2)}:${hhmm.slice(2)}`;
  const timeZone = Buffer.from(zone ?? '', 'base64url').toString();
  return validTime(time) && validZone(timeZone) ? { time, timeZone, hash } : null;
}

/** The local date, and seconds into it, on the wall clock of `timeZone`. */
export function localClock(timeZone, now = new Date()) {
  const parts = Object.fromEntries(clockFor(timeZone).formatToParts(now).map(({ type, value }) => [type, value]));
  return { day: `${parts.year}-${parts.month}-${parts.day}`, seconds: Number(parts.hour) * 3600 + Number(parts.minute) * 60 + Number(parts.second) };
}

/** Whether a reminder set for `time` is due now, and if so for which local day and until when. */
export function due(time, timeZone, now = new Date()) {
  const [hours, minutes] = time.split(':').map(Number);
  const at = Math.min(hours * 60 + minutes, LAST_MINUTE) * 60;
  const clock = localClock(timeZone, now);
  const since = clock.seconds - at;
  if (since < 0 || since >= WINDOW_MINUTES * 60) return null;
  // Worth delivering only until the day it is about ends.
  return { day: clock.day, ttl: Math.max(60, 86_400 - clock.seconds) };
}

/**
 * Read, change and write back one record without losing a write that landed in between:
 * the sender stamping the day it reminded, say, while the same browser re-subscribes. The
 * write only lands on the version that was read, and a lost race reads again. `change`
 * returns the new record, or undefined to leave it as it is.
 */
export async function update(reminders, key, change, attempts = 3) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const found = await reminders.getWithMetadata(key, { type: 'json' });
    const previous = found?.data ?? null;
    const next = change(previous);
    if (next === undefined) return { previous, next: previous };
    const { modified } = await reminders.setJSON(key, next, found ? { onlyIfMatch: found.etag } : { onlyIfNew: true });
    if (modified) return { previous, next };
  }
  throw new Error('Record kept changing');
}
