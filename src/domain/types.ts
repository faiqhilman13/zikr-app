export type Language = 'en' | 'ms' | 'id' | 'ar';
export type ThemePreference = 'system' | 'light' | 'dark';

export interface DhikrPreset {
  id: string;
  title: string;
  arabic: string;
  transliteration: string;
  target: number;
  custom?: boolean;
  /** Seconds this person takes to recite the phrase once. Remembered so the timer
   * prompt can offer their own pace next time; absent until they set one. */
  secondsPerRep?: number;
}

export interface DailyLog {
  date: string;
  counts: Record<string, number>;
  timedSeconds: Record<string, number>;
  completed: boolean;
}

export interface ReminderSettings {
  enabled: boolean;
  time: string;
  pushEnabled: boolean;
}

export interface UserSettings {
  language: Language;
  theme: ThemePreference;
  haptics: boolean;
  reducedMotion: boolean;
  analyticsOptIn: boolean;
  reminders: ReminderSettings;
}

export interface ActiveTimer {
  presetId: string;
  startedAt: number;
  /** Set only when the session counts repetitions. Absent means time-only practice,
   * which is never converted into repetitions. */
  secondsPerRep?: number;
  /** Repetitions already written into the log, so repeated ticks and a final stop
   * bank each repetition exactly once. */
  creditedReps?: number;
}

export interface ZikrState {
  version: 1;
  onboardingComplete: boolean;
  selectedPresetId: string;
  presets: DhikrPreset[];
  archivedPresets?: DhikrPreset[];
  logs: DailyLog[];
  settings: UserSettings;
  activeTimer: ActiveTimer | null;
  lastUpdatedAt: number;
}

export interface AnalyticsEvent {
  id?: number;
  name: string;
  at: number;
  metadata?: Record<string, string | number | boolean>;
}
