import { cn } from '@p4/ui';
import { useTranslation } from 'react-i18next';
import { type AppLocale, SUPPORTED_LOCALES, setAppLocale } from '@/i18n';

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const current = (
    SUPPORTED_LOCALES.includes(i18n.language as AppLocale) ? i18n.language : 'vi'
  ) as AppLocale;

  return (
    <div className="inline-flex items-center gap-1 rounded-lg bg-neutral-bg p-1">
      {SUPPORTED_LOCALES.map((locale) => (
        <button
          key={locale}
          type="button"
          onClick={() => setAppLocale(locale)}
          className={cn(
            'rounded-md px-2 py-1 text-12 font-semibold transition-colors',
            current === locale
              ? 'bg-primary-background text-primary shadow-sm'
              : 'text-neutral-text-secondary hover:text-primary',
          )}
        >
          {t(`lang.${locale}`)}
        </button>
      ))}
    </div>
  );
}
