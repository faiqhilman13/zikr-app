import { db } from './db';
import type { ZikrState } from '../domain/types';

const LOCAL_EVENT_CAP = 500;

export async function track(state: ZikrState, name: string, metadata?: Record<string, string | number | boolean>) {
  if (!state.settings.analyticsOptIn) return;
  const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT as string | undefined;
  if (!endpoint) return;
  const event = { name, at: Date.now(), metadata };
  try {
    await db.analytics.add(event);
    const total = await db.analytics.count();
    if (total > LOCAL_EVENT_CAP) {
      const oldest = await db.analytics.orderBy('id').limit(total - LOCAL_EVENT_CAP).primaryKeys();
      await db.analytics.bulkDelete(oldest);
    }
  } catch {
    // Local event mirror is best-effort; never let it break the interaction.
  }
  if (navigator.onLine) {
    void fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(event), keepalive: true }).catch(() => undefined);
  }
}
