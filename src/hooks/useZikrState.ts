import { useCallback, useEffect, useState } from 'react';
import { loadState, saveState } from '../data/db';
import { dayKey, initialState, normalizeState, withDecrement, withIncrement } from '../domain/state';
import type { DhikrPreset, Language, ThemePreference, ZikrState } from '../domain/types';

export function useZikrState() {
  const [state, setState] = useState<ZikrState>(initialState);
  const [ready, setReady] = useState(false);
  const [storageFailed, setStorageFailed] = useState(false);

  useEffect(() => {
    void loadState().then(({ state: value, persisted }) => {
      setState(value);
      setStorageFailed(!persisted);
      setReady(true);
    });
  }, []);

  const persist = useCallback((value: ZikrState) => {
    saveState(value).then(() => setStorageFailed(false)).catch(() => setStorageFailed(true));
  }, []);

  // Normalizing BEFORE the updater guarantees today's log exists, so updates that land
  // just after midnight are never written into a day that is not in the log list yet.
  const commit = useCallback((updater: (current: ZikrState) => ZikrState) => {
    setState((current) => {
      const next = normalizeState(updater(normalizeState(current)));
      persist(next);
      return next;
    });
  }, [persist]);

  const setTimerRunning = useCallback((run: boolean) => commit((s) => {
    if (run) {
      return s.activeTimer ? s : { ...s, activeTimer: { presetId: s.selectedPresetId, startedAt: Date.now() } };
    }
    if (!s.activeTimer) return s;
    const elapsed = Math.max(0, Math.floor((Date.now() - s.activeTimer.startedAt) / 1000));
    const activeId = s.activeTimer.presetId;
    return {
      ...s,
      activeTimer: null,
      logs: s.logs.map((log) => log.date === dayKey() ? { ...log, timedSeconds: { ...log.timedSeconds, [activeId]: (log.timedSeconds[activeId] ?? 0) + elapsed } } : log)
    };
  }), [commit]);

  return {
    state,
    ready,
    storageFailed,
    setState: (next: ZikrState) => { const normalized = normalizeState(next); setState(normalized); persist(normalized); },
    refresh: () => commit((s) => s),
    completeOnboarding: (presetId: string, target: number) => commit((s) => ({ ...s, onboardingComplete: true, selectedPresetId: presetId, presets: s.presets.map((p) => p.id === presetId ? { ...p, target } : { ...p, target: 0 }) })),
    selectPreset: (id: string) => commit((s) => ({ ...s, selectedPresetId: id })),
    increment: (amount = 1) => commit((s) => withIncrement(s, s.selectedPresetId, amount)),
    decrement: () => commit((s) => withDecrement(s, s.selectedPresetId)),
    updatePreset: (id: string, changes: Partial<DhikrPreset>) => commit((s) => ({ ...s, presets: s.presets.map((p) => p.id === id ? { ...p, ...changes } : p) })),
    addPreset: (preset: DhikrPreset) => commit((s) => ({ ...s, presets: [...s.presets, preset], selectedPresetId: preset.id })),
    removePreset: (id: string) => commit((s) => {
      const presets = s.presets.filter((p) => p.id !== id);
      if (presets.length === 0) return s;
      return { ...s, presets, selectedPresetId: presets.some((p) => p.id === s.selectedPresetId) ? s.selectedPresetId : presets[0].id };
    }),
    setLanguage: (language: Language) => commit((s) => ({ ...s, settings: { ...s.settings, language } })),
    setTheme: (theme: ThemePreference) => commit((s) => ({ ...s, settings: { ...s.settings, theme } })),
    patchSettings: (changes: Partial<ZikrState['settings']>) => commit((s) => ({ ...s, settings: { ...s.settings, ...changes } })),
    setTimerRunning
  };
}
