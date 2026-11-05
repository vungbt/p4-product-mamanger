import { blockResources } from '@p4/blocks/locales';
import { type AppLocale, createI18n } from '@p4/i18n';
import en from './locales/en/common.json';
import vi from './locales/vi/common.json';

export { type AppLocale, SUPPORTED_LOCALES } from '@p4/i18n';

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

const i18n = createI18n({
  resources: {
    vi: { common: vi, ...blockResources.vi },
    en: { common: en, ...blockResources.en },
  },
  lng: typeof window !== 'undefined' ? readStoredLocale() : 'vi',
  defaultNS: 'common',
});

export function setAppLocale(locale: AppLocale) {
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  void i18n.changeLanguage(locale);
}

export default i18n;
