/*
 * Daily reminders, worded on this device.
 *
 * The push that wakes this worker carries nothing but the day it is for. What the reminder
 * says comes from the practice already stored here, read straight from the app's database,
 * so no count or streak has to leave the device for the server to know what to say. The
 * streak arithmetic mirrors src/domain/streak.ts and every sentence the app already has is
 * its own from src/locales.ts; src/push-handler.test.ts holds this file to both.
 */
(() => {
  'use strict';

  const FREEZE_EVERY = 7;
  const MAX_FREEZES = 2;
  const AT_RISK_HOURS = 6;
  const LANGUAGES = ['en', 'ms', 'id', 'tr', 'ar'];
  const TAG = 'zikr-reminder';

  const COPY = {
    en: {
      quietTitle: 'A quiet moment for dhikr',
      quietBody: 'Return when you are ready.',
      streakTitle: 'Streak: {{days}}',
      streakDoneLine: 'Today is complete. Come back tomorrow to keep it going.',
      streakAtRiskLine: 'Only {{time}} left today. Complete your intention to keep your streak.',
      streakNudgeLine: 'Complete today to extend your streak to {{days}}.',
      streakFreezeWillCover: 'If today slips by, a freeze will cover it.',
      streakNoneLine: 'Complete today’s intention to start a streak.'
    },
    ms: {
      quietTitle: 'Detik tenang untuk berzikir',
      quietBody: 'Kembalilah apabila anda bersedia.',
      streakTitle: 'Rentetan: {{days}}',
      streakDoneLine: 'Hari ini sudah lengkap. Kembali esok untuk meneruskannya.',
      streakAtRiskLine: 'Hanya tinggal {{time}} hari ini. Lengkapkan niat anda untuk mengekalkan rentetan.',
      streakNudgeLine: 'Lengkapkan hari ini untuk memanjangkan rentetan anda kepada {{days}}.',
      streakFreezeWillCover: 'Jika hari ini terlepas, satu pembekuan akan menampungnya.',
      streakNoneLine: 'Lengkapkan niat hari ini untuk memulakan rentetan.'
    },
    id: {
      quietTitle: 'Saat tenang untuk berzikir',
      quietBody: 'Kembalilah saat Anda siap.',
      streakTitle: 'Runtunan: {{days}}',
      streakDoneLine: 'Hari ini sudah selesai. Kembalilah besok untuk melanjutkannya.',
      streakAtRiskLine: 'Hanya tersisa {{time}} hari ini. Selesaikan niat Anda untuk mempertahankan runtunan.',
      streakNudgeLine: 'Selesaikan hari ini untuk memperpanjang runtunan Anda menjadi {{days}}.',
      streakFreezeWillCover: 'Jika hari ini terlewat, satu pembekuan akan menutupinya.',
      streakNoneLine: 'Selesaikan niat hari ini untuk memulai runtunan.'
    },
    tr: {
      quietTitle: 'Zikir için sakin bir an',
      quietBody: 'Hazır olduğunuzda dönün.',
      streakTitle: 'Seri: {{days}}',
      streakDoneLine: 'Bugün tamamlandı. Seriyi sürdürmek için yarın yine gelin.',
      streakAtRiskLine: 'Bugün yalnızca {{time}} kaldı. Serinizi korumak için niyetinizi tamamlayın.',
      streakNudgeLine: 'Serinizi {{days}} yapmak için bugünü tamamlayın.',
      streakFreezeWillCover: 'Bugün kaçarsa bir dondurma hakkı onu karşılar.',
      streakNoneLine: 'Bir seri başlatmak için bugünkü niyetinizi tamamlayın.'
    },
    ar: {
      quietTitle: 'لحظة هادئة للذكر',
      quietBody: 'عُد متى كنت مستعدًا.',
      streakTitle: 'السلسلة: {{days}}',
      streakDoneLine: 'اكتمل اليوم. عُد غدًا لتواصل سلسلتك.',
      streakAtRiskLine: 'بقي {{time}} فقط من اليوم. أكمل وردك للحفاظ على سلسلتك.',
      streakNudgeLine: 'أكمل اليوم لتصل سلسلتك إلى {{days}}.',
      streakFreezeWillCover: 'إن فاتك اليوم فسيغطيه تجميد.',
      streakNoneLine: 'أكمل ورد اليوم لتبدأ سلسلة.'
    }
  };

  const pad = (value) => String(value).padStart(2, '0');
  const dayKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const noon = (key) => new Date(`${key}T12:00:00`);
  const daysBetween = (from, to) => Math.round((noon(to).getTime() - noon(from).getTime()) / 86_400_000);
  const msLeftToday = (now) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();

  /** calculateStreak, cut down to what a reminder needs. */
  const streakOf = (logs, today) => {
    const done = [...new Set(logs.filter((log) => log && log.completed === true && typeof log.date === 'string' && log.date <= today).map((log) => log.date))].sort();
    const todayDone = done[done.length - 1] === today;
    let current = 0;
    let freezes = 0;
    const bridge = (after, before) => {
      const missed = daysBetween(after, before) - 1;
      if (missed <= 0 || current === 0) return;
      const covered = Math.min(missed, freezes);
      freezes -= covered;
      if (missed > covered) current = 0;
    };
    const keep = () => {
      current += 1;
      if (current % FREEZE_EVERY === 0 && freezes < MAX_FREEZES) freezes += 1;
    };
    let previous = null;
    for (const day of done) {
      if (day === today) break;
      if (previous) bridge(previous, day);
      keep();
      previous = day;
    }
    if (previous) bridge(previous, today);
    if (todayDone) keep();
    return { current, freezes, todayDone };
  };

  // As src/components/streak/format.ts: Intl knows how each language counts days and hours.
  const unit = (value, name, language, unitDisplay) => {
    try {
      return new Intl.NumberFormat(language, { style: 'unit', unit: name, unitDisplay }).format(value);
    } catch {
      return String(value);
    }
  };
  const formatDays = (days, language) => unit(days, 'day', language, 'long');
  const formatTimeLeft = (ms, language) => {
    const minutes = Math.max(1, Math.ceil(ms / 60_000));
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (hours === 0) return unit(minutes, 'minute', language, 'short');
    const whole = unit(hours, 'hour', language, 'short');
    return rest === 0 ? whole : `${whole} ${unit(rest, 'minute', language, 'short')}`;
  };
  const fill = (template, values) => template.replace(/\{\{(\w+)\}\}/g, (match, name) => (name in values ? values[name] : match));

  /** The language the app would open in: the one chosen at onboarding, else the browser's. */
  const languageOf = (state, preferred) => {
    const chosen = state && state.onboardingComplete === true && state.settings ? state.settings.language : null;
    if (LANGUAGES.includes(chosen)) return chosen;
    for (const tag of preferred || []) {
      const base = String(tag).toLowerCase().split('-')[0];
      if (LANGUAGES.includes(base)) return base;
    }
    return 'en';
  };

  /**
   * The notification for the practice in `state` at `now`, or a plain one when the practice
   * cannot be read. A push must always end in a notification, so there is one for every case;
   * on a day already complete it arrives without sound.
   */
  const reminderFor = (state, now, preferred) => {
    const language = languageOf(state, preferred);
    const copy = COPY[language];
    const note = (title, body, silent) => ({
      title,
      options: {
        body,
        icon: '/icons/icon-192.png',
        badge: '/icons/badge-96.png',
        tag: TAG,
        // Yesterday's reminder may still be in the tray under the same tag; replacing it
        // quietly would mean today's never makes a sound.
        renotify: !silent,
        silent,
        lang: language,
        dir: language === 'ar' ? 'rtl' : 'ltr',
        // Marks the open as coming from a reminder, for the opt-in usage count only
        // (src/data/usage.ts), which takes it back out of the address at once.
        data: { url: '/?source=reminder' }
      }
    });
    const quiet = (silent) => note(copy.quietTitle, copy.quietBody, silent);
    if (!state || typeof state !== 'object') return quiet(false);
    // Switched off on this device without the server hearing of it: make this the last one.
    const reminders = state.settings && state.settings.reminders;
    if (reminders && reminders.pushEnabled === false) return { ...quiet(true), unsubscribe: true };
    const presets = Array.isArray(state.presets) ? state.presets : [];
    if (!presets.some((preset) => preset && preset.target > 0)) return quiet(false);

    const streak = streakOf(Array.isArray(state.logs) ? state.logs : [], dayKey(now));
    const title = fill(copy.streakTitle, { days: formatDays(streak.current, language) });
    if (streak.todayDone) return note(title, copy.streakDoneLine, true);
    if (streak.current === 0) return note(copy.quietTitle, copy.streakNoneLine, false);
    const left = msLeftToday(now);
    const line = left <= AT_RISK_HOURS * 3_600_000
      ? fill(copy.streakAtRiskLine, { time: formatTimeLeft(left, language) })
      : fill(copy.streakNudgeLine, { days: formatDays(streak.current + 1, language) });
    return note(title, streak.freezes > 0 ? `${line} ${copy.streakFreezeWillCover}` : line, false);
  };

  /** The app's stored practice, or null. Never creates, upgrades or holds open the database. */
  const readState = () => new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (!settled) {
        settled = true;
        resolve(value);
      }
    };
    setTimeout(() => finish(null), 3000);
    let request;
    try {
      request = self.indexedDB.open('zikr-pwa');
    } catch {
      finish(null);
      return;
    }
    // No database yet: creating an empty one here would get in the way of the app's own.
    request.onupgradeneeded = () => request.transaction.abort();
    request.onerror = () => finish(null);
    request.onblocked = () => finish(null);
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      try {
        if (!db.objectStoreNames.contains('records')) throw new Error('No records store');
        const read = db.transaction('records', 'readonly').objectStore('records').get('current');
        read.onsuccess = () => finish(read.result && typeof read.result === 'object' ? read.result.value : null);
        read.onerror = () => finish(null);
      } catch {
        finish(null);
      }
      db.close();
    };
  });

  self.zikrReminder = { COPY, dayKey, streakOf, formatDays, formatTimeLeft, reminderFor, readState };

  self.addEventListener('push', (event) => {
    const preferred = self.navigator && self.navigator.languages;
    event.waitUntil(readState()
      .then((state) => reminderFor(state, new Date(), preferred))
      .catch(() => reminderFor(null, new Date(), preferred))
      .then((reminder) => self.registration.showNotification(reminder.title, reminder.options)
        .then(() => reminder.unsubscribe && self.registration.pushManager.getSubscription()
          .then((subscription) => subscription && subscription.unsubscribe())
          .catch(() => false))));
  });

  self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    let target = '/';
    try {
      const candidate = new URL(event.notification.data?.url || '/', self.location.origin);
      if (candidate.origin === self.location.origin) target = candidate.href;
    } catch { /* Ignore invalid or external destinations. */ }
    event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => 'focus' in client);
      if (!existing) return self.clients.openWindow(target);
      return existing.focus().then((focused) => {
        if (target !== '/' && focused && 'navigate' in focused) return focused.navigate(target);
        return focused;
      });
    }));
  });
})();
