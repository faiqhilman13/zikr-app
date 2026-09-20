import { isStandalone } from '../services/platform';

/**
 * Optional usage reporting: how many browsers open Zikr, come back to it, and run it from
 * a home screen. Off until someone turns it on.
 *
 * What leaves the device is a random identifier this browser made up for itself and, at
 * most, three flags about today. Counts, phrases, targets, timers, language and page are
 * never part of it, and the endpoint rejects a payload carrying anything else rather than
 * quietly dropping the extra field.
 *
 * Each fact is sent once per UTC day and remembered locally, so leaving the app open, or
 * having it open in three tabs, costs one request rather than one per tick. That keeps
 * someone's practice from turning into traffic.
 */

const ENDPOINT = '/.netlify/functions/usage';
const ID_KEY = 'zikr-usage-id';
const SENT_KEY = 'zikr-usage-sent';
const TIMEOUT_MS = 10_000;

type Kind = 'visit' | 'active' | 'standalone';

/** A browser-level opt-out outranks a toggle in this app, so it is checked every time. */
export const privacySignalSet = () =>
  navigator.doNotTrack === '1' || navigator.globalPrivacyControl === true;

const today = () => new Date().toISOString().slice(0, 10);

const forget = () => {
  try {
    localStorage.removeItem(ID_KEY);
    localStorage.removeItem(SENT_KEY);
  } catch { /* Storage is optional; there is nothing to clear if it never worked. */ }
};

// Module scoped so two calls racing on one tick cannot both send. React effects, the
// interval, and the visibility and online listeners all land here.
let inFlight = false;

export async function reportUsage(enabled: boolean, active: boolean): Promise<void> {
  // Turning it off takes the identifier with it, so nothing on this device links a later
  // opt-in to anything reported before.
  if (!enabled) return forget();
  if (privacySignalSet() || !navigator.onLine || document.visibilityState !== 'visible' || inFlight) return;

  const day = today();
  const kinds: Kind[] = ['visit', ...(active ? ['active' as const] : []), ...(active && isStandalone() ? ['standalone' as const] : [])];

  let id: string;
  let sent: string[] = [];
  try {
    id = localStorage.getItem(ID_KEY) ?? crypto.randomUUID();
    localStorage.setItem(ID_KEY, id);
    const previous: unknown = JSON.parse(localStorage.getItem(SENT_KEY) ?? '{}');
    if (previous && typeof previous === 'object' && 'day' in previous && previous.day === day
      && 'kinds' in previous && Array.isArray(previous.kinds)) sent = previous.kinds as string[];
  } catch {
    // Without storage there is no stable identifier and no way to avoid reporting the
    // same browser every tick, so this browser sits the count out.
    return;
  }

  const unsent = kinds.filter((kind) => !sent.includes(kind));
  if (!unsent.length) return;

  inFlight = true;
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, kinds: unsent }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      credentials: 'omit'
    });
    if (!response.ok) return;
    if (((await response.json()) as { ok?: boolean }).ok !== true) return;
    // Someone may have opted out while this was in the air; do not write an identifier
    // back that the opt-out just removed.
    if (localStorage.getItem(ID_KEY) === id) {
      localStorage.setItem(SENT_KEY, JSON.stringify({ day, kinds: [...new Set([...sent, ...unsent])] }));
    }
  } catch {
    // Offline, blocked, timed out, or refused. Reporting is never worth an interruption,
    // and an unrecorded day is simply not counted rather than queued for later.
  } finally {
    inFlight = false;
  }
}
