import { useCallback, useEffect, useRef, useState } from 'react';
import { liveQuery } from 'dexie';
import { loadState, mutateState, replaceState, StateConflictError, type Snapshot } from '../data/db';
import { archivePreset, clampTarget, creditTimerReps, initialState, startTimer, stopTimer, withDecrement, withIncrement } from '../domain/state';
import type { DhikrPreset, Language, ThemePreference, ZikrState } from '../domain/types';

const CREDIT_INTERVAL_MS = 5_000;

export function useZikrState() {
  const [state, setState] = useState<ZikrState>(initialState);
  const [ready, setReady] = useState(false);
  const [storageFailed, setStorageFailed] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [pending, setPending] = useState(0);
  const latest = useRef<Snapshot | null>(null);
  const blocked = useRef(false);
  const queue = useRef<Promise<unknown>>(Promise.resolve());

  const accept = useCallback((next: Snapshot) => {
    if (!latest.current || next.revision >= latest.current.revision) {
      latest.current = next;
      setState(next.state);
    }
    setReady(true);
  }, []);
  const fail = useCallback(() => { blocked.current = true; setStorageFailed(true); setReady(true); }, []);

  useEffect(() => {
    const subscription = liveQuery(loadState).subscribe({ next: accept, error: fail });
    const refresh = () => { if (!blocked.current) void loadState().then(accept).catch(fail); };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      subscription.unsubscribe();
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [accept, fail]);

  const enqueue = useCallback((operation: () => Promise<Snapshot>): Promise<boolean> => {
    if (blocked.current || !latest.current) return Promise.resolve(false);
    setPending((n) => n + 1);
    const result = queue.current.then(async () => {
      if (blocked.current) return false;
      try { accept(await operation()); return true; }
      catch (error) {
        if (error instanceof StateConflictError) {
          setConflict(true);
          try { accept(await loadState()); } catch { fail(); }
        } else fail();
        return false;
      }
    }).finally(() => setPending((n) => n - 1));
    queue.current = result;
    return result;
  }, [accept, fail]);

  const commit = useCallback((update: (current: ZikrState) => ZikrState) => {
    const generation = latest.current?.generation;
    return enqueue(() => mutateState(generation ?? '', update));
  }, [enqueue]);

  // Repetitions are banked on a short cycle rather than only when the session ends, so
  // a closed tab or a dead battery costs at most a few seconds of practice. Crediting
  // lives here, not in the counter screen, so it keeps running from any tab.
  const countingSince = state.activeTimer?.secondsPerRep ? state.activeTimer.startedAt : null;
  useEffect(() => {
    if (countingSince === null) return;
    const credit = () => { void commit((s) => creditTimerReps(s)); };
    const interval = window.setInterval(credit, CREDIT_INTERVAL_MS);
    // Bank on the way out as well: a backgrounded tab may never run another interval.
    const onHide = () => { if (document.visibilityState === 'hidden') credit(); };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', credit);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', credit);
      credit();
    };
  }, [countingSince, commit]);

  // The rendered snapshot is deliberately captured before async import/confirmation.
  // A concurrent mutation must cause a conflict rather than be erased.
  const renderedSnapshot = latest.current;
  const restore = (next: ZikrState) => enqueue(() => replaceState(renderedSnapshot!, {
    ...next, activeTimer: null,
    settings: { ...next.settings, analyticsOptIn: false, reminders: { ...next.settings.reminders, enabled: false, pushEnabled: false } }
  }));

  return {
    state, ready, storageFailed, conflict, pending: pending > 0,
    clearConflict: () => setConflict(false),
    setState: restore,
    reset: () => enqueue(() => replaceState(renderedSnapshot!, initialState(), true)),
    refresh: useCallback(() => { if (!blocked.current) void loadState().then(accept).catch(fail); }, [accept, fail]),
    completeOnboarding: (presetId: string, target: number) => commit((s) => ({ ...s, onboardingComplete: true, selectedPresetId: presetId, presets: s.presets.map((p) => ({ ...p, target: p.id === presetId ? clampTarget(target) : 0 })) })),
    selectPreset: (id: string) => commit((s) => s.presets.some((p) => p.id === id) ? { ...stopTimer(s), selectedPresetId: id } : s),
    // Capture the visible phrase: another window changing its selection must not
    // redirect this tap to an unexpected phrase.
    increment: (amount = 1) => commit((s) => withIncrement(s, state.selectedPresetId, amount)),
    decrement: () => commit((s) => withDecrement(s, state.selectedPresetId)),
    updatePreset: (id: string, changes: Partial<DhikrPreset>) => commit((s) => ({ ...s, presets: s.presets.map((p) => p.id === id ? { ...p, ...changes, id: p.id, target: clampTarget(changes.target ?? p.target) } : p) })),
    addPreset: (preset: DhikrPreset) => commit((s) => ({ ...stopTimer(s), presets: [...s.presets, { ...preset, target: clampTarget(preset.target) }], selectedPresetId: preset.id })),
    removePreset: (id: string) => commit((s) => archivePreset(s, id)),
    setLanguage: (language: Language) => commit((s) => ({ ...s, settings: { ...s.settings, language } })),
    setTheme: (theme: ThemePreference) => commit((s) => ({ ...s, settings: { ...s.settings, theme } })),
    patchSettings: (changes: Partial<ZikrState['settings']>) => commit((s) => ({ ...s, settings: { ...s.settings, ...changes } })),
    // A pace starts a counting session; omitting it records time only.
    startTimer: (secondsPerRep?: number | null) => commit((s) => startTimer(s, secondsPerRep)),
    stopTimer: () => commit((s) => stopTimer(s)),
    creditTimer: () => commit((s) => creditTimerReps(s))
  };
}
