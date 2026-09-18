import type { ZikrState } from '../domain/types';
import { sanitizeState } from '../domain/state';
import i18n from '../i18n';
import { isAppleMobile, isStandalone } from '../services/platform';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

// Spreading a large array into String.fromCharCode overflows the argument limit
// (~65k in JSC), so long histories must be converted in chunks.
const bytesToBase64 = (bytes: Uint8Array) => {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(binary);
};
const base64ToBytes = (value: string) => Uint8Array.from(atob(value), (char) => char.charCodeAt(0));

const CURRENT_ITERATIONS = 600_000;
const LEGACY_ITERATIONS = 210_000;

async function deriveKey(passphrase: string, salt: Uint8Array, iterations: number, usage: KeyUsage[]) {
  const material = await crypto.subtle.importKey('raw', encoder.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    usage
  );
}

export async function createEncryptedBackup(state: ZikrState, passphrase: string) {
  if (passphrase.length < 8) throw new Error(i18n.t('passphraseTooShort'));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt, CURRENT_ITERATIONS, ['encrypt']);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(JSON.stringify(state)));
  return JSON.stringify({
    format: 'zikr-backup',
    version: 2,
    iterations: CURRENT_ITERATIONS,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    data: bytesToBase64(new Uint8Array(ciphertext))
  }, null, 2);
}

export async function readEncryptedBackup(content: string, passphrase: string): Promise<ZikrState> {
  if (content.length > 20_000_000) throw new Error(i18n.t('backupInvalid'));
  const parsed = JSON.parse(content) as { format: string; version: number; iterations?: number; salt: string; iv: string; data: string };
  if (!parsed || parsed.format !== 'zikr-backup' || (parsed.version !== 1 && parsed.version !== 2)) throw new Error(i18n.t('backupUnsupportedFormat'));
  const iterations = parsed.version === 1 ? LEGACY_ITERATIONS : parsed.iterations ?? CURRENT_ITERATIONS;
  if (!Number.isInteger(iterations) || iterations < LEGACY_ITERATIONS || iterations > CURRENT_ITERATIONS || typeof parsed.salt !== 'string' || typeof parsed.iv !== 'string' || typeof parsed.data !== 'string') throw new Error(i18n.t('backupInvalid'));
  const salt = base64ToBytes(parsed.salt);
  const iv = base64ToBytes(parsed.iv);
  if (salt.length !== 16 || iv.length !== 12) throw new Error(i18n.t('backupInvalid'));
  const key = await deriveKey(passphrase, salt, iterations, ['decrypt']);
  const clear = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, base64ToBytes(parsed.data));
  return sanitizeState(JSON.parse(decoder.decode(clear)));
}

export async function saveTextFile(filename: string, content: string) {
  const file = new File([content], filename, { type: 'application/json' });
  // Installed iOS web apps have no download manager; the share sheet is the reliable path.
  if (isAppleMobile() && isStandalone() && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return true;
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError') return false;
      throw error;
    }
  }
  const url = URL.createObjectURL(file);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
  return true;
}
