import { Dialog, DropdownMenu, IconButton, Tag, type TagTone } from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import { useUpdateProductPublication } from '@p4/api-sdk/react';
import { ApiSdkError, getErrorMessage } from '@p4/api-sdk/shared';
import type { ProductPublicationStatus } from '@p4/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export const PRODUCT_STATUSES: ProductPublicationStatus[] = [
  'draft',
  'active',
  'inactive',
  'archived',
];

/** Allowed publication moves; mirrors the API lifecycle (archived is final). */
const TRANSITIONS: Record<ProductPublicationStatus, ProductPublicationStatus[]> = {
  draft: ['active', 'archived'],
  active: ['inactive', 'archived'],
  inactive: ['active', 'archived'],
  archived: [],
};

const TONES: Record<ProductPublicationStatus, TagTone> = {
  draft: 'neutral',
  active: 'success',
  inactive: 'warning',
  archived: 'danger',
};

type PublishableProduct = {
  id: string;
  name: string;
  status: ProductPublicationStatus;
  version: number;
};

type PendingChange = { product: PublishableProduct; status: ProductPublicationStatus };

export function ProductStatusTag({ status }: { status: ProductPublicationStatus }) {
  const { t } = useTranslation();

  return (
    <Tag size="sm" tone={TONES[status]}>
      {t(`adminProducts.status.${status}`)}
    </Tag>
  );
}

export function productTransitions(status: ProductPublicationStatus) {
  return TRANSITIONS[status];
}

/**
 * Publication changes for a product: sends the version the user saw, confirms archiving
 * and reloads the latest snapshot when the API reports a conflict (409).
 */
export function useProductPublication(onConflict?: () => void) {
  const { t } = useTranslation();
  const mutation = useUpdateProductPublication();
  const [pending, setPending] = useState<PendingChange | null>(null);

  const submit = async ({ product, status }: PendingChange) => {
    try {
      await mutation.mutateAsync({
        id: product.id,
        body: { status, expectedVersion: product.version },
      });
      toast.success(
        t('adminProducts.statusChanged', {
          name: product.name,
          status: t(`adminProducts.status.${status}`),
        }),
      );
      setPending(null);
    } catch (error) {
      setPending(null);

      if (error instanceof ApiSdkError && error.status === 409) {
        toast.error(t('adminProducts.conflict'));
        onConflict?.();
        return;
      }

      toast.error(getErrorMessage(error, t('adminProducts.statusFailed')));
    }
  };

  const request = (product: PublishableProduct, status: ProductPublicationStatus) => {
    if (status === 'archived') setPending({ product, status });
    else void submit({ product, status });
  };

  const confirmDialog = pending ? (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !mutation.isPending) setPending(null);
      }}
      title={t('adminProducts.archiveTitle')}
      description={t('adminProducts.archiveConfirm', { name: pending.product.name })}
      actions={[
        {
          id: 'cancel',
          label: t('adminProducts.cancel'),
          variant: 'secondary',
          disabled: mutation.isPending,
          onClick: () => setPending(null),
        },
        {
          id: 'archive',
          label: t('adminProducts.archive'),
          variant: 'danger',
          loading: mutation.isPending,
          onClick: () => submit(pending),
        },
      ]}
    />
  ) : null;

  return {
    request,
    confirmDialog,
    changing: mutation.isPending ? mutation.variables?.id : undefined,
  };
}

type ProductStatusMenuProps = {
  product: PublishableProduct;
  disabled?: boolean;
  onSelect: (status: ProductPublicationStatus) => void;
};

/** Row/header control listing only the moves the lifecycle allows. */
export function ProductStatusMenu({ product, disabled, onSelect }: ProductStatusMenuProps) {
  const { t } = useTranslation();

  const next = productTransitions(product.status);
  const label = `${t('adminProducts.changeStatus')}: ${product.name}`;

  if (!next.length) return null;

  return (
    <DropdownMenu
      trigger={
        <IconButton icon="refresh" variant="ghost" size="sm" label={label} disabled={disabled} />
      }
      items={next.map((status) => ({
        id: status,
        label: t(`adminProducts.action.${status}`),
        tone: status === 'archived' ? ('danger' as const) : ('default' as const),
        onSelect: () => onSelect(status),
      }))}
    />
  );
}
