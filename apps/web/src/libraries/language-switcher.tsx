import { useTranslation } from 'react-i18next';
import { type AppLocale, SUPPORTED_LOCALES, setAppLocale } from '@/i18n';

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const current = (
    SUPPORTED_LOCALES.includes(i18n.language as AppLocale) ? i18n.language : 'vi'
  ) as AppLocale;

  return (
    <div style={{ display: 'inline-flex', gap: 4 }}>
      {SUPPORTED_LOCALES.map((locale) => (
        <button
          key={locale}
          type="button"
          onClick={() => setAppLocale(locale)}
          style={{
            fontWeight: current === locale ? 700 : 400,
            textDecoration: current === locale ? 'underline' : 'none',
          }}
        >
          {t(`lang.${locale}`)}
        </button>
      ))}
    </div>
  );
}
