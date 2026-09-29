import { isPushEndpoint, validKeys } from '../lib/webpush.mjs';
import { endpointHash, recordKey, scheduleKey, store, update, validTime, validZone, vapidFromEnv } from '../lib/reminders.mjs';

/**
 * Turns the daily reminder on and off for one browser.
 *
 * What arrives is the browser's push subscription, the time it wants reminding at and its
 * time zone: everything needed to send a reminder, and nothing about the practice it is
 * for. The shape is checked exactly, as the usage endpoint's is, and the subscription must
 * point at a real push service, because the sender will POST to whatever is stored here.
 */

const MAX_BODY = 2048;

const headers = { 'Cache-Control': 'no-store', 'Content-Type': 'application/json', 'X-Content-Type-Options': 'nosniff' };
const reply = (body, status = 200) => new Response(JSON.stringify(body), { status, headers });
const isObject = (value) => !!value && typeof value === 'object' && !Array.isArray(value);
const keysOf = (value) => Object.keys(value).sort().join(',');

/** PushSubscription.toJSON(): an endpoint, its keys, and an expiry browsers leave null. */
function validSubscription(value) {
  if (!isObject(value)) return false;
  const keys = keysOf(value);
  if (keys !== 'endpoint,keys' && keys !== 'endpoint,expirationTime,keys') return false;
  if ('expirationTime' in value && value.expirationTime !== null && !Number.isFinite(value.expirationTime)) return false;
  return isPushEndpoint(value.endpoint) && validKeys(value.keys);
}

export const validSubscribe = (body) => isObject(body) && keysOf(body) === 'action,preferredTime,subscription,timeZone'
  && body.action === 'subscribe' && validSubscription(body.subscription) && validTime(body.preferredTime) && validZone(body.timeZone);

export const validUnsubscribe = (body) => isObject(body) && keysOf(body) === 'action,endpoint'
  && body.action === 'unsubscribe' && isPushEndpoint(body.endpoint);

async function subscribe({ subscription, preferredTime: time, timeZone }) {
  const reminders = store();
  const hash = endpointHash(subscription.endpoint);
  // The record before its schedule entry. An entry is only a pointer, and the sender drops
  // one whose record says otherwise, so this order never leaves a reminder unscheduled.
  const { previous } = await update(reminders, recordKey(hash), (record) => ({
    v: 1,
    subscription: { endpoint: subscription.endpoint, keys: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth } },
    time,
    timeZone,
    // Re-subscribing, or moving the time, must not earn a second reminder the same day.
    lastSentDay: typeof record?.lastSentDay === 'string' ? record.lastSentDay : null
  }));
  await reminders.setJSON(scheduleKey(time, timeZone, hash), {});
  if (previous && (previous.time !== time || previous.timeZone !== timeZone) && validTime(previous.time) && validZone(previous.timeZone)) {
    await reminders.delete(scheduleKey(previous.time, previous.timeZone, hash));
  }
  return reply({ ok: true });
}

async function unsubscribe({ endpoint }) {
  const reminders = store();
  const hash = endpointHash(endpoint);
  const record = await reminders.get(recordKey(hash), { type: 'json' });
  // The record first, so an entry left behind by a failure here points at nothing and the
  // sender drops it.
  await reminders.delete(recordKey(hash));
  if (record && validTime(record.time) && validZone(record.timeZone)) await reminders.delete(scheduleKey(record.time, record.timeZone, hash));
  // The same answer whether or not anything was stored, so it says nothing about an endpoint.
  return reply({ ok: true });
}

export default async function handler(request) {
  try {
    if (request.method !== 'POST') return reply({ error: 'Method not allowed' }, 405);
    // Same-origin only, as with usage: browsers always send Origin on a POST.
    if (request.headers.get('origin') !== new URL(request.url).origin) return reply({ error: 'Forbidden' }, 403);
    if (!request.headers.get('content-type')?.startsWith('application/json')) return reply({ error: 'Expected JSON' }, 415);
    if (Number(request.headers.get('content-length') || 0) > MAX_BODY) return reply({ error: 'Too large' }, 413);
    const text = await request.text();
    if (text.length > MAX_BODY) return reply({ error: 'Too large' }, 413);

    let body;
    try { body = JSON.parse(text); } catch { return reply({ error: 'Invalid JSON' }, 400); }
    // Turning reminders off always works, configured or not.
    if (validUnsubscribe(body)) return await unsubscribe(body);
    if (!validSubscribe(body)) return reply({ error: 'Invalid request' }, 400);
    // A reminder this site cannot send is worse than a failure the app can show.
    if (!vapidFromEnv(process.env).vapid) return reply({ error: 'Reminders are not configured' }, 503);
    return await subscribe(body);
  } catch {
    return reply({ error: 'Temporarily unavailable' }, 503);
  }
}

// A browser posts here when reminders are switched on or off, when the time or its zone
// changes, and about once a week to confirm its subscription, so this ceiling is generous.
export const config = {
  rateLimit: { windowSize: 60, windowLimit: 30, aggregateBy: ['ip', 'domain'] }
};
