import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db, loadState, mutateState, replaceState, StateConflictError } from './db';
import { initialState, selectedCount, withIncrement } from '../domain/state';

beforeEach(async () => { await db.records.clear(); await db.analytics.clear(); });
afterEach(() => vi.restoreAllMocks());

describe('transactional storage', () => {
  it('does not write during initial loading', async () => {
    const put = vi.spyOn(db.records,'put');
    const s = await loadState();
    expect(s.state.onboardingComplete).toBe(false); expect(put).not.toHaveBeenCalled();
  });
  it('serializes 100 competing taps without loss', async () => {
    const s = await loadState();
    await Promise.all(Array.from({length:100},()=>mutateState(s.generation,state=>withIncrement(state,'tasbih',1))));
    expect(selectedCount((await loadState()).state)).toBe(100);
  });
  it('preserves history after a transient failed read, including a subsequent edit', async () => {
    await mutateState('original',s=>withIncrement(s,'tasbih',123));
    vi.spyOn(db.records,'get').mockRejectedValueOnce(new Error('temporary read failure'));
    await expect(loadState()).rejects.toThrow();
    expect(selectedCount((await loadState()).state)).toBe(123);
    await mutateState('original',s=>withIncrement(s,'tasbih',1));
    expect(selectedCount((await loadState()).state)).toBe(124);
  });
  it('leaves invalid rows untouched and refuses subsequent writes', async () => {
    const invalid = {...initialState(),version:99} as unknown as ReturnType<typeof initialState>;
    await db.records.put({id:'current',value:invalid});
    await expect(loadState()).rejects.toThrow();
    await expect(mutateState('original',s=>withIncrement(s,'tasbih',1))).rejects.toThrow();
    expect((await db.records.get('current'))?.value.version).toBe(99);
  });
  it('rolls back quota failures without claiming a count was saved', async () => {
    await mutateState('original',s=>withIncrement(s,'tasbih',10));
    vi.spyOn(db.records,'put').mockRejectedValueOnce(new DOMException('full','QuotaExceededError'));
    await expect(mutateState('original',s=>withIncrement(s,'tasbih',1))).rejects.toThrow();
    expect(selectedCount((await loadState()).state)).toBe(10);
  });
  it('refuses stale imports if another window counted during decryption', async () => {
    const before = await loadState();
    await mutateState(before.generation,s=>withIncrement(s,'tasbih',1));
    await expect(replaceState(before, initialState())).rejects.toBeInstanceOf(StateConflictError);
    expect(selectedCount((await loadState()).state)).toBe(1);
  });
  it('rejects queued actions from before a reset, and clears analytics atomically', async () => {
    const before = await mutateState('original',s=>withIncrement(s,'tasbih',123));
    await db.analytics.add({name:'test',at:1});
    const after = await replaceState(before, initialState(),true);
    await expect(mutateState(before.generation,s=>withIncrement(s,'tasbih',1))).rejects.toBeInstanceOf(StateConflictError);
    expect(selectedCount((await loadState()).state)).toBe(0);
    expect(await db.analytics.count()).toBe(0);
    expect(after.generation).not.toBe(before.generation);
  });
  it('upgrades legacy data and isolates old clients from the new record', async () => {
    db.close(); await Dexie.delete('zikr-pwa');
    const legacy = new Dexie('zikr-pwa'); legacy.version(1).stores({state:'id',analytics:'++id,name,at'});
    await legacy.table('state').put({id:'current',value:withIncrement(initialState(),'tasbih',42)});
    legacy.close(); await db.open();
    expect(selectedCount((await loadState()).state)).toBe(42);
    await legacy.open();
    await legacy.table('state').put({id:'current',value:initialState()});
    expect(selectedCount((await loadState()).state)).toBe(42);
    legacy.close();
  });
});
