import { afterEach, describe, expect, it, vi } from 'vitest';
import { archivePreset, clampTarget, stopTimer, calculateStreak, dayKey, initialState, normalizeState, sanitizeState, totalToday, withDecrement, withIncrement } from './state';

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
      logs: [{ date: dayKey(), counts: { tasbih: 5 }, timedSeconds: {}, completed: false }],
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


afterEach(() => vi.useRealTimers());
describe('launch data integrity', () => {
  it.each(['2026-99-99', '2026-02-30', '2025-02-29', 'garbage'])('rejects invalid history date %s', (date) => {
    expect(() => sanitizeState({ ...initialState(), logs: [{ date, counts: {}, timedSeconds: {}, completed: false }] })).toThrow();
  });
  it('rejects duplicate history and duplicate phrases', () => {
    const s = initialState();
    expect(() => sanitizeState({ ...s, logs: [s.logs[0], s.logs[0]] })).toThrow();
    expect(() => sanitizeState({ ...s, presets: [s.presets[0], s.presets[0]] })).toThrow();
  });
  it('recomputes today after changing goals without rewriting past completion', () => {
    let s = initialState();
    s.presets = s.presets.map(p => ({ ...p, target: p.id === 'tasbih' ? 1 : 0 }));
    s = withIncrement(s, 'tasbih', 1);
    s.logs.push({date:'2020-01-01',counts:{tasbih:1},timedSeconds:{},completed:true});
    s.presets[0].target = 100;
    const next = normalizeState(s);
    expect(next.logs.find(l => l.date === dayKey())?.completed).toBe(false);
    expect(next.logs.find(l => l.date === '2020-01-01')?.completed).toBe(true);
  });
  it('has no completed intention when all goals are zero', () => {
    const s = initialState(); s.presets = s.presets.map(p => ({...p,target:0}));
    expect(withIncrement(s,'tasbih',1).logs[0].completed).toBe(false);
    expect(withDecrement(s,'tasbih').logs[0].completed).toBe(false);
  });
  it.each([[10000,9999],[-5,0],[3.9,3],[Infinity,0],[NaN,0]])('normalizes target %s to %s', (input, output) => expect(clampTarget(input)).toBe(output));
  it('archives a deleted phrase and banks its active timer', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date(2026,8,18,12,0,0));
    const s = initialState();
    s.presets.push({id:'custom-test',title:'Personal',arabic:'ذكر',transliteration:'',target:10,custom:true});
    s.selectedPresetId = 'custom-test'; s.logs[0].counts['custom-test'] = 7;
    s.activeTimer = {presetId:'custom-test',startedAt:Date.now()-65000};
    const next = archivePreset(s,'custom-test');
    expect(next.archivedPresets?.[0].title).toBe('Personal');
    expect(next.logs[0].counts['custom-test']).toBe(7);
    expect(next.logs[0].timedSeconds['custom-test']).toBe(65);
    expect(next.activeTimer).toBeNull();
    expect(sanitizeState(next).archivedPresets).toEqual(next.archivedPresets);
  });
  it('banks a suspended timer only to midnight and never counts it twice', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date(2026,8,19,8,0,0));
    const s = initialState();
    s.logs.push({date:'2026-09-18',counts:{},timedSeconds:{},completed:false});
    s.activeTimer = {presetId:'tasbih',startedAt:new Date(2026,8,18,23,59,0).getTime()};
    const stopped = stopTimer(s);
    expect(stopped.logs.find(l => l.date==='2026-09-18')?.timedSeconds.tasbih).toBe(60);
    expect(stopTimer(stopped)).toEqual(stopped);
    expect(stopped.logs.find(l=>l.date==='2026-09-19')?.timedSeconds.tasbih).toBeUndefined();
  });
});

it('rejects prototype identifiers in imported phrases and counts', () => {
  const s=initialState();
  expect(()=>sanitizeState({...s,presets:[{...s.presets[0],id:'constructor'}]})).toThrow();
  expect(()=>sanitizeState({...s,logs:[{...s.logs[0],counts:{constructor:1}}]})).toThrow();
});
