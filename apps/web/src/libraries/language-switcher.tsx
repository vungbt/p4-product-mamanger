import { cn } from '@itclabs/react-ui';
import { useTranslation } from 'react-i18next';
import { type AppLocale, SUPPORTED_LOCALES, setAppLocale } from '@/i18n';

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const current = (
    SUPPORTED_LOCALES.includes(i18n.language as AppLocale) ? i18n.language : 'vi'
  ) as AppLocale;

  return (
    <div className="inline-flex items-center gap-1 rounded-lg bg-canvas p-1">
      {SUPPORTED_LOCALES.map((locale) => (
        <button
          key={locale}
          type="button"
          onClick={() => setAppLocale(locale)}
          className={cn(
            'rounded-md px-2 py-1 text-xs font-semibold transition-colors',
            current === locale
              ? 'bg-brand-50 text-accent shadow-sm'
              : 'text-muted hover:text-accent',
          )}
        >
          {t(`lang.${locale}`)}
        </button>
      ))}
    </div>
  );
}
