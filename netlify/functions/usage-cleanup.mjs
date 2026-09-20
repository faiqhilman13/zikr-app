import { getStore } from '@netlify/blobs';
import { STORE, dayBefore } from './usage.mjs';

/**
 * Deletes usage records once they pass ninety days.
 *
 * It sweeps a trailing band of dates rather than scanning the store, so a run costs the
 * same whatever the store holds and finishes well inside the thirty seconds a scheduled
 * function gets. The band is thirty days wide, which means a month of missed runs still
 * heals itself on the next one.
 */

const RETAIN_DAYS = 90;
const BAND_DAYS = 30;
const BATCH = 20;

export const expiring = (now) =>
  Array.from({ length: BAND_DAYS }, (_, index) => dayBefore(RETAIN_DAYS + index, now));

export default async () => {
  const usage = getStore({ name: STORE, consistency: 'strong' });
  let deleted = 0;
  for (const date of expiring(new Date())) {
    const { blobs } = await usage.list({ prefix: `${date}/` });
    for (let index = 0; index < blobs.length; index += BATCH) {
      await Promise.all(blobs.slice(index, index + BATCH).map((blob) => usage.delete(blob.key)));
    }
    deleted += blobs.length;
  }
  return new Response(JSON.stringify({ deleted }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};

export const config = { schedule: '15 3 * * *' };
