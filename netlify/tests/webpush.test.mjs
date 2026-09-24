import { createECDH, createPublicKey, verify } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { encrypt, generateVapidKeys, isPushEndpoint, keysMatch, sendPush, vapidAuthorization, validKeys } from '../lib/webpush.mjs';
import { RFC, b64, decrypt } from './support/subscriber.mjs';

describe('payload encryption', () => {
  it('reproduces the RFC 8291 example byte for byte', () => {
    const body = encrypt(RFC.plaintext, { p256dh: RFC.uaPublic, auth: RFC.auth }, { salt: b64(RFC.salt), serverPrivateKey: RFC.asPrivate });
    expect(body.toString('base64url')).toBe(RFC.body);
  });

  it('uses a fresh key and salt for every message, which the subscriber can still read', () => {
    const keys = { p256dh: RFC.uaPublic, auth: RFC.auth };
    const first = encrypt('{"v":1}', keys);
    const second = encrypt('{"v":1}', keys);
    expect(first.subarray(0, 16).equals(second.subarray(0, 16))).toBe(false);
    expect(first.subarray(21, 86).equals(second.subarray(21, 86))).toBe(false);
    expect(decrypt(first, RFC)).toBe('{"v":1}');
    expect(decrypt(second, RFC)).toBe('{"v":1}');
  });

  it('refuses a payload that would not fit in one record', () => {
    expect(() => encrypt('x'.repeat(4080), { p256dh: RFC.uaPublic, auth: RFC.auth })).toThrow(/too large/i);
  });
});

describe('VAPID', () => {
  const vapid = { ...generateVapidKeys(), subject: 'mailto:hello@example.com' };
  const endpoint = 'https://fcm.googleapis.com/fcm/send/abc:def';
  const NOW = Date.UTC(2026, 8, 24, 12);

  const parse = (header) => {
    const [, token, key] = header.match(/^vapid t=([^,]+), k=(.+)$/);
    const [head, claims, signature] = token.split('.');
    const json = (part) => JSON.parse(b64(part).toString());
    const point = b64(key);
    const publicKey = createPublicKey({ format: 'jwk', key: { kty: 'EC', crv: 'P-256', x: point.subarray(1, 33).toString('base64url'), y: point.subarray(33).toString('base64url') } });
    const verifies = (signed) => verify('sha256', Buffer.from(signed), { key: publicKey, dsaEncoding: 'ieee-p1363' }, b64(signature));
    return { key, head: json(head), claims: json(claims), valid: verifies(`${head}.${claims}`), tampered: verifies(`${head}.${claims}x`) };
  };

  it('signs a token the push service can check with the public key it was handed', () => {
    const token = parse(vapidAuthorization(endpoint, vapid, NOW));
    expect(token.key).toBe(vapid.publicKey);
    expect(token.valid).toBe(true);
    expect(token.tampered).toBe(false);
  });

  it('names only the push service origin, a contact, and an expiry inside the 24 hours allowed', () => {
    const token = parse(vapidAuthorization(endpoint, vapid, NOW));
    expect(token.head).toEqual({ typ: 'JWT', alg: 'ES256' });
    expect(token.claims).toEqual({ aud: 'https://fcm.googleapis.com', exp: NOW / 1000 + 12 * 3600, sub: 'mailto:hello@example.com' });
  });

  it('makes keys in the shape both halves expect', () => {
    const { publicKey, privateKey } = generateVapidKeys();
    expect(b64(publicKey)).toHaveLength(65);
    expect(b64(publicKey)[0]).toBe(4);
    expect(b64(privateKey)).toHaveLength(32);
    expect(publicKey).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  // A private scalar that starts with a zero byte is sometimes written out one byte short.
  it('signs with a private key that lost its leading zero, and refuses one that is not a key', () => {
    const pair = leadingZeroPair();
    const short = b64(pair.privateKey).subarray(1).toString('base64url');
    expect(parse(vapidAuthorization(endpoint, { ...pair, privateKey: short, subject: 'mailto:a@b.c' }, NOW)).valid).toBe(true);
    expect(() => vapidAuthorization(endpoint, { ...pair, privateKey: '', subject: 'mailto:a@b.c' }, NOW)).toThrow();
    expect(() => vapidAuthorization(endpoint, { ...pair, publicKey: 'AAAA', subject: 'mailto:a@b.c' }, NOW)).toThrow();
  });

  // A private key pasted from a different pair would be refused by every push service,
  // one reminder at a time, so it is caught before anything is sent.
  it('tells whether a private key belongs to a public one', () => {
    const pair = generateVapidKeys();
    expect(keysMatch(pair.publicKey, pair.privateKey)).toBe(true);
    expect(keysMatch(pair.publicKey, generateVapidKeys().privateKey)).toBe(false);
    const short = leadingZeroPair();
    expect(keysMatch(short.publicKey, b64(short.privateKey).subarray(1).toString('base64url'))).toBe(true);
    for (const privateKey of ['', 'not a key', 'A'.repeat(60), undefined]) expect(keysMatch(pair.publicKey, privateKey)).toBe(false);
  });
});

/** A key pair whose private scalar starts with a zero byte: one in 256, so found by trying. */
function leadingZeroPair() {
  for (;;) {
    const ecdh = createECDH('prime256v1');
    ecdh.generateKeys();
    const scalar = ecdh.getPrivateKey();
    const padded = Buffer.concat([Buffer.alloc(32 - scalar.length), scalar]);
    if (padded[0] === 0) return { publicKey: ecdh.getPublicKey().toString('base64url'), privateKey: padded.toString('base64url') };
  }
}

describe('where a subscription may point', () => {
  it('accepts the push services browsers hand out', () => {
    for (const endpoint of [
      'https://fcm.googleapis.com/fcm/send/abc:APA91b',
      'https://android.googleapis.com/gcm/send/abc',
      'https://updates.push.services.mozilla.com/wpush/v2/gAAAA',
      'https://web.push.apple.com/QGuQyavXutnMHqrNKYOeDZOqD0o',
      'https://wns2-par02p.notify.windows.com/w/?token=BQYAAAB'
    ]) expect(isPushEndpoint(endpoint), endpoint).toBe(true);
  });

  // Subscriptions arrive from anyone, and the daily run POSTs to each one.
  it('refuses anything else the daily run could be pointed at', () => {
    for (const endpoint of [
      'http://fcm.googleapis.com/fcm/send/abc',
      'https://fcm.googleapis.com:8443/fcm/send/abc',
      'https://user:pass@fcm.googleapis.com/fcm/send/abc',
      'https://fcm.googleapis.com.evil.test/send',
      'https://evilfcm.googleapis.com/send',
      'https://push.services.mozilla.com.evil.test/',
      'https://169.254.169.254/latest/meta-data',
      'https://localhost/',
      'https://example.com/',
      `https://fcm.googleapis.com/${'a'.repeat(1024)}`,
      'not a url', '', null, 42
    ]) expect(isPushEndpoint(endpoint), String(endpoint)).toBe(false);
  });

  it('accepts exactly a P-256 point and a 16-byte secret', () => {
    expect(validKeys({ p256dh: RFC.uaPublic, auth: RFC.auth })).toBe(true);
    expect(validKeys({ p256dh: RFC.uaPublic, auth: RFC.auth, extra: 'x' })).toBe(false);
    expect(validKeys({ p256dh: RFC.uaPublic })).toBe(false);
    expect(validKeys({ p256dh: RFC.uaPublic.slice(0, 40), auth: RFC.auth })).toBe(false);
    expect(validKeys({ p256dh: `A${RFC.uaPublic.slice(1)}`, auth: RFC.auth })).toBe(false);
    expect(validKeys({ p256dh: RFC.uaPublic, auth: 'c2hvcnQ' })).toBe(false);
    expect(validKeys({ p256dh: `${RFC.uaPublic}=`, auth: RFC.auth })).toBe(false);
    for (const value of [null, undefined, 'keys', [], [RFC.uaPublic, RFC.auth]]) expect(validKeys(value)).toBe(false);
  });
});

describe('sending', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('posts one encrypted record with the headers push services require, and never follows a redirect', async () => {
    const fetch = vi.fn(async () => new Response(null, { status: 201 }));
    vi.stubGlobal('fetch', fetch);
    const vapid = { ...generateVapidKeys(), subject: 'mailto:hello@example.com' };
    const subscription = { endpoint: 'https://web.push.apple.com/QGuQ', keys: { p256dh: RFC.uaPublic, auth: RFC.auth } };

    const status = await sendPush(subscription, { v: 1, day: '2026-09-24' }, { vapid, ttl: 3600.7, topic: 'zikr-daily' });
    expect(status).toBe(201);
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe(subscription.endpoint);
    expect(init).toMatchObject({ method: 'POST', redirect: 'error' });
    expect(init.headers).toMatchObject({ 'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream', TTL: '3600', Urgency: 'normal', Topic: 'zikr-daily' });
    expect(init.headers.Authorization).toMatch(/^vapid t=.+, k=/);
    expect(JSON.parse(decrypt(init.body, RFC))).toEqual({ v: 1, day: '2026-09-24' });
  });
});
