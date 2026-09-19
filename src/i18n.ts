import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources, supported, type AppLanguage } from './locales';

export type { AppLanguage };
export { resources };

const detectLanguage = (): AppLanguage => {
  // A locale landing page links into the app with ?lang=, so arriving at /tr/ and
  // tapping through carries Turkish into the app rather than dropping to English.
  try {
    const requested = new URLSearchParams(window.location.search).get('lang');
    if (supported.includes(requested as AppLanguage)) return requested as AppLanguage;
  } catch { /* malformed query string; fall through */ }
  try {
    const saved = localStorage.getItem('zikr-language');
    if (supported.includes(saved as AppLanguage)) return saved as AppLanguage;
  } catch { /* storage unavailable; fall through to browser language */ }
  for (const tag of navigator.languages ?? [navigator.language]) {
    const base = tag?.toLowerCase().split('-')[0] as AppLanguage;
    if (supported.includes(base)) return base;
  }
  return 'en';
};

/** What the browser, a saved choice or a ?lang= link asked for, before any
 * stored preference exists. Used until onboarding records a deliberate choice. */
export const detectedLanguage = detectLanguage();
const initialLanguage = detectedLanguage;
void i18n.use(initReactI18next).init({ resources, showSupportNotice: false, lng: initialLanguage, fallbackLng: 'en', interpolation: { escapeValue: false } });
document.documentElement.lang = initialLanguage;
document.documentElement.dir = initialLanguage === 'ar' ? 'rtl' : 'ltr';

export default i18n;
