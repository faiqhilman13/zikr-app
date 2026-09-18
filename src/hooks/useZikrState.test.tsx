import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { db, loadState, mutateState, replaceState } from '../data/db';
import { initialState, selectedCount, withIncrement } from '../domain/state';
import { useZikrState } from './useZikrState';
beforeEach(async () => { await db.records.clear(); });
afterEach(() => vi.restoreAllMocks());
it('keeps both mounted windows up to date and preserves concurrent taps', async () => {
  const a=renderHook(useZikrState), b=renderHook(useZikrState);
  await waitFor(()=>expect(a.result.current.ready && b.result.current.ready).toBe(true));
  await act(async()=> { await Promise.all([a.result.current.increment(10),b.result.current.increment()]); });
  await waitFor(()=> {expect(selectedCount(a.result.current.state)).toBe(11);expect(selectedCount(b.result.current.state)).toBe(11);});
});
it('blocks user edits after failed startup without overwriting the original row', async () => {
  await mutateState('original',s=>withIncrement(s,'tasbih',123));
  vi.spyOn(db.records,'get').mockRejectedValueOnce(new Error('temporarily unavailable'));
  const hook=renderHook(useZikrState);
  await waitFor(()=>expect(hook.result.current.storageFailed).toBe(true));
  await act(async()=>{expect(await hook.result.current.increment()).toBe(false);});
  expect(selectedCount((await loadState()).state)).toBe(123);
});
it('does not announce a successful write when storage fills up', async () => {
  const hook=renderHook(useZikrState); await waitFor(()=>expect(hook.result.current.ready).toBe(true));
  vi.spyOn(db.records,'put').mockRejectedValueOnce(new DOMException('full','QuotaExceededError'));
  await act(async()=>{expect(await hook.result.current.increment()).toBe(false);});
  expect(hook.result.current.storageFailed).toBe(true);
  expect(selectedCount(hook.result.current.state)).toBe(0);
});
it('rejects stale import handlers instead of erasing newly recorded taps', async () => {
  const hook=renderHook(useZikrState); await waitFor(()=>expect(hook.result.current.ready).toBe(true));
  const restore=hook.result.current.setState;
  await act(async()=>{await mutateState('original',s=>withIncrement(s,'tasbih',10));});
  await act(async()=>{expect(await restore(initialState())).toBe(false);});
  expect(hook.result.current.conflict).toBe(true);
  expect(selectedCount((await loadState()).state)).toBe(10);
});
it('rejects queued actions from an older data generation', async () => {
  const hook=renderHook(useZikrState); await waitFor(()=>expect(hook.result.current.ready).toBe(true));
  // Both operations enter the database before live-query can propagate the reset.
  await act(async()=>{
    const reset=replaceState(await loadState(),initialState());
    const tap=hook.result.current.increment();
    await reset; expect(await tap).toBe(false);
  });
  expect(selectedCount((await loadState()).state)).toBe(0);
});
