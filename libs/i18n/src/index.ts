import { createInstance, type Resource } from 'i18next';
import { initReactI18next } from 'react-i18next';

export const SUPPORTED_LOCALES = ['vi', 'en'] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

type CreateI18nOptions = {
  resources: Resource;
  lng?: AppLocale;
  defaultNS?: string;
};

/** Create one instance per application (or per request when using SSR). */
export function createI18n({ resources, lng = 'vi', defaultNS = 'common' }: CreateI18nOptions) {
  const instance = createInstance();
  void instance.use(initReactI18next).init({
    resources,
    lng,
    fallbackLng: 'vi',
    supportedLngs: [...SUPPORTED_LOCALES],
    defaultNS,
    ns: [...new Set(Object.values(resources).flatMap((namespaces) => Object.keys(namespaces)))],
    // All resources are supplied locally; initialize before the first render.
    initAsync: false,
    interpolation: { escapeValue: false },
  });
  return instance;
}
