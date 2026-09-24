/* Counted words go through Intl rather than translation strings: it already knows that
   Arabic says يومان for two days and 3 أيام for three, which a {{count}} placeholder
   cannot. Each call falls back to the bare number on an engine without unit support. */

const unit = (value: number, name: 'day' | 'hour' | 'minute', language: string, unitDisplay: 'long' | 'short' | 'narrow') => {
  try {
    return new Intl.NumberFormat(language, { style: 'unit', unit: name, unitDisplay }).format(value);
  } catch {
    return String(value);
  }
};

export const formatDays = (days: number, language: string) => unit(days, 'day', language, 'long');

/** "3 hr 20 min" for a sentence, or "3h" for the header chip (`compact`), where whole hours
 * round down so the deadline never reads later than it is. Rounds up to the minute, so the
 * last one never reads as zero. */
export const formatTimeLeft = (ms: number, language: string, compact = false) => {
  const minutes = Math.max(1, Math.ceil(ms / 60_000));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const display = compact ? 'narrow' : 'short';
  if (hours === 0) return unit(minutes, 'minute', language, display);
  const whole = unit(hours, 'hour', language, display);
  return compact || rest === 0 ? whole : `${whole} ${unit(rest, 'minute', language, display)}`;
};

export const formatWeekdays = (dates: string[], language: string) => {
  const names = dates.map((date) => new Intl.DateTimeFormat(language, { weekday: 'long' }).format(new Date(`${date}T12:00:00`)));
  try {
    return new Intl.ListFormat(language, { type: 'conjunction' }).format(names);
  } catch {
    return names.join(', ');
  }
};
