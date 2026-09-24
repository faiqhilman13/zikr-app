import { isPushEndpoint, sendPush, validKeys } from '../lib/webpush.mjs';
import { due, parseScheduleKey, recordKey, store, update, vapidFromEnv } from '../lib/reminders.mjs';

/**
 * Every five minutes, sends the daily reminder to each browser whose chosen time has come.
 *
 * One listing of the schedule finds who is due. Each is checked against its record before
 * anything is sent and stamped with its local day after, so a browser gets at most one
 * reminder a day however runs retry. The message holds only the day it is for: what the
 * reminder says is worked out on the device, from the practice already there.
 */

const CONCURRENCY = 10;
/** No new sends after this, so the last ones finish inside the thirty seconds a scheduled run gets. */
const BUDGET_MS = 20_000;
const SEND_TIMEOUT_MS = 8_000;
/** Refused by its push service on this many days in a row, a subscription is taken for dead. */
const GIVE_UP_DAYS = 30;

/** Deletes a subscription entirely: the record, then its schedule entry. */
async function forget(reminders, entry) {
  await reminders.delete(recordKey(entry.hash));
  await reminders.delete(entry.key);
}

/**
 * Counts the days a push service has turned this subscription away. One a browser dropped
 * is usually answered 404 or 410, but not always: a subscription made for an earlier
 * signing key is refused for as long as it is tried. A month of refusals, with no delivery
 * and no word from the browser between them, is taken as the end of it. Anyone still using
 * the app confirms their subscription weekly, which clears the count, so this only ever
 * removes a subscription nobody is behind.
 */
async function refused(reminders, entry, day) {
  const { next } = await update(reminders, recordKey(entry.hash), (current) => {
    if (!current || current.refusedDay === day) return undefined;
    return { ...current, refusedDay: day, refusals: (Number.isInteger(current.refusals) ? current.refusals : 0) + 1 };
  });
  if (!(next?.refusals >= GIVE_UP_DAYS)) return 'failed';
  await forget(reminders, entry);
  return 'gone';
}

async function remind(reminders, entry, { day, ttl }, vapid) {
  const record = await reminders.get(recordKey(entry.hash), { type: 'json' });
  // Switched off, or moved to another time or zone since this entry was written.
  if (!record || record.time !== entry.time || record.timeZone !== entry.timeZone) {
    await reminders.delete(entry.key);
    return 'stale';
  }
  // Only ever written after the same checks, but nothing is sent anywhere else regardless.
  if (!isPushEndpoint(record.subscription?.endpoint) || !validKeys(record.subscription?.keys)) {
    await forget(reminders, entry);
    return 'stale';
  }
  if (record.lastSentDay === day) return 'repeat';

  let status;
  try {
    status = await sendPush(record.subscription, { v: 1, day }, { vapid, ttl, topic: 'zikr-daily', urgency: 'high', signal: AbortSignal.timeout(SEND_TIMEOUT_MS) });
  } catch {
    return 'failed';
  }
  // The browser has let the subscription go, so nothing about it is worth keeping.
  if (status === 404 || status === 410) {
    await forget(reminders, entry);
    return 'gone';
  }
  // Tried again on the next run, while the reminder is still inside its window.
  if (status < 200 || status >= 300) return await refused(reminders, entry, day);
  try {
    await update(reminders, recordKey(entry.hash), (current) => {
      if (!current) return undefined;
      const next = { ...current, lastSentDay: day };
      delete next.refusals;
      delete next.refusedDay;
      return next;
    });
  } catch { /* Delivered all the same. At worst the next run inside the window sends it again. */ }
  return 'sent';
}

export async function run(now = new Date(), env = process.env, { budgetMs = BUDGET_MS } = {}) {
  const started = Date.now();
  const { vapid, problem } = vapidFromEnv(env);
  if (!vapid) return { error: problem };

  const reminders = store();
  const { blobs } = await reminders.list({ prefix: 'at/' });
  const queue = [];
  for (const { key } of blobs) {
    const entry = parseScheduleKey(key);
    const timing = entry && due(entry.time, entry.timeZone, now);
    if (timing) queue.push({ entry: { ...entry, key }, timing });
  }

  const counts = { due: queue.length, sent: 0, repeat: 0, stale: 0, gone: 0, failed: 0, deferred: 0 };
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length && Date.now() - started < budgetMs) {
      const { entry, timing } = queue.shift();
      let outcome;
      try { outcome = await remind(reminders, entry, timing, vapid); } catch { outcome = 'failed'; }
      counts[outcome] += 1;
    }
  }));
  // Still inside their window, so the next run picks them up.
  counts.deferred = queue.length;
  return counts;
}

export default async () => {
  const counts = await run();
  // Counts only: never an endpoint, a key, or anything else a browser could be traced by.
  if (counts.error) console.error(`Reminders: ${counts.error}`);
  else if (counts.due) console.log(`Reminders: ${JSON.stringify(counts)}`);
  return new Response(JSON.stringify(counts), { status: 200, headers: { 'Content-Type': 'application/json' } });
};

export const config = { schedule: '*/5 * * * *' };
