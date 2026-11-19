import { EmptyState } from '@itclabs/react-ui';
import { useTranslation } from 'react-i18next';
import { useNavigationLabels } from '@/libraries/navigation-labels';
import { useCurrentRoute } from '@/routing/use-routes';

/** "Sắp có" page for menu items whose screens arrive in later tasks. */
export default function PlaceholderPage() {
  const { t } = useTranslation();

  const routeLabels = useNavigationLabels();

  const route = useCurrentRoute();

  const name = route ? (routeLabels[route.name] ?? route.name) : '';

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
