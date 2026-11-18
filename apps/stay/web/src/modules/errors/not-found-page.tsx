import { Button, EmptyState } from '@itclabs/react-ui';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routing/route-configs';

/** C-03 404: unknown page (also used later for records of another building). */
export default function NotFoundPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <EmptyState
      variant="not-found"
      code="404"
      headingLevel={1}
      title={t('errors.notFoundTitle')}
      description={t('errors.notFoundDescription')}
      action={<Button onClick={() => navigate(ROUTES.overview)}>{t('errors.backHome')}</Button>}
      data-testid="not-found-page"
    />
  );
}
