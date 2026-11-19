import type { StatusOption } from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import { useUpdateProductPublication } from '@p4/api-sdk/react';
import { ApiSdkError, getErrorMessage } from '@p4/api-sdk/shared';
import type { ProductPublicationStatus, ProductVariant } from '@p4/shared';
import { useTranslation } from 'react-i18next';

export const PRODUCT_STATUSES: ProductPublicationStatus[] = [
  'draft',
  'active',
  'inactive',
  'archived',
];

/** Allowed publication moves; mirrors the API lifecycle (archived is final). */
export const TRANSITIONS: Record<ProductPublicationStatus, ProductPublicationStatus[]> = {
  draft: ['active', 'archived'],
  active: ['inactive', 'archived'],
  inactive: ['active', 'archived'],
  archived: [],
};

export type PublishableProduct = {
  id: string;
  name: string;
  status: ProductPublicationStatus;
  version: number;
};

export function useProductStatusOptions(): StatusOption<ProductPublicationStatus>[] {
  const { t } = useTranslation();

  return [
    {
      value: 'draft',
      label: t('adminProducts.status.draft'),
      actionLabel: t('adminProducts.action.draft'),
      tone: 'info',
      actionTone: 'info',
      icon: 'rotateLeft',
    },
    {
      value: 'active',
      label: t('adminProducts.status.active'),
      actionLabel: t('adminProducts.action.active'),
      tone: 'success',
      actionTone: 'success',
      icon: 'send',
    },
    {
      value: 'inactive',
      label: t('adminProducts.status.inactive'),
      actionLabel: t('adminProducts.action.inactive'),
      tone: 'warning',
      actionTone: 'warning',
      icon: 'eyeOff',
    },
    {
      value: 'archived',
      label: t('adminProducts.status.archived'),
      actionLabel: t('adminProducts.action.archived'),
      tone: 'danger',
      icon: 'delete',
      danger: true,
    },
  ];
}

export function useSkuStatusOptions(): StatusOption<ProductVariant['status']>[] {
  const { t } = useTranslation();

  return [
    { value: 'active', label: t('adminProducts.skuStatus.active'), tone: 'success' },
    { value: 'inactive', label: t('adminProducts.skuStatus.inactive'), tone: 'warning' },
  ];
}

/** Return the save promise to StatusTag; its controlled value changes only after API success. */
export function useProductPublication(onConflict?: () => void) {
  const { t } = useTranslation();

  const mutation = useUpdateProductPublication();

  return async (product: PublishableProduct, status: ProductPublicationStatus) => {
    try {
      await mutation.mutateAsync({
        id: product.id,
        body: { status, expectedVersion: product.version },
      });
      toast.success(
        t('adminProducts.statusChanged', {
          name: product.name,
          status:
            (
              {
                draft: t('adminProducts.status.draft'),
                active: t('adminProducts.status.active'),
                inactive: t('adminProducts.status.inactive'),
                archived: t('adminProducts.status.archived'),
              } as Record<string, string>
            )[status] ?? String(status),
        }),
      );
    } catch (error) {
      if (error instanceof ApiSdkError && error.status === 409) {
        toast.error(t('adminProducts.conflict'));
        onConflict?.();
        if (status === 'archived') throw error;
        return;
      }

      toast.error(getErrorMessage(error, t('adminProducts.statusFailed')));
      if (status === 'archived') throw error;
    }
  };
}
