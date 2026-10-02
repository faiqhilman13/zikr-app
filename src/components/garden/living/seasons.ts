/**
 * The Hijri year in the garden. The date is read from the Umm al-Qura calendar on the device
 * and, as with the rest of the app, by the civil day: it turns at midnight, not at maghrib,
 * and a local moonsighting may differ by a day.
 */

export type Season = 'ramadan' | 'lastTen' | 'eidFitr' | 'dhulHijjah' | 'arafah' | 'eidAdha' | 'newYear' | 'ashura';

export interface Hijri { day: number; month: number; year: number }

export function hijriOf(date: Date): Hijri | null {
  try {
    const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { day: 'numeric', month: 'numeric', year: 'numeric' }).formatToParts(date);
    const read = (type: string) => Number(parts.find((part) => part.type === type)?.value);
    const hijri = { day: read('day'), month: read('month'), year: read('year') };
    return Number.isFinite(hijri.day) && Number.isFinite(hijri.month) && hijri.month >= 1 && hijri.month <= 12 ? hijri : null;
  } catch {
    return null;
  }
}

export function seasonOf(hijri: Hijri | null): Season | null {
  if (!hijri) return null;
  const { month, day } = hijri;
  if (month === 9) return day >= 21 ? 'lastTen' : 'ramadan';
  if (month === 10 && day <= 3) return 'eidFitr';
  if (month === 12 && day === 9) return 'arafah';
  if (month === 12 && day <= 8) return 'dhulHijjah';
  if (month === 12 && day <= 13) return 'eidAdha';
  if (month === 1 && day <= 3) return 'newYear';
  if (month === 1 && (day === 9 || day === 10)) return 'ashura';
  return null;
}

/** The Hijri date written out in the reader's language, or null where the calendar is unavailable. */
export function hijriLabel(date: Date, language: string) {
  try {
    return new Intl.DateTimeFormat(`${language}-u-ca-islamic-umalqura`, { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
  } catch {
    return null;
  }
}
