import { getStore } from '@netlify/blobs';
import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * How many browsers visit Zikr, come back, open it from a home screen, and use its daily
 * reminders.
 *
 * Nothing about what anyone counts reaches this endpoint. A participating browser sends a
 * random identifier it generated for itself and up to five facts about today: it opened
 * the site, it used the app after onboarding, it did so from a home-screen install, it has
 * daily reminders switched on, it was opened from one. No phrase, count, timer, target,
 * streak, reminder time, language, page or referrer is accepted, and the payload shape is
 * checked exactly rather than merely parsed, so nothing else can be smuggled in.
 *
 * Each fact is one blob keyed `date/kind/id`, written with `onlyIfNew`. A browser
 * reporting the same fact twice is a no-op rather than a race, so every figure is a
 * distinct-browser count by construction and the store holds nothing but "this random
 * identifier was present on this day".
 */

/** What the dashboard reports on. Every metric fits inside it, so no label outruns its maths. */
const WINDOW_DAYS = 30;
const KINDS = ['visit', 'active', 'standalone', 'reminders', 'reminded'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_BODY = 512;

/**
 * Listing is the slow part of a report and functions are capped at ten seconds, so the
 * dashboard reads exactly the days it shows rather than scanning the store. This ceiling
 * is the point where summarising would outrun the budget anyway; it fails loudly instead
 * of timing out with no explanation.
 */
const MAX_RECORDS = 200_000;

export const STORE = 'zikr-usage-v1';
export const dayKey = (date) => date.toISOString().slice(0, 10);
/** UTC days back from `from`. Every date in the store and the dashboard is UTC. */
export const dayBefore = (offset, from) => dayKey(new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate() - offset)));

const headers = { 'Cache-Control': 'no-store', 'Content-Type': 'application/json', 'X-Content-Type-Options': 'nosniff' };
const reply = (body, status = 200) => new Response(JSON.stringify(body), { status, headers });
const store = () => getStore({ name: STORE, consistency: 'strong' });

/** Exactly two keys, an identifier the browser made up, and known kinds, each once. Nothing else. */
export function validPayload(body) {
  return !!body && typeof body === 'object' && !Array.isArray(body)
    && Object.keys(body).sort().join(',') === 'id,kinds'
    && typeof body.id === 'string' && UUID.test(body.id)
    && Array.isArray(body.kinds) && body.kinds.length > 0 && body.kinds.length <= KINDS.length
    && body.kinds.every((kind) => KINDS.includes(kind)) && new Set(body.kinds).size === body.kinds.length;
}

/** Constant time over equal-length digests, so a wrong key cannot be found byte by byte. */
export function authorized(header, secret) {
  if (!secret || !header || typeof header !== 'string') return false;
  const digest = (value) => createHash('sha256').update(value).digest();
  return timingSafeEqual(digest(header), digest(`Bearer ${secret}`));
}

export function summarize(keys, now = new Date()) {
  const today = dayKey(now);
  const day = (offset) => dayBefore(offset, now);
  const first = day(WINDOW_DAYS - 1);

  // date -> kind -> browsers, built in one pass, so every figure below is a lookup rather
  // than another scan of every record.
  const byDate = new Map();
  for (const [date, kind, id] of keys.map((key) => key.split('/'))) {
    if (!DATE.test(date) || date < first || date > today || !KINDS.includes(kind) || !UUID.test(id)) continue;
    if (!byDate.has(date)) byDate.set(date, new Map(KINDS.map((known) => [known, new Set()])));
    byDate.get(date).get(kind).add(id);
  }
  const on = (kind, date) => byDate.get(date)?.get(kind) ?? new Set();
  const ids = (kind, from, to = today) => {
    const found = new Set();
    for (const [date, kinds] of byDate) if (date >= from && date <= to) for (const id of kinds.get(kind)) found.add(id);
    return found;
  };
  const overlap = (earlier, later) => [...earlier].filter((id) => later.has(id)).length;

  // A browser is returning if it showed up on two different days inside the window, so
  // one long first session never reads as loyalty.
  const visitDays = new Map();
  for (const kinds of byDate.values()) for (const id of kinds.get('visit')) visitDays.set(id, (visitDays.get(id) ?? 0) + 1);

  const priorWeek = ids('active', day(13), day(7));
  const thisWeek = ids('active', day(6));

  // A streak asks for a return every day, and a browser active on consecutive days is the
  // record of one, with no streak ever sent. Both figures read the seven full days before
  // today, so a day still under way never counts as a day nobody came back.
  const fullWeek = [1, 2, 3, 4, 5, 6, 7];
  const nextDay = fullWeek.map((offset) => [on('active', day(offset + 1)), on('active', day(offset))]);

  return {
    generatedAt: now.toISOString(),
    windowDays: WINDOW_DAYS,
    timezone: 'UTC',
    visitors: ids('visit', first).size,
    activeToday: ids('active', today, today).size,
    active7d: thisWeek.size,
    active30d: ids('active', first).size,
    returning: [...visitDays.values()].filter((days) => days > 1).length,
    standalone: ids('standalone', first).size,
    priorWeekActive: priorWeek.size,
    retainedFromPriorWeek: overlap(priorWeek, thisWeek),
    nextDayBase: nextDay.reduce((sum, [before]) => sum + before.size, 0),
    nextDayReturned: nextDay.reduce((sum, [before, after]) => sum + overlap(before, after), 0),
    activeEveryDay: [...on('active', day(1))].filter((id) => fullWeek.every((offset) => on('active', day(offset)).has(id))).length,
    reminders7d: ids('reminders', day(6)).size,
    reminded7d: ids('reminded', day(6)).size,
    daily: Array.from({ length: WINDOW_DAYS }, (_, index) => {
      const offset = WINDOW_DAYS - 1 - index;
      const date = day(offset);
      return {
        date,
        visitors: on('visit', date).size,
        active: on('active', date).size,
        standalone: on('standalone', date).size,
        // Unknown on the oldest day shown, whose day before was never read.
        consecutive: offset < WINDOW_DAYS - 1 ? overlap(on('active', day(offset + 1)), on('active', date)) : null,
        reminders: on('reminders', date).size,
        reminded: on('reminded', date).size
      };
    })
  };
}

async function report(now) {
  const usage = store();
  const dates = Array.from({ length: WINDOW_DAYS }, (_, index) => dayBefore(index, now));
  const pages = await Promise.all(dates.map((date) => usage.list({ prefix: `${date}/` })));
  const keys = pages.flatMap((page) => page.blobs.map((blob) => blob.key));
  if (keys.length > MAX_RECORDS) return reply({ error: 'Too many records to summarise in one request. The daily figures need aggregating before this dashboard can show them.' }, 503);
  return reply(summarize(keys, now));
}

async function collect(request) {
  // Same-origin only. Browsers always send Origin on a POST, so a missing or foreign one
  // is not the app asking.
  if (request.headers.get('origin') !== new URL(request.url).origin) return reply({ error: 'Forbidden' }, 403);
  if (!request.headers.get('content-type')?.startsWith('application/json')) return reply({ error: 'Expected JSON' }, 415);
  if (Number(request.headers.get('content-length') || 0) > MAX_BODY) return reply({ error: 'Too large' }, 413);
  const text = await request.text();
  // Checked again: a chunked request carries no content-length to check up front.
  if (text.length > MAX_BODY) return reply({ error: 'Too large' }, 413);

  let body;
  try { body = JSON.parse(text); } catch { return reply({ error: 'Invalid JSON' }, 400); }
  if (!validPayload(body)) return reply({ error: 'Invalid event' }, 400);

  const date = dayKey(new Date());
  const usage = store();
  await Promise.all(body.kinds.map((kind) => usage.setJSON(`${date}/${kind}/${body.id}`, { v: 1 }, { onlyIfNew: true })));
  return reply({ ok: true });
}

export default async function handler(request) {
  try {
    if (request.method === 'GET') {
      return authorized(request.headers.get('authorization'), process.env.ANALYTICS_ADMIN_KEY)
        ? await report(new Date())
        : reply({ error: 'Unauthorized' }, 401);
    }
    if (request.method !== 'POST') return reply({ error: 'Method not allowed' }, 405);
    return await collect(request);
  } catch {
    // Never leak a stack trace to a public endpoint, and never fail loudly enough to be
    // worth probing.
    return reply({ error: 'Temporarily unavailable' }, 503);
  }
}

// A participating browser sends at most five requests a day, so a per-IP ceiling this
// high still leaves room for a whole household or a shared connection behind one address.
export const config = {
  rateLimit: { windowSize: 60, windowLimit: 60, aggregateBy: ['ip', 'domain'] }
};
