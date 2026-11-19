import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/** Known API codes are translated; validation messages and unknown codes pass through. */
export function useVariantErrorLabel() {
  const { t } = useTranslation();

  const labels = useMemo<Record<string, string>>(
    () => ({
      sold_variant_identity_immutable: t(
        'adminProductForm.variantErrors.sold_variant_identity_immutable',
      ),
      variant_has_reservations: t('adminProductForm.variantErrors.variant_has_reservations'),
      duplicate_sku: t('adminProductForm.variantErrors.duplicate_sku'),
      duplicate_barcode: t('adminProductForm.variantErrors.duplicate_barcode'),
      version_conflict: t('adminProductForm.variantErrors.version_conflict'),
      variant_not_found: t('adminProductForm.variantErrors.variant_not_found'),
      invalid_product_image: t('adminProductForm.variantErrors.invalid_product_image'),
      duplicate_variant_combination: t(
        'adminProductForm.variantErrors.duplicate_variant_combination',
      ),
    }),
    [t],
  );

  return useCallback((error: string) => labels[error] ?? error, [labels]);
}
