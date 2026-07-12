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
  presets: starterPresets,
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
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
const finiteCount = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : null;

const sanitizeCounts = (value: unknown): Record<string, number> => {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value).flatMap(([key, raw]) => {
    const count = finiteCount(raw);
    return count === null ? [] : [[key, count]];
  }));
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
        if (!isRecord(raw) || typeof raw.id !== 'string' || raw.id === '' || typeof raw.title !== 'string') return [];
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
  if (presets.length === 0) presets.push(...starterPresets);

  const logs: DailyLog[] = Array.isArray(value.logs)
    ? value.logs.flatMap((raw): DailyLog[] => {
        if (!isRecord(raw) || typeof raw.date !== 'string' || !DATE_KEY.test(raw.date)) return [];
        return [{
          date: raw.date,
          counts: sanitizeCounts(raw.counts),
          timedSeconds: sanitizeCounts(raw.timedSeconds),
          completed: raw.completed === true
        }];
      })
    : [];

  const rawSettings = isRecord(value.settings) ? value.settings : {};
  const rawReminders = isRecord(rawSettings.reminders) ? rawSettings.reminders : {};
  const languages: Language[] = ['en', 'ms', 'ar'];
  const themes: ThemePreference[] = ['system', 'light', 'dark'];

  const rawTimer = value.activeTimer;
  const startedAt = isRecord(rawTimer) ? finiteCount(rawTimer.startedAt) : null;
  const activeTimer = isRecord(rawTimer) && typeof rawTimer.presetId === 'string' && startedAt !== null && startedAt <= Date.now()
    ? { presetId: rawTimer.presetId, startedAt }
    : null;

  return normalizeState({
    version: 1,
    onboardingComplete: value.onboardingComplete === true,
    selectedPresetId: typeof value.selectedPresetId === 'string' && presets.some((p) => p.id === value.selectedPresetId)
      ? value.selectedPresetId
      : presets[0].id,
    presets,
    logs,
    settings: {
      language: languages.includes(rawSettings.language as Language) ? rawSettings.language as Language : defaults.settings.language,
      theme: themes.includes(rawSettings.theme as ThemePreference) ? rawSettings.theme as ThemePreference : defaults.settings.theme,
      haptics: rawSettings.haptics !== false,
      reducedMotion: rawSettings.reducedMotion === true,
      analyticsOptIn: rawSettings.analyticsOptIn === true,
      reminders: {
        enabled: rawReminders.enabled === true,
        time: typeof rawReminders.time === 'string' && /^\d{2}:\d{2}$/.test(rawReminders.time) ? rawReminders.time : defaults.settings.reminders.time,
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
  return { ...state, activeTimer, logs: [...logs].sort((a, b) => b.date.localeCompare(a.date)), lastUpdatedAt: Date.now() };
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
  if (!preset || amount <= 0) return state;
  const logs = state.logs.map((log) => log.date === today
    ? { ...log, counts: { ...log.counts, [presetId]: Math.max(0, (log.counts[presetId] ?? 0) + amount) } }
    : log);
  const completedLogs = logs.map((log) => {
    if (log.date !== today) return log;
    const allTargetsMet = presets.filter((p) => p.target > 0).every((p) => (log.counts[p.id] ?? 0) >= p.target);
    return { ...log, completed: allTargetsMet };
  });
  return { ...state, logs: completedLogs, lastUpdatedAt: Date.now() };
};

export const withDecrement = (state: ZikrState, presetId: string): ZikrState => {
  const today = dayKey();
  const logs = state.logs.map((log) => {
    if (log.date !== today) return log;
    const counts = { ...log.counts, [presetId]: Math.max(0, (log.counts[presetId] ?? 0) - 1) };
    const completed = state.presets.filter((preset) => preset.target > 0).every((preset) => (counts[preset.id] ?? 0) >= preset.target);
    return { ...log, counts, completed };
  });
  return { ...state, logs, lastUpdatedAt: Date.now() };
};
