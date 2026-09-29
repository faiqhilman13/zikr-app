import { createCipheriv, createECDH, createHmac, createPrivateKey, randomBytes, sign } from 'node:crypto';

/**
 * Just enough Web Push to send one reminder, on node:crypto alone: a VAPID signature
 * (RFC 8292) so the push service knows the sender, and aes128gcm payload encryption
 * (RFC 8291) so only the browser that subscribed can read what is sent.
 */

const RECORD_SIZE = 4096;

const fromBase64Url = (value) => Buffer.from(value, 'base64url');
const hmac = (key, data) => createHmac('sha256', key).update(data).digest();

/**
 * Push services a browser can hand out, and so the only hosts a reminder is ever sent to.
 * Subscriptions come from the public internet, so without this the daily run could be
 * pointed at any https URL someone wanted to receive a POST.
 */
const PUSH_HOSTS = [/^fcm\.googleapis\.com$/, /^android\.googleapis\.com$/, /^([a-z0-9-]+\.)*push\.services\.mozilla\.com$/, /^web\.push\.apple\.com$/, /^[a-z0-9-]+\.notify\.windows\.com$/];

export function isPushEndpoint(value) {
  if (typeof value !== 'string' || value.length > 1024) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.port && !url.username && !url.password && PUSH_HOSTS.some((host) => host.test(url.hostname));
  } catch {
    return false;
  }
}

/** An uncompressed P-256 point and a 16-byte auth secret, as PushSubscription.toJSON() gives them. */
export function validKeys(keys) {
  if (!keys || typeof keys !== 'object' || Array.isArray(keys) || Object.keys(keys).sort().join(',') !== 'auth,p256dh') return false;
  const { p256dh, auth } = keys;
  const base64Url = /^[A-Za-z0-9_-]+$/;
  if (typeof p256dh !== 'string' || typeof auth !== 'string' || !base64Url.test(p256dh) || !base64Url.test(auth)) return false;
  const point = fromBase64Url(p256dh);
  return point.length === 65 && point[0] === 4 && fromBase64Url(auth).length === 16;
}

/**
 * The aes128gcm body for one record. `salt` and `serverPrivateKey` are only passed by tests,
 * to reproduce the RFC's worked example; every real message gets fresh ones.
 */
export function encrypt(payload, { p256dh, auth }, { salt = randomBytes(16), serverPrivateKey } = {}) {
  const plaintext = Buffer.from(payload);
  if (plaintext.length + 17 > RECORD_SIZE) throw new Error('Payload too large for one record');
  const clientPublic = fromBase64Url(p256dh);
  const ecdh = createECDH('prime256v1');
  if (serverPrivateKey) ecdh.setPrivateKey(fromBase64Url(serverPrivateKey));
  else ecdh.generateKeys();
  const serverPublic = ecdh.getPublicKey();
  const shared = ecdh.computeSecret(clientPublic);

  const prkKey = hmac(fromBase64Url(auth), shared);
  const ikm = hmac(prkKey, Buffer.concat([Buffer.from('WebPush: info\0'), clientPublic, serverPublic, Buffer.from([1])]));
  const prk = hmac(salt, ikm);
  const cek = hmac(prk, Buffer.from('Content-Encoding: aes128gcm\0\x01')).subarray(0, 16);
  const nonce = hmac(prk, Buffer.from('Content-Encoding: nonce\0\x01')).subarray(0, 12);

  const cipher = createCipheriv('aes-128-gcm', cek, nonce);
  // 0x02 marks the last (and only) record, with no padding after it.
  const body = Buffer.concat([cipher.update(Buffer.concat([plaintext, Buffer.from([2])])), cipher.final(), cipher.getAuthTag()]);
  const header = Buffer.alloc(21);
  salt.copy(header, 0);
  header.writeUInt32BE(RECORD_SIZE, 16);
  header.writeUInt8(serverPublic.length, 20);
  return Buffer.concat([header, serverPublic, body]);
}

// A scalar with leading zero bytes can arrive shortened; JWK wants all 32.
const scalar = (value) => {
  const bytes = typeof value === 'string' ? fromBase64Url(value) : value;
  if (bytes.length === 0 || bytes.length > 32) throw new Error('VAPID private key must be a 32-byte P-256 scalar');
  return Buffer.concat([Buffer.alloc(32 - bytes.length), bytes]);
};

const signingKey = (publicKey, privateKey) => {
  const point = fromBase64Url(publicKey);
  if (point.length !== 65 || point[0] !== 4) throw new Error('VAPID public key must be an uncompressed P-256 point');
  return createPrivateKey({
    format: 'jwk',
    key: { kty: 'EC', crv: 'P-256', d: scalar(privateKey).toString('base64url'), x: point.subarray(1, 33).toString('base64url'), y: point.subarray(33).toString('base64url') }
  });
};

/** The Authorization header for one push service. It names the origin it is for and expires. */
export function vapidAuthorization(endpoint, { publicKey, privateKey, subject }, now = Date.now()) {
  const segment = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const unsigned = `${segment({ typ: 'JWT', alg: 'ES256' })}.${segment({ aud: new URL(endpoint).origin, exp: Math.floor(now / 1000) + 12 * 3600, sub: subject })}`;
  const signature = sign('sha256', Buffer.from(unsigned), { key: signingKey(publicKey, privateKey), dsaEncoding: 'ieee-p1363' });
  return `vapid t=${unsigned}.${signature.toString('base64url')}, k=${publicKey}`;
}

/** A fresh key pair for `npm run vapid-keys`, in the base64url form both sides expect. */
export function generateVapidKeys() {
  const ecdh = createECDH('prime256v1');
  ecdh.generateKeys();
  return { publicKey: ecdh.getPublicKey().toString('base64url'), privateKey: scalar(ecdh.getPrivateKey()).toString('base64url') };
}

/**
 * The reason a push service gives for turning a message away, when it gives one: Apple
 * answers `{"reason":"BadJwtToken"}`, others plain text. Cut to a short token so it can go
 * in a log or back to the app, and never carries more than the service wrote about itself.
 */
async function refusalReason(response) {
  try {
    const text = (await response.text()).slice(0, 500);
    let reason = text;
    try { reason = JSON.parse(text)?.reason ?? text; } catch { /* Plain text. */ }
    const token = String(reason).replace(/[^\w .:-]/g, '').trim().slice(0, 60);
    return token || undefined;
  } catch {
    return undefined;
  }
}

/** As sendPush, with the push service's reason alongside any refusal. */
export async function sendPushDetailed(subscription, payload, options) {
  const response = await post(subscription, payload, options);
  if (response.status >= 200 && response.status < 300) return { status: response.status };
  return { status: response.status, reason: await refusalReason(response) };
}

/**
 * Sends one encrypted message. Resolves to the push service's status: 201 is delivered to
 * the service, 404 and 410 mean the subscription is gone for good.
 */
export async function sendPush(subscription, payload, options) {
  return (await sendPushDetailed(subscription, payload, options)).status;
}

/**
 * A topic is sent as RFC 8030 asks: base64url, at most 32 characters. Apple also decodes it,
 * so a length no base64 can have (one more than a multiple of four) is refused there.
 */
export const validTopic = (topic) => typeof topic === 'string' && /^[A-Za-z0-9_-]{1,32}$/.test(topic) && topic.length % 4 !== 1;

function post({ endpoint, keys }, payload, { vapid, ttl, topic, urgency = 'normal', signal }) {
  if (topic !== undefined && !validTopic(topic)) throw new Error('Push topic must be base64url that decodes, 32 characters at most');
  return fetch(endpoint, {
    method: 'POST',
    signal,
    redirect: 'error',
    headers: {
      Authorization: vapidAuthorization(endpoint, vapid),
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      TTL: String(Math.max(0, Math.floor(ttl))),
      Urgency: urgency,
      ...(topic ? { Topic: topic } : {})
    },
    body: encrypt(JSON.stringify(payload), keys)
  });
}

/** Whether the private key is the other half of the public one, so a mismatch is caught before any send. */
export function keysMatch(publicKey, privateKey) {
  try {
    const ecdh = createECDH('prime256v1');
    ecdh.setPrivateKey(scalar(privateKey));
    return ecdh.getPublicKey().equals(fromBase64Url(publicKey));
  } catch {
    return false;
  }
}
