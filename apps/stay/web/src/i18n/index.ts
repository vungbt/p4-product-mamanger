import { type AppLocale, createI18n } from '@p4/i18n';
import enBuildings from './locales/en/buildings.json';
import en from './locales/en/common.json';
import enForms from './locales/en/forms.json';
import enInvoices from './locales/en/invoices.json';
import enMaintenance from './locales/en/maintenance.json';
import enSettings from './locales/en/settings.json';
import viBuildings from './locales/vi/buildings.json';
import vi from './locales/vi/common.json';
import viForms from './locales/vi/forms.json';
import viInvoices from './locales/vi/invoices.json';
import viMaintenance from './locales/vi/maintenance.json';
import viSettings from './locales/vi/settings.json';

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
    vi: {
      common: vi,
      maintenance: viMaintenance,
      forms: viForms,
      settings: viSettings,
      buildings: viBuildings,
      invoices: viInvoices,
    },
    en: {
      common: en,
      maintenance: enMaintenance,
      forms: enForms,
      settings: enSettings,
      buildings: enBuildings,
      invoices: enInvoices,
    },
  },
  lng: readStoredLocale(),
  defaultNS: 'common',
});

/** Current UI locale, also sent to the API as `Accept-Language`. */
export function currentLocale(): AppLocale {
  return i18n.resolvedLanguage === 'en' ? 'en' : 'vi';
}

export default i18n;
