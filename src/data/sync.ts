import { createEncryptedBackup, readEncryptedBackup } from './backup';
import type { ZikrState } from '../domain/types';
import i18n from '../i18n';

export const syncConfigured = Boolean(import.meta.env.VITE_SYNC_ENDPOINT);

export async function uploadEncryptedSync(state: ZikrState, passphrase: string) {
  const endpoint = import.meta.env.VITE_SYNC_ENDPOINT as string | undefined;
  if (!endpoint) throw new Error(i18n.t('syncNotConfigured'));
  const body = await createEncryptedBackup(state, passphrase);
  const response = await fetch(endpoint, { method: 'PUT', headers: { 'content-type': 'application/json' }, body });
  if (!response.ok) throw new Error(i18n.t('syncUploadFailed'));
}

export async function downloadEncryptedSync(passphrase: string) {
  const endpoint = import.meta.env.VITE_SYNC_ENDPOINT as string | undefined;
  if (!endpoint) throw new Error(i18n.t('syncNotConfigured'));
  const response = await fetch(endpoint, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(i18n.t('syncDownloadFailed'));
  return readEncryptedBackup(await response.text(), passphrase);
}
