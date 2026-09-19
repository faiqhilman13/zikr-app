import type { ActiveTimer, DailyLog, DhikrPreset, ZikrState } from './types';
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

export const MIN_SECONDS_PER_REP = 0.5;
export const MAX_SECONDS_PER_REP = 600;
export const DEFAULT_SECONDS_PER_REP = 3;
/** A counting session stops after an hour. Left running by accident it would otherwise
 * keep adding repetitions nobody recited, and those counts feed streaks and history. */
export const MAX_SESSION_SECONDS = 3600;

/** A recitation pace in seconds, or null when the value cannot be one. One decimal is
 * as fine as a spoken phrase can be measured, and keeps the repetition maths stable. */
export const clampPace = (value: unknown): number | null => typeof value === 'number' && Number.isFinite(value) && value > 0
  ? Math.min(MAX_SECONDS_PER_REP, Math.max(MIN_SECONDS_PER_REP, Math.round(value * 10) / 10))
  : null;

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
        const pace = clampPace(raw.secondsPerRep);
        return [{
          id: raw.id,
          title: raw.title,
          arabic: typeof raw.arabic === 'string' ? raw.arabic : '',
          transliteration: typeof raw.transliteration === 'string' ? raw.transliteration : '',
          target: target === null ? 0 : Math.min(9999, target),
          ...(raw.custom === true ? { custom: true } : {}),
          ...(pace === null ? {} : { secondsPerRep: pace })
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
  // A pace without a credited tally would re-award every repetition the session has
  // already banked, so the two are only ever restored together.
  const timerPace = isRecord(rawTimer) ? clampPace(rawTimer.secondsPerRep) : null;
  const creditedReps = isRecord(rawTimer) ? finiteCount(rawTimer.creditedReps) : null;
  const activeTimer: ActiveTimer | null = isRecord(rawTimer) && typeof rawTimer.presetId === 'string' && startedAt !== null && Number.isFinite(new Date(startedAt).getTime()) && presets.some((p) => p.id === rawTimer.presetId) && startedAt <= Date.now()
    ? { presetId: rawTimer.presetId, startedAt, ...(timerPace === null ? {} : { secondsPerRep: timerPace, creditedReps: creditedReps ?? 0 }) }
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

const withLog = (logs: DailyLog[], date: string) => logs.some((log) => log.date === date) ? logs : [...logs, emptyLog(date)];

/** The moment a session must stop: midnight of the day it began, and for a counting
 * session no later than MAX_SESSION_SECONDS after it started. */
const timerLimit = (timer: ActiveTimer) => {
  const started = new Date(timer.startedAt);
  const midnight = new Date(started.getFullYear(), started.getMonth(), started.getDate() + 1).getTime();
  return timer.secondsPerRep ? Math.min(midnight, timer.startedAt + MAX_SESSION_SECONDS * 1000) : midnight;
};

/** Seconds the session has run, never past its limit. */
export const timerSeconds = (timer: ActiveTimer, at = Date.now()) =>
  Math.max(0, Math.floor((Math.min(at, timerLimit(timer)) - timer.startedAt) / 1000));

/** Repetitions a counting session has earned. Only whole repetitions count: a phrase
 * half said is not a repetition, and a time-only session earns none at all. */
export const timerReps = (timer: ActiveTimer, at = Date.now()) =>
  timer.secondsPerRep ? Math.floor(timerSeconds(timer, at) / timer.secondsPerRep) : 0;

/** Repetitions earned but not yet written to the log — what the counter shows on top
 * of the stored count between one credit and the next. */
export const uncreditedReps = (timer: ActiveTimer, at = Date.now()) =>
  Math.max(0, timerReps(timer, at) - (timer.creditedReps ?? 0));

/** Move a session's elapsed seconds, and any repetitions it still owes, into the log
 * for the day it began. Time is banked in both modes; repetitions only in counting mode. */
const withBankedTimer = (logs: DailyLog[], timer: ActiveTimer, at: number): DailyLog[] => {
  const startedKey = dayKey(new Date(timer.startedAt));
  const seconds = timerSeconds(timer, at);
  const reps = uncreditedReps(timer, at);
  return withLog(logs, startedKey).map((log) => log.date === startedKey ? {
    ...log,
    counts: reps > 0 ? { ...log.counts, [timer.presetId]: (log.counts[timer.presetId] ?? 0) + reps } : log.counts,
    timedSeconds: { ...log.timedSeconds, [timer.presetId]: (log.timedSeconds[timer.presetId] ?? 0) + seconds }
  } : log);
};

export const normalizeState = (state: ZikrState): ZikrState => {
  const today = dayKey();
  let logs = withLog(state.logs, today);
  let activeTimer = state.activeTimer;
  // A session past midnight, or past the counting session cap, is banked at that limit.
  // Reopening the app hours later must never invent time or repetitions.
  if (activeTimer && Date.now() >= timerLimit(activeTimer)) {
    logs = withBankedTimer(logs, activeTimer, timerLimit(activeTimer));
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
  return normalizeState({ ...normalized, activeTimer: null, logs: withBankedTimer(normalized.logs, normalized.activeTimer, Date.now()) });
};

/** Write the repetitions a counting session has earned so far into its day's log, and
 * record how many were banked. Ticking twice on the same second adds nothing, so a
 * repetition is never counted twice. */
export const creditTimerReps = (state: ZikrState, at = Date.now()): ZikrState => {
  const timer = state.activeTimer;
  if (!timer?.secondsPerRep) return state;
  const owed = uncreditedReps(timer, at);
  if (owed <= 0) return state;
  const startedKey = dayKey(new Date(timer.startedAt));
  const logs = withLog(state.logs, startedKey).map((log) => log.date === startedKey
    ? { ...log, counts: { ...log.counts, [timer.presetId]: (log.counts[timer.presetId] ?? 0) + owed } }
    : log);
  return normalizeState({ ...state, logs, activeTimer: { ...timer, creditedReps: timerReps(timer, at) } });
};

/** Begin a session on the selected phrase. A pace starts a counting session and is
 * remembered on the phrase; without one the session only records time. */
export const startTimer = (state: ZikrState, secondsPerRep?: number | null): ZikrState => {
  if (state.activeTimer) return state;
  const pace = clampPace(secondsPerRep);
  const presetId = state.selectedPresetId;
  if (!state.presets.some((preset) => preset.id === presetId)) return state;
  return {
    ...state,
    presets: pace === null ? state.presets : state.presets.map((preset) => preset.id === presetId ? { ...preset, secondsPerRep: pace } : preset),
    activeTimer: { presetId, startedAt: Date.now(), ...(pace === null ? {} : { secondsPerRep: pace, creditedReps: 0 }) },
    lastUpdatedAt: Date.now()
  };
};
export const archivePreset = (state: ZikrState, id: string): ZikrState => {
  const preset = state.presets.find((p) => p.id === id);
  if (!preset?.custom || state.presets.length <= 1) return state;
  const stopped = state.activeTimer?.presetId === id ? stopTimer(state) : state;
  const presets = stopped.presets.filter((p) => p.id !== id);
  return normalizeState({ ...stopped, presets, archivedPresets: [...(stopped.archivedPresets ?? []), { ...preset, target: 0 }], selectedPresetId: state.selectedPresetId === id ? presets[0].id : state.selectedPresetId });
};
