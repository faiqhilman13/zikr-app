export type Language = 'en' | 'ms' | 'ar';
export type ThemePreference = 'system' | 'light' | 'dark';

export interface DhikrPreset {
  id: string;
  title: string;
  arabic: string;
  transliteration: string;
  target: number;
  custom?: boolean;
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
}

export interface ZikrState {
  version: 1;
  onboardingComplete: boolean;
  selectedPresetId: string;
  presets: DhikrPreset[];
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
