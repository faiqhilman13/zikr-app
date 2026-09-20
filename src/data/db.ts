import Dexie, { type EntityTable } from 'dexie';
import type { AnalyticsEvent, ZikrState } from '../domain/types';
import { initialState, normalizeState, sanitizeState } from '../domain/state';

export interface Snapshot { state: ZikrState; revision: number; generation: string }
interface StateRow { id: 'current'; value: ZikrState; revision?: number; generation?: string }

class ZikrDatabase extends Dexie {
  records!: EntityTable<StateRow, 'id'>;
  // Nothing writes here any more: per-interaction events were replaced by a daily
  // presence report that never touches the database. The store stays in the schema so
  // an install that still holds those rows keeps a reset that erases them.
  analytics!: EntityTable<AnalyticsEvent, 'id'>;
  constructor() {
    super('zikr-pwa');
    this.version(1).stores({ state: 'id', analytics: '++id, name, at' });
    // Copy the row unchanged into a dedicated store. Dexie can reopen
    // newer schemas, so a version bump alone does NOT isolate old snapshot writers.
    this.version(2).stores({ state: 'id', records: 'id', analytics: '++id, name, at' }).upgrade(async (tx) => {
      const row = await tx.table('state').get('current');
      if (row) await tx.table('records').put(row);
    });
  }
}
export const db = new ZikrDatabase();
export class StateConflictError extends Error {
  constructor() { super('Data changed in another window. Please review it and try again.'); }
}
const snapshot = (row?: StateRow): Snapshot => ({
  state: row ? sanitizeState(row.value) : initialState(),
  revision: row?.revision ?? 0,
  generation: row?.generation ?? 'original'
});

// Reads never write. A read/validation failure must remain a failure, not an empty
// replacement that can destroy the user's recovery copy.
export async function loadState(): Promise<Snapshot> {
  return snapshot(await db.records.get('current'));
}

export async function mutateState(generation: string, update: (state: ZikrState) => ZikrState): Promise<Snapshot> {
  return db.transaction('rw', db.records, async () => {
    const current = snapshot(await db.records.get('current'));
    if (current.generation !== generation) throw new StateConflictError();
    const next = { ...current, state: normalizeState(update(current.state)), revision: current.revision + 1 };
    await db.records.put({ id: 'current', value: next.state, revision: next.revision, generation: next.generation });
    return next;
  });
}

// Import/reset are intentional replacements, with a revision check so a slow
// decryption or stale confirmation cannot silently overwrite another window's work.
export async function replaceState(expected: Snapshot, value: ZikrState, clearAnalytics = false): Promise<Snapshot> {
  const validated = sanitizeState(value);
  return db.transaction('rw', db.records, db.analytics, db.table('state'), async () => {
    const current = snapshot(await db.records.get('current'));
    if (current.revision !== expected.revision || current.generation !== expected.generation) throw new StateConflictError();
    const next = { state: validated, revision: current.revision + 1, generation: crypto.randomUUID() };
    await db.records.put({ id: 'current', value: next.state, revision: next.revision, generation: next.generation });
    await db.table('state').clear();
    if (clearAnalytics) await db.analytics.clear();
    return next;
  });
}
