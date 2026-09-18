import type { DailyLog, DhikrPreset, ZikrState } from './types';
import type { Language, ThemePreference } from './types';

export const starterPresets: DhikrPreset[] = [
  { id: 'tasbih', title: 'Tasbih', arabic: 'سُبْحَانَ ٱللَّٰهِ', transliteration: 'SubhanAllah', target: 33 },
  { id: 'tahmid', title: 'Tahmid', arabic: 'ٱلْحَمْدُ لِلَّٰهِ', transliteration: 'Alhamdulillah', target: 33 },
  { id: 'takbir', title: 'Takbir', arabic: 'ٱللَّٰهُ أَكْبَرُ', transliteration: 'Allahu Akbar', target: 34 },
  { id: 'tahlil', title: 'Tahlil', arabic: 'لَا إِلَٰهَ إِلَّا ٱللَّٰهُ', transliteration: 'La ilaha illa Allah', target: 100 },
  { id: 'salawat', title: 'Salawat', arabic: 'ٱللَّٰهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ', transliteration: 'Allahumma salli ‘ala Muhammad', target: 100 }
];

export const dayKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const emptyLog = (date = dayKey()): DailyLog => ({ date, counts: {}, timedSeconds: {}, completed: false });

export const initialState = (): ZikrState => ({
  version: 1,
  onboardingComplete: false,
  selectedPresetId: 'tasbih',
  presets: starterPresets.map((preset) => ({ ...preset })),
  archivedPresets: [],
  logs: [emptyLog()],
  settings: {
    language: 'en',
    theme: 'system',
    haptics: true,
    reducedMotion: false,
    analyticsOptIn: false,
    reminders: { enabled: false, time: '21:00', pushEnabled: false }
  },
  activeTimer: null,
  lastUpdatedAt: Date.now()
});

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
export const clampTarget = (value: number) => Number.isFinite(value) ? Math.min(9999, Math.max(0, Math.floor(value))) : 0;
export const validDateKey = (value: string) => {
  if (!DATE_KEY.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return Number.isFinite(date.getTime()) && dayKey(date) === value;
};
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
const finiteCount = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : null;

const safeId = (id: string) => id.length > 0 && id.length <= 128 && !(id in Object.prototype);

const sanitizeCounts = (value: unknown): Record<string, number> => {
  if (!isRecord(value) || Array.isArray(value)) throw new Error('Invalid history counts.');
  const entries = Object.entries(value);
  if (entries.some(([key, raw]) => !safeId(key) || typeof raw !== 'number' || !Number.isSafeInteger(raw) || raw < 0)) throw new Error('Invalid history counts.');
  return Object.fromEntries(entries) as Record<string, number>;
};

/**
 * Validates untrusted data (imported backups, the persisted IndexedDB row) into a usable
 * ZikrState, or throws. Unknown settings fields are dropped; missing ones get defaults, so
 * older backups keep restoring after the settings shape grows.
 */
export const sanitizeState = (value: unknown): ZikrState => {
  if (!isRecord(value) || value.version !== 1) throw new Error('Unsupported Zikr data.');
  const defaults = initialState();

  const presets: DhikrPreset[] = Array.isArray(value.presets)
    ? value.presets.flatMap((raw): DhikrPreset[] => {
        if (!isRecord(raw) || typeof raw.id !== 'string' || !safeId(raw.id) || typeof raw.title !== 'string') return [];
        const target = finiteCount(raw.target);
        return [{
          id: raw.id,
          title: raw.title,
          arabic: typeof raw.arabic === 'string' ? raw.arabic : '',
          transliteration: typeof raw.transliteration === 'string' ? raw.transliteration : '',
          target: target === null ? 0 : Math.min(9999, target),
          ...(raw.custom === true ? { custom: true } : {})
        }];
      })
    : [];
  if (value.presets !== undefined && (!Array.isArray(value.presets) || presets.length !== value.presets.length)) throw new Error('Invalid phrases.');
  if (presets.length === 0) presets.push(...starterPresets);

  if (!Array.isArray(value.logs)) throw new Error('Invalid history.');
  const dates = new Set<string>();
  const logs: DailyLog[] = value.logs.map((raw): DailyLog => {
    if (!isRecord(raw) || typeof raw.date !== 'string' || !validDateKey(raw.date) || dates.has(raw.date)) throw new Error('Invalid or duplicate history date.');
    if (!isRecord(raw.counts) || !isRecord(raw.timedSeconds)) throw new Error('Invalid history counts.');
    dates.add(raw.date);
    return { date: raw.date, counts: sanitizeCounts(raw.counts), timedSeconds: sanitizeCounts(raw.timedSeconds), completed: raw.completed === true };
  });
  const ids = new Set<string>();
  for (const preset of presets) {
    if (ids.has(preset.id)) throw new Error('Duplicate phrase.');
    ids.add(preset.id);
  }
  const archivedPresets: DhikrPreset[] = Array.isArray(value.archivedPresets) ? value.archivedPresets.map((raw) => {
    if (!isRecord(raw) || typeof raw.id !== 'string' || !safeId(raw.id) || typeof raw.title !== 'string' || ids.has(raw.id)) throw new Error('Invalid archived phrase.');
    ids.add(raw.id);
    return { id: raw.id, title: raw.title, arabic: typeof raw.arabic === 'string' ? raw.arabic : '', transliteration: typeof raw.transliteration === 'string' ? raw.transliteration : '', target: 0, custom: true };
  }) : [];

  const rawSettings = isRecord(value.settings) ? value.settings : {};
  const rawReminders = isRecord(rawSettings.reminders) ? rawSettings.reminders : {};
  const languages: Language[] = ['en', 'ms', 'ar'];
  const themes: ThemePreference[] = ['system', 'light', 'dark'];

  const rawTimer = value.activeTimer;
  const startedAt = isRecord(rawTimer) ? finiteCount(rawTimer.startedAt) : null;
  const activeTimer = isRecord(rawTimer) && typeof rawTimer.presetId === 'string' && startedAt !== null && Number.isFinite(new Date(startedAt).getTime()) && presets.some((p) => p.id === rawTimer.presetId) && startedAt <= Date.now()
    ? { presetId: rawTimer.presetId, startedAt }
    : null;

  return normalizeState({
    version: 1,
    onboardingComplete: value.onboardingComplete === true,
    selectedPresetId: typeof value.selectedPresetId === 'string' && presets.some((p) => p.id === value.selectedPresetId)
      ? value.selectedPresetId
      : presets[0].id,
    presets,
    archivedPresets,
    logs,
    settings: {
      language: languages.includes(rawSettings.language as Language) ? rawSettings.language as Language : defaults.settings.language,
      theme: themes.includes(rawSettings.theme as ThemePreference) ? rawSettings.theme as ThemePreference : defaults.settings.theme,
      haptics: rawSettings.haptics !== false,
      reducedMotion: rawSettings.reducedMotion === true,
      analyticsOptIn: rawSettings.analyticsOptIn === true,
      reminders: {
        enabled: rawReminders.enabled === true,
        time: typeof rawReminders.time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(rawReminders.time) ? rawReminders.time : defaults.settings.reminders.time,
        pushEnabled: rawReminders.pushEnabled === true
      }
    },
    activeTimer,
    lastUpdatedAt: finiteCount(value.lastUpdatedAt) ?? Date.now()
  });
};

export const normalizeState = (state: ZikrState): ZikrState => {
  const today = dayKey();
  let logs = state.logs.some((log) => log.date === today) ? state.logs : [...state.logs, emptyLog(today)];
  let activeTimer = state.activeTimer;
  if (activeTimer && dayKey(new Date(activeTimer.startedAt)) !== today) {
    const started = new Date(activeTimer.startedAt);
    const midnight = new Date(started.getFullYear(), started.getMonth(), started.getDate() + 1).getTime();
    const elapsed = Math.max(0, Math.floor((midnight - activeTimer.startedAt) / 1000));
    const startedKey = dayKey(started);
    const timerPresetId = activeTimer.presetId;
    logs = logs.map((log) => log.date === startedKey ? { ...log, timedSeconds: { ...log.timedSeconds, [timerPresetId]: (log.timedSeconds[timerPresetId] ?? 0) + elapsed } } : log);
    activeTimer = null;
  }
  const presets = state.presets.map((preset) => ({ ...preset, target: clampTarget(preset.target) }));
  const targets = presets.filter((preset) => preset.target > 0);
  logs = logs.map((log) => log.date === today ? { ...log, completed: targets.length > 0 && targets.every((p) => (log.counts[p.id] ?? 0) >= p.target) } : log);
  return { ...state, presets, activeTimer, logs: [...logs].sort((a, b) => b.date.localeCompare(a.date)), lastUpdatedAt: Date.now() };
};

export const getToday = (state: ZikrState) => state.logs.find((log) => log.date === dayKey()) ?? emptyLog();
export const totalForLog = (log: DailyLog) => Object.values(log.counts).reduce((sum, value) => sum + value, 0);
export const totalTarget = (state: ZikrState) => state.presets.reduce((sum, preset) => sum + Math.max(0, preset.target), 0);
export const totalToday = (state: ZikrState) => totalForLog(getToday(state));
export const selectedPreset = (state: ZikrState) => state.presets.find((p) => p.id === state.selectedPresetId) ?? state.presets[0];
export const selectedCount = (state: ZikrState) => getToday(state).counts[state.selectedPresetId] ?? 0;

export const calculateStreak = (state: ZikrState) => {
  const completed = new Set(state.logs.filter((log) => log.completed).map((log) => log.date));
  const cursor = new Date();
  if (!completed.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let current = 0;
  while (completed.has(dayKey(cursor))) {
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  let longest = 0;
  let run = 0;
  const ascending = [...state.logs].sort((a, b) => a.date.localeCompare(b.date));
  let previous: Date | null = null;
  for (const log of ascending) {
    if (!log.completed) continue;
    const date = new Date(`${log.date}T12:00:00`);
    const consecutive = previous && Math.round((date.getTime() - previous.getTime()) / 86_400_000) === 1;
    run = consecutive ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = date;
  }
  return { current, longest };
};

export const withIncrement = (state: ZikrState, presetId: string, amount: number): ZikrState => {
  const today = dayKey();
  const presets = state.presets;
  const preset = presets.find((item) => item.id === presetId);
  if (!preset || !Number.isSafeInteger(amount) || amount <= 0) return state;
  const logs = state.logs.map((log) => log.date === today
    ? { ...log, counts: { ...log.counts, [presetId]: Math.max(0, (log.counts[presetId] ?? 0) + amount) } }
    : log);
  const completedLogs = logs.map((log) => {
    if (log.date !== today) return log;
    const allTargetsMet = presets.some((p) => p.target > 0) && presets.filter((p) => p.target > 0).every((p) => (log.counts[p.id] ?? 0) >= p.target);
    return { ...log, completed: allTargetsMet };
  });
  return { ...state, logs: completedLogs, lastUpdatedAt: Date.now() };
};

export const withDecrement = (state: ZikrState, presetId: string): ZikrState => {
  const today = dayKey();
  const logs = state.logs.map((log) => {
    if (log.date !== today) return log;
    const counts = { ...log.counts, [presetId]: Math.max(0, (log.counts[presetId] ?? 0) - 1) };
    const completed = state.presets.some((preset) => preset.target > 0) && state.presets.filter((preset) => preset.target > 0).every((preset) => (counts[preset.id] ?? 0) >= preset.target);
    return { ...log, counts, completed };
  });
  return { ...state, logs, lastUpdatedAt: Date.now() };
};

/** Bank a timer before switching/deleting its phrase. A suspended session is capped
 * at its starting day's midnight; reopening never invents overnight practice. */
export const stopTimer = (state: ZikrState): ZikrState => {
  const normalized = normalizeState(state);
  if (!normalized.activeTimer) return normalized;
  const { presetId, startedAt } = normalized.activeTimer;
  const elapsed = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  return { ...normalized, activeTimer: null, logs: normalized.logs.map((log) => log.date === dayKey() ? { ...log, timedSeconds: { ...log.timedSeconds, [presetId]: (log.timedSeconds[presetId] ?? 0) + elapsed } } : log) };
};
export const archivePreset = (state: ZikrState, id: string): ZikrState => {
  const preset = state.presets.find((p) => p.id === id);
  if (!preset?.custom || state.presets.length <= 1) return state;
  const stopped = state.activeTimer?.presetId === id ? stopTimer(state) : state;
  const presets = stopped.presets.filter((p) => p.id !== id);
  return normalizeState({ ...stopped, presets, archivedPresets: [...(stopped.archivedPresets ?? []), { ...preset, target: 0 }], selectedPresetId: state.selectedPresetId === id ? presets[0].id : state.selectedPresetId });
};
