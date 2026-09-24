import { parseScheduleKey, scheduleKey, store, validTime, validZone } from '../lib/reminders.mjs';

/**
 * Once a day, puts back any reminder that lost its place in the schedule.
 *
 * Switching reminders on writes a record and then its schedule entry. If the second write
 * never lands, the record sits unsent, and so never hears from its push service that the
 * browser has let it go. This finds such records and schedules them again: a live one is
 * reminded as it asked, and a dead one is deleted by its first send. A record that cannot
 * be scheduled at all is deleted here.
 */

const HASH = /^[0-9a-f]{64}$/;

export async function sweep(reminders = store()) {
  const [records, entries] = await Promise.all([reminders.list({ prefix: 'sub/' }), reminders.list({ prefix: 'at/' })]);
  const scheduled = new Set(entries.blobs.map(({ key }) => parseScheduleKey(key)?.hash));
  const counts = { records: records.blobs.length, rescheduled: 0, removed: 0 };
  for (const { key } of records.blobs) {
    const hash = key.slice('sub/'.length);
    if (!HASH.test(hash) || scheduled.has(hash)) continue;
    const record = await reminders.get(key, { type: 'json' });
    if (!record) continue;
    if (validTime(record.time) && validZone(record.timeZone)) {
      await reminders.setJSON(scheduleKey(record.time, record.timeZone, hash), {});
      counts.rescheduled += 1;
    } else {
      await reminders.delete(key);
      counts.removed += 1;
    }
  }
  return counts;
}

export default async () => {
  const counts = await sweep();
  if (counts.rescheduled || counts.removed) console.log(`Reminder sweep: ${JSON.stringify(counts)}`);
  return new Response(JSON.stringify(counts), { status: 200, headers: { 'Content-Type': 'application/json' } });
};

export const config = { schedule: '40 3 * * *' };
