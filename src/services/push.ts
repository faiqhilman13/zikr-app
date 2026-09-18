import i18n from '../i18n';
import { isStandalone } from './platform';

export const pushConfigured = Boolean(import.meta.env.VITE_PUSH_ENDPOINT && import.meta.env.VITE_VAPID_PUBLIC_KEY);
const urlBase64ToUint8Array = (value: string) => {
  const padding = '='.repeat((4 - value.length % 4) % 4);
  return Uint8Array.from(atob((value + padding).replace(/-/g, '+').replace(/_/g, '/')), (char) => char.charCodeAt(0));
};

export async function enablePushNotifications(preferredTime: string) {
  const endpoint = import.meta.env.VITE_PUSH_ENDPOINT as string | undefined;
  const key = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
  if (!endpoint || !key) throw new Error(i18n.t('pushNotConfigured'));
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) throw new Error(i18n.t('pushUnsupported'));
  if (!isStandalone()) throw new Error(i18n.t('pushNeedsInstall'));
  if (await Notification.requestPermission() !== 'granted') throw new Error(i18n.t('pushDenied'));
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration?.active) throw new Error(i18n.t('pushRegisterFailed'));
  const existing = await registration.pushManager.getSubscription();
  const subscription = existing ?? await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) });
  try {
    const response = await fetch(endpoint, { method: 'POST', signal: AbortSignal.timeout(10_000), headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'subscribe', subscription, preferredTime, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }) });
    if (!response.ok) throw new Error(i18n.t('pushRegisterFailed'));
  } catch (error) {
    if (!existing) await subscription.unsubscribe();
    throw error;
  }
}

export async function disablePushNotifications() {
  if (!('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager?.getSubscription();
  if (!subscription) return;
  // Revoke locally first. A slow/offline backend must never prevent opting out.
  const stopped = await subscription.unsubscribe();
  if (!stopped && await registration?.pushManager.getSubscription()) throw new Error(i18n.t('pushDisableFailed'));
  const endpoint = import.meta.env.VITE_PUSH_ENDPOINT as string | undefined;
  if (endpoint) void fetch(endpoint, { method: 'POST', signal: AbortSignal.timeout(10_000), headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'unsubscribe', endpoint: subscription.endpoint }) }).catch(() => undefined);
}
