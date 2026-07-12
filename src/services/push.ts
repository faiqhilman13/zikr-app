import i18n from '../i18n';

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
};

const pushEndpoint = () => import.meta.env.VITE_PUSH_ENDPOINT as string | undefined;

export async function enablePushNotifications(preferredTime: string) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) throw new Error(i18n.t('pushUnsupported'));
  if (!window.matchMedia('(display-mode: standalone)').matches && navigator.standalone !== true) throw new Error(i18n.t('pushNeedsInstall'));
  const endpoint = pushEndpoint();
  const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
  if (!endpoint || !publicKey) throw new Error(i18n.t('pushNotConfigured'));
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error(i18n.t('pushDenied'));
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'subscribe', subscription, preferredTime, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone })
  });
  if (!response.ok) throw new Error(i18n.t('pushRegisterFailed'));
}

/**
 * Unsubscribing invalidates the subscription at the push service, so deliveries stop even
 * if the server never processes the unsubscribe notification.
 */
export async function disablePushNotifications() {
  if (!('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;
  const endpoint = pushEndpoint();
  if (endpoint) {
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'unsubscribe', endpoint: subscription.endpoint })
    }).catch(() => undefined);
  }
  await subscription.unsubscribe();
}
