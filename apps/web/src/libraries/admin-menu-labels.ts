import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export function useAdminMenuLabels(): Record<string, string> {
  const { t } = useTranslation();

  return useMemo(
    () => ({
      home: t('menu.home'),
      shop: t('menu.shop'),
      cart: t('menu.cart'),
      'admin-dashboard': t('menu.admin-dashboard'),
      'admin-products': t('menu.admin-products'),
      'product-list': t('menu.product-list'),
      'product-new': t('menu.product-new'),
      'product-edit': t('menu.product-edit'),
      'admin-orders': t('menu.admin-orders'),
      'product-categories': t('menu.product-categories'),
      'product-detail': t('menu.product-detail'),
    }),
    [t],
  );
}
