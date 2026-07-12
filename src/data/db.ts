import Dexie, { type EntityTable } from 'dexie';
import type { AnalyticsEvent, ZikrState } from '../domain/types';
import { initialState, normalizeState, sanitizeState } from '../domain/state';

interface StateRow { id: 'current'; value: ZikrState }

class ZikrDatabase extends Dexie {
  state!: EntityTable<StateRow, 'id'>;
  analytics!: EntityTable<AnalyticsEvent, 'id'>;

  constructor() {
    super('zikr-pwa');
    this.version(1).stores({ state: 'id', analytics: '++id, name, at' });
  }
}

export const db = new ZikrDatabase();

export interface LoadResult { state: ZikrState; persisted: boolean }

/**
 * Never rejects: a corrupt row or unavailable IndexedDB falls back to a fresh in-memory
 * state so the app can still open. `persisted: false` signals that saves are failing.
 */
export async function loadState(): Promise<LoadResult> {
  let state: ZikrState;
  try {
    const row = await db.state.get('current');
    state = row ? sanitizeState(row.value) : initialState();
  } catch {
    state = initialState();
  }
  try {
    await saveState(state);
    return { state, persisted: true };
  } catch {
    return { state, persisted: false };
  }
}

export async function saveState(value: ZikrState): Promise<void> {
  await db.state.put({ id: 'current', value: normalizeState(value) });
}

export async function resetDatabase(): Promise<ZikrState> {
  await db.transaction('rw', db.state, db.analytics, async () => {
    await db.state.clear();
    await db.analytics.clear();
  });
  const state = initialState();
  await saveState(state);
  return state;
}
