import i18n from '../i18n';
import { isStandalone } from './platform';

/**
 * The daily reminder, sent through this browser's push service.
 *
 * The server holds this browser's subscription with the time and time zone it asked for,
 * and nothing about the practice: what a reminder says is worked out here when it arrives.
 * The app remembers what it last told the server, so it can put right whatever drifts: the
 * browser replacing its subscription, a move to another time zone, a new signing key, or
 * the server losing its copy.
 */

export const pushConfigured = Boolean(import.meta.env.VITE_PUSH_ENDPOINT && import.meta.env.VITE_VAPID_PUBLIC_KEY);

const CONFIRMED_KEY = 'zikr-push-confirmed';
/** A confirmation is repeated after a week, which restores a copy the server lost. */
const CONFIRM_EVERY_MS = 7 * 24 * 60 * 60 * 1000;
/** One the server did not take is tried again an hour on, not every time the app comes back. */
const RETRY_AFTER_MS = 60 * 60 * 1000;
const TIMEOUT_MS = 10_000;

/** What the server was last told about this browser's reminder, and when. */
type Confirmed = { at: number; endpoint: string; time: string; timeZone: string };

const config = () => ({
  url: import.meta.env.VITE_PUSH_ENDPOINT as string | undefined,
  key: (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined)?.trim()
});
const supported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
const localZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
const urlBase64ToUint8Array = (value: string) => {
  const padding = '='.repeat((4 - value.length % 4) % 4);
  return Uint8Array.from(atob((value + padding).replace(/-/g, '+').replace(/_/g, '/')), (char) => char.charCodeAt(0));
};

function lastConfirmed(): Partial<Confirmed> {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(CONFIRMED_KEY) ?? '{}');
    if (value && typeof value === 'object') return value as Partial<Confirmed>;
  } catch { /* Unreadable counts as never confirmed. */ }
  return {};
}

function remember(confirmed: Confirmed | null) {
  try {
    if (confirmed) localStorage.setItem(CONFIRMED_KEY, JSON.stringify(confirmed));
    else localStorage.removeItem(CONFIRMED_KEY);
  } catch { /* Without storage the app only confirms more often. */ }
}

const post = (url: string, body: object) => fetch(url, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
  signal: AbortSignal.timeout(TIMEOUT_MS),
  credentials: 'omit'
});

/** Never waited on: a slow or unreachable server must not hold up turning reminders off. */
const forgetOnServer = (url: string, endpoint: string) => void post(url, { action: 'unsubscribe', endpoint }).catch(() => undefined);

/** Whether a subscription was made for this key. A browser that does not say is taken at its word. */
function madeFor(subscription: PushSubscription, key: Uint8Array) {
  const made = subscription.options?.applicationServerKey;
  if (!made) return true;
  const bytes = new Uint8Array(made);
  return bytes.length === key.length && bytes.every((byte, index) => byte === key[index]);
}

/**
 * This browser's subscription for the key this build signs with. One made for an earlier
 * key can never be delivered to, so it is dropped and the server told to forget it.
 */
async function subscriptionFor(registration: ServiceWorkerRegistration, url: string, key: Uint8Array<ArrayBuffer>) {
  const existing = await registration.pushManager.getSubscription();
  if (existing && madeFor(existing, key)) return { subscription: existing, created: false };
  if (existing) {
    await existing.unsubscribe();
    forgetOnServer(url, existing.endpoint);
  }
  const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
  return { subscription, created: true };
}

/** Tells the server when to remind this browser, and remembers that it did. */
async function confirm(url: string, subscription: PushSubscription, time: string, timeZone: string) {
  const response = await post(url, { action: 'subscribe', subscription, preferredTime: time, timeZone });
  if (response.ok) remember({ at: Date.now(), endpoint: subscription.endpoint, time, timeZone });
  return response.ok;
}

export async function enablePushNotifications(preferredTime: string) {
  const { url, key } = config();
  if (!url || !key) throw new Error(i18n.t('pushNotConfigured'));
  if (!supported()) throw new Error(i18n.t('pushUnsupported'));
  if (!isStandalone()) throw new Error(i18n.t('pushNeedsInstall'));
  if (await Notification.requestPermission() !== 'granted') throw new Error(i18n.t('pushDenied'));
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration?.active) throw new Error(i18n.t('pushRegisterFailed'));
  let made: { subscription: PushSubscription; created: boolean } | undefined;
  try {
    made = await subscriptionFor(registration, url, urlBase64ToUint8Array(key));
    if (await confirm(url, made.subscription, preferredTime, localZone())) return;
  } catch {
    // Refused by the browser or its push service, offline, or timed out. What the browser
    // says about it is not written for people, so all of them read the same.
  }
  // A subscription the server never heard of would only wait for reminders that never come.
  if (made?.created) await made.subscription.unsubscribe().catch(() => false);
  throw new Error(i18n.t('pushRegisterFailed'));
}

export async function disablePushNotifications() {
  const registration = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
  const subscription = await registration?.pushManager?.getSubscription();
  if (subscription) {
    // Revoke locally first. A slow/offline backend must never prevent opting out.
    const stopped = await subscription.unsubscribe();
    if (!stopped && await registration?.pushManager.getSubscription()) throw new Error(i18n.t('pushDisableFailed'));
  }
  const { endpoint } = lastConfirmed();
  remember(null);
  const { url } = config();
  if (!url) return;
  // The subscription just revoked, and the one the server was last told about, in case the
  // browser had already replaced it.
  for (const stale of new Set([subscription?.endpoint, endpoint])) if (typeof stale === 'string') forgetOnServer(url, stale);
}

// Module scoped, so the app opening and coming back on the same tick cannot both confirm.
let inFlight = false;
let tried: { attempt: string; at: number } | undefined;

/**
 * Brings the server's copy of this browser's reminder up to date without asking anything
 * of the person. Resolves false when notifications have been switched off for this site
 * outside the app, after tidying up, so the setting can follow. Otherwise true, including
 * when the server could not be reached this time. Never rejects.
 */
export async function refreshPushSubscription(preferredTime: string): Promise<boolean> {
  const { url, key } = config();
  if (!url || !key) return true;
  if (!supported() || Notification.permission !== 'granted') {
    await disablePushNotifications().catch(() => undefined);
    return false;
  }
  if (inFlight || !navigator.onLine) return true;
  inFlight = true;
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration?.active) return true;
    // Also replaces a subscription the browser dropped. Permission is already granted, so
    // nothing is asked.
    const { subscription } = await subscriptionFor(registration, url, urlBase64ToUint8Array(key));
    const timeZone = localZone();
    const last = lastConfirmed();
    const same = last.endpoint === subscription.endpoint && last.time === preferredTime && last.timeZone === timeZone;
    if (same && typeof last.at === 'number' && Math.abs(Date.now() - last.at) < CONFIRM_EVERY_MS) return true;
    const attempt = [subscription.endpoint, preferredTime, timeZone].join(' ');
    if (tried?.attempt === attempt && Date.now() - tried.at < RETRY_AFTER_MS) return true;
    tried = { attempt, at: Date.now() };
    // The browser has replaced the subscription the server knows, which can only fail now.
    if (typeof last.endpoint === 'string' && last.endpoint !== subscription.endpoint) forgetOnServer(url, last.endpoint);
    await confirm(url, subscription, preferredTime, timeZone);
  } catch {
    // Offline after all, timed out, or a browser that will not subscribe without a tap. The
    // app coming back tries again.
  } finally {
    inFlight = false;
  }
  return true;
}
