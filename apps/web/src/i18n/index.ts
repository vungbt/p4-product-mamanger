import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en/common.json';
import vi from './locales/vi/common.json';

export const SUPPORTED_LOCALES = ['vi', 'en'] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_STORAGE_KEY = 'p4_locale';

function readStoredLocale(): AppLocale {
  try {
    const raw = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (raw === 'en' || raw === 'vi') return raw;
  } catch {
    /* ignore */
  }
  return 'vi';
}

void i18n.use(initReactI18next).init({
  resources: {
    vi: { common: vi },
    en: { common: en },
  },
  lng: typeof window !== 'undefined' ? readStoredLocale() : 'vi',
  fallbackLng: 'vi',
  defaultNS: 'common',
  ns: ['common'],
  interpolation: { escapeValue: false },
});

export function setAppLocale(locale: AppLocale) {
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  void i18n.changeLanguage(locale);
}

export default i18n;
