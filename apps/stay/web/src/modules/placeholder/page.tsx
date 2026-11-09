import { EmptyState } from '@itclabs/react-ui';
import { useTranslation } from 'react-i18next';
import { useCurrentRoute } from '@/routing/use-routes';

/** "Sắp có" page for menu items whose screens arrive in later tasks. */
export default function PlaceholderPage() {
  const { t } = useTranslation();
  const route = useCurrentRoute();

  const name = route ? t(`nav.${route.name}`) : '';

  return (
    <EmptyState
      icon={route?.icon}
      headingLevel={1}
      title={name}
      description={
        <>
          <span className="block font-semibold text-accent">{t('placeholder.title')}</span>
          {t('placeholder.description', { name })}
        </>
      }
      data-testid="placeholder-page"
    />
  );
}
