import { webcrypto } from 'node:crypto';
import { beforeAll, describe, expect, it } from 'vitest';
import { createEncryptedBackup, readEncryptedBackup } from './backup';
import { dayKey, initialState } from '../domain/state';

beforeAll(() => { Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true }); });

describe('encrypted backups', () => {
  it('round trips without exposing state as plaintext', async () => {
    const state = initialState();
    state.logs[0].counts.tasbih = 33;
    const backup = await createEncryptedBackup(state, 'a secure phrase');
    expect(backup).not.toContain('tasbih": 33');
    const restored = await readEncryptedBackup(backup, 'a secure phrase');
    expect(restored.logs[0].counts.tasbih).toBe(33);
  });

  it('rejects the wrong passphrase', async () => {
    const backup = await createEncryptedBackup(initialState(), 'correct phrase');
    await expect(readEncryptedBackup(backup, 'wrong phrase')).rejects.toThrow();
  });

  it('rejects a backup whose decrypted payload is not a Zikr state', async () => {
    const state = initialState();
    (state as unknown as Record<string, unknown>).logs = 'not-an-array-of-logs';
    delete (state as unknown as Record<string, unknown>).version;
    const backup = await createEncryptedBackup(state, 'a secure phrase');
    await expect(readEncryptedBackup(backup, 'a secure phrase')).rejects.toThrow();
  });

  it('exports and restores a multi-year history without overflowing', async () => {
    const state = initialState();
    state.logs = Array.from({ length: 1200 }, (_, index) => {
      const date = new Date(2022, 0, 1 + index);
      return { date: dayKey(date), counts: { tasbih: 33, tahmid: 33, tahlil: 100 }, timedSeconds: { tasbih: 900 }, completed: true };
    });
    const backup = await createEncryptedBackup(state, 'a secure phrase');
    const restored = await readEncryptedBackup(backup, 'a secure phrase');
    expect(restored.logs.length).toBeGreaterThanOrEqual(1200);
    expect(restored.logs.some((log) => log.timedSeconds.tasbih === 900)).toBe(true);
  }, 30_000);
});
