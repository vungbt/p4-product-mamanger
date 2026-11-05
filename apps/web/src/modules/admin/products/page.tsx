import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { ROUTES } from '@/constants/constants';

// Navigation preview only; the product CRUD exercise remains unimplemented.
export default function AdminProductsPage() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const isNew = pathname === ROUTES.admin['product-new'];
  return (
    <p className="text-ui-sm text-muted">
      {t(isNew ? 'catalogDemo.newHint' : 'catalogDemo.description')}
    </p>
  );
}
