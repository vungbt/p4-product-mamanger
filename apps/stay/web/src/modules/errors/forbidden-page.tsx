import { Button, EmptyState } from '@itclabs/react-ui';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routing/route-configs';

/** C-03 403: the route exists but the user's rules do not open it. */
export default function ForbiddenPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <EmptyState
      variant="forbidden"
      code="403"
      headingLevel={1}
      title={t('errors.forbiddenTitle')}
      description={t('errors.forbiddenDescription')}
      action={<Button onClick={() => navigate(ROUTES.overview)}>{t('errors.backHome')}</Button>}
      data-testid="forbidden-page"
    />
  );
}
