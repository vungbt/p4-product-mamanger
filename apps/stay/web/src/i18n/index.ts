import { type AppLocale, createI18n } from '@p4/i18n';
import en from './locales/en/common.json';
import vi from './locales/vi/common.json';

export const LOCALE_STORAGE_KEY = 'stay_locale';

function readStoredLocale(): AppLocale {
  try {
    const raw = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (raw === 'en' || raw === 'vi') return raw;
  } catch {
    /* storage unavailable: keep the default */
  }
  return 'vi';
}

const i18n = createI18n({
  resources: {
    vi: { common: vi },
    en: { common: en },
  },
  lng: readStoredLocale(),
  defaultNS: 'common',
});

/** Current UI locale, also sent to the API as `Accept-Language`. */
export function currentLocale(): AppLocale {
  return i18n.resolvedLanguage === 'en' ? 'en' : 'vi';
}

export default i18n;
