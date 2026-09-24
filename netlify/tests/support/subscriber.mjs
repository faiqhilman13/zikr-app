import { createDecipheriv, createECDH, createHmac, randomBytes, randomUUID } from 'node:crypto';
import { expect } from 'vitest';

/**
 * The browser's side of a push subscription, for tests: a key pair and auth secret like
 * the ones a browser makes, and RFC 8291 decryption written out separately from the
 * sender, so a round trip means something.
 */

/**
 * The worked example in RFC 8291, section 5 and appendix A. Every value is the RFC's own,
 * so matching its body byte for byte is the evidence the key derivation is right, rather
 * than two halves of one misreading agreeing with each other.
 */
export const RFC = {
  plaintext: 'When I grow up, I want to be a watermelon',
  uaPublic: 'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4',
  uaPrivate: 'q1dXpw3UpT5VOmu_cf_v6ih07Aems3njxI-JWgLcM94',
  asPrivate: 'yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw',
  auth: 'BTBZMqHH6r4Tts7J_aSIgg',
  salt: 'DGv6ra1nlYgDCS1FRnbzlw',
  body: 'DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN'
};

export const b64 = (value) => Buffer.from(value, 'base64url');
const hmac = (key, data) => createHmac('sha256', key).update(data).digest();

export function decrypt(body, { uaPrivate, auth }) {
  const salt = body.subarray(0, 16);
  const idlen = body[20];
  const serverPublic = body.subarray(21, 21 + idlen);
  const ecdh = createECDH('prime256v1');
  ecdh.setPrivateKey(b64(uaPrivate));
  const shared = ecdh.computeSecret(serverPublic);
  const ikm = hmac(hmac(b64(auth), shared), Buffer.concat([Buffer.from('WebPush: info\0'), ecdh.getPublicKey(), serverPublic, Buffer.from([1])]));
  const prk = hmac(salt, ikm);
  const cek = hmac(prk, Buffer.from('Content-Encoding: aes128gcm\0\x01')).subarray(0, 16);
  const nonce = hmac(prk, Buffer.from('Content-Encoding: nonce\0\x01')).subarray(0, 12);
  const record = body.subarray(21 + idlen);
  const decipher = createDecipheriv('aes-128-gcm', cek, nonce);
  decipher.setAuthTag(record.subarray(-16));
  const padded = Buffer.concat([decipher.update(record.subarray(0, -16)), decipher.final()]);
  expect(padded.at(-1)).toBe(2);
  return padded.subarray(0, -1).toString();
}

/** A fresh subscription as PushSubscription.toJSON() gives it, and the secrets to read what it is sent. */
export function subscriber(endpoint = `https://fcm.googleapis.com/fcm/send/${randomUUID()}`) {
  const ecdh = createECDH('prime256v1');
  ecdh.generateKeys();
  const auth = randomBytes(16).toString('base64url');
  return {
    subscription: { endpoint, expirationTime: null, keys: { p256dh: ecdh.getPublicKey().toString('base64url'), auth } },
    uaPrivate: ecdh.getPrivateKey().toString('base64url'),
    auth
  };
}
