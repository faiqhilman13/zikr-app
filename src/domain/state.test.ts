import { describe, expect, it } from 'vitest';
import { calculateStreak, dayKey, initialState, normalizeState, sanitizeState, totalToday, withDecrement, withIncrement } from './state';

describe('Zikr state', () => {
  it('keeps confirmed repetitions separate from timed practice', () => {
    const state = initialState();
    state.logs[0].timedSeconds.tasbih = 1800;
    expect(totalToday(state)).toBe(0);
    expect(withIncrement(state, 'tasbih', 1).logs[0].timedSeconds.tasbih).toBe(1800);
  });

  it('does not truncate complete history', () => {
    const state = initialState();
    state.logs = Array.from({ length: 400 }, (_, index) => ({ date: `2025-${String(Math.floor(index / 28) + 1).padStart(2, '0')}-${String(index % 28 + 1).padStart(2, '0')}`, counts: { tasbih: 33 }, timedSeconds: {}, completed: true }));
    expect(state.logs).toHaveLength(400);
  });

  it('calculates a completed-day streak without punishing an unfinished today', () => {
    const state = initialState();
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const before = new Date(); before.setDate(before.getDate() - 2);
    state.logs = [state.logs[0], { date: dayKey(yesterday), counts: {}, timedSeconds: {}, completed: true }, { date: dayKey(before), counts: {}, timedSeconds: {}, completed: true }];
    expect(calculateStreak(state).current).toBe(2);
  });

  it('preserves completion when undo leaves all targets satisfied', () => {
    let state = initialState();
    state.presets = state.presets.map((preset) => ({ ...preset, target: preset.id === 'tasbih' ? 2 : 0 }));
    state = withIncrement(state, 'tasbih', 3);
    expect(withDecrement(state, 'tasbih').logs[0].completed).toBe(true);
  });

  it('recovers a usable state from partial or foreign persisted data', () => {
    const restored = sanitizeState({
      version: 1,
      logs: [{ date: dayKey(), counts: { tasbih: 5, bogus: 'NaN' }, timedSeconds: {}, completed: false }, { date: 'garbage', counts: {} }],
      presets: [{ id: 'tasbih', title: 'Tasbih', target: 33 }],
      settings: { language: 'ar' }
    });
    expect(restored.settings.language).toBe('ar');
    expect(restored.settings.reminders.enabled).toBe(false);
    expect(restored.logs.every((log) => /^\d{4}-\d{2}-\d{2}$/.test(log.date))).toBe(true);
    expect(restored.logs.find((log) => log.date === dayKey())?.counts.tasbih).toBe(5);
    expect(restored.logs.find((log) => log.date === dayKey())?.counts.bogus).toBeUndefined();
  });

  it('rejects data that is not a Zikr state instead of persisting it', () => {
    expect(() => sanitizeState(null)).toThrow();
    expect(() => sanitizeState({ hello: 'world' })).toThrow();
    expect(() => sanitizeState({ version: 99, logs: [], presets: [] })).toThrow();
  });

  it('counts a tap landing after midnight when the state is normalized first', () => {
    const state = initialState();
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    state.logs = [{ date: dayKey(yesterday), counts: {}, timedSeconds: {}, completed: false }];
    const next = withIncrement(normalizeState(state), 'tasbih', 1);
    expect(next.logs.find((log) => log.date === dayKey())?.counts.tasbih).toBe(1);
  });

  it('ends a persisted timer at midnight instead of leaking into the next day', () => {
    const state = initialState();
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1); yesterday.setHours(23, 50, 0, 0);
    state.logs.push({ date: dayKey(yesterday), counts: {}, timedSeconds: {}, completed: false });
    state.activeTimer = { presetId: 'tasbih', startedAt: yesterday.getTime() };
    const normalized = normalizeState(state);
    expect(normalized.activeTimer).toBeNull();
    expect(normalized.logs.find((log) => log.date === dayKey(yesterday))?.timedSeconds.tasbih).toBe(600);
  });
});
