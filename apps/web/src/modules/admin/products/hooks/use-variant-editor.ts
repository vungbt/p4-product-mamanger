import { useAppForm } from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import {
  useCreateProductVariant,
  useUpdateProductVariant,
  useUpdateProductVariantImages,
} from '@p4/api-sdk/react';
import { ApiSdkError, getErrorMessage } from '@p4/api-sdk/shared';
import type { ProductVariant } from '@p4/shared';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as v from 'valibot';

const FIELDS = ['sku', 'barcode', 'size', 'color', 'price'] as const;

type Field = (typeof FIELDS)[number];

export type VariantEditorOptions = {
  productId: string;
  variant?: ProductVariant;
  onClose: () => void;
  /** Reloads the product's SKUs and returns the latest copy of this one. */
  onReload: () => Promise<ProductVariant | undefined>;
};

type Values = {
  sku: string;
  barcode: string;
  size: string;
  color: string;
  price: string;
  status: 'active' | 'inactive';
  isDefault: boolean;
  imageIds: string[];
};

const toValues = (variant?: ProductVariant): Values => ({
  sku: variant?.sku ?? '',
  barcode: variant?.barcode ?? '',
  size: variant?.size ?? '',
  color: variant?.color ?? '',
  price: variant ? String(variant.price) : '',
  status: variant?.status ?? 'active',
  isDefault: variant?.isDefault ?? false,
  imageIds: variant?.imageIds ?? [],
});

const sameIds = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((id, index) => id === b[index]);

export default function useVariantEditor({
  productId,
  variant: initial,
  onClose,
  onReload,
}: VariantEditorOptions) {
  const { t } = useTranslation();
  const create = useCreateProductVariant();
  const update = useUpdateProductVariant();
  const updateImages = useUpdateProductVariantImages();
  const [variant, setVariant] = useState(initial);
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState(false);
  const [reloading, setReloading] = useState(false);

  const pending = create.isPending || update.isPending || updateImages.isPending;

  const schema = useMemo(() => {
    const text = (max: number) =>
      v.pipe(
        v.string(),
        v.trim(),
        v.minLength(1, t('adminProducts.variant.required')),
        v.maxLength(max, t('adminProducts.variant.tooLong')),
      );

    return {
      sku: text(120),
      barcode: v.pipe(v.string(), v.trim(), v.maxLength(120, t('adminProducts.variant.tooLong'))),
      size: text(80),
      color: text(80),
      price: v.pipe(
        v.string(),
        v.trim(),
        v.regex(/^\d{1,10}$/, t('adminProducts.variant.priceInvalid')),
        v.check((value) => Number(value) <= 2_147_483_647, t('adminProducts.variant.priceInvalid')),
      ),
    };
  }, [t]);

  const setServerError = (field: Field, message: string | undefined) =>
    form.setFieldMeta(field, (previous) => ({
      ...previous,
      isTouched: true,
      errorMap: { ...previous.errorMap, onServer: message },
    }));

  const showError = (cause: unknown) => {
    if (cause instanceof ApiSdkError && cause.code === 'version_conflict') {
      setConflict(true);
      return;
    }

    let placed = false;

    if (cause instanceof ApiSdkError) {
      for (const field of FIELDS) {
        const message = cause.fieldErrors[field]?.join(' ');

        if (message) {
          setServerError(field, message);
          placed = true;
        }
      }

      if (cause.code === 'sold_variant_identity_immutable') {
        setError(t('adminProducts.variant.soldIdentity'));
        return;
      }

      if (cause.code === 'variant_has_reservations') {
        setError(t('adminProducts.variant.hasReservations'));
        return;
      }
    }

    if (!placed) setError(getErrorMessage(cause, t('adminProducts.variant.saveFailed')));
  };

  const save = async (value: Values) => {
    const body = {
      sku: value.sku.trim(),
      barcode: value.barcode.trim() || null,
      size: value.size.trim(),
      color: value.color.trim(),
      price: Number(value.price),
      status: value.status,
      isDefault: value.isDefault,
    };

    if (!variant) {
      const created = await create.mutateAsync({
        id: productId,
        body: { ...body, barcode: body.barcode ?? undefined },
      });

      if (value.imageIds.length) {
        await updateImages.mutateAsync({
          id: productId,
          variantId: created.data.id,
          body: { imageIds: value.imageIds, expectedVersion: created.data.version },
        });
      }

      return;
    }

    // Send only what changed; stock is never part of a SKU edit (inventory owns it).
    const changes = Object.fromEntries(
      Object.entries(body).filter(([key, next]) => next !== variant[key as keyof typeof body]),
    );

    let version = variant.version;

    if (Object.keys(changes).length) {
      const updated = await update.mutateAsync({
        id: productId,
        variantId: variant.id,
        body: { ...changes, expectedVersion: version },
      });

      version = updated.data.version;
    }

    if (!sameIds(value.imageIds, variant.imageIds)) {
      await updateImages.mutateAsync({
        id: productId,
        variantId: variant.id,
        body: { imageIds: value.imageIds, expectedVersion: version },
      });
    }
  };

  const form = useAppForm({
    defaultValues: toValues(initial),
    onSubmit: async ({ value }) => {
      if (pending) return;

      setError('');
      setConflict(false);
      for (const field of FIELDS) setServerError(field, undefined);

      try {
        await save(value);
        toast.success(
          t(variant ? 'adminProducts.variant.updated' : 'adminProducts.variant.created'),
        );
        onClose();
      } catch (cause) {
        showError(cause);
      }
    },
  });

  /** Loads the newest copy of the SKU and keeps the user's draft for another try. */
  const reloadLatest = async () => {
    setReloading(true);

    try {
      const latest = await onReload();

      if (!latest) {
        setError(t('adminProducts.variant.missing'));
        return;
      }

      setVariant(latest);
      setConflict(false);
    } finally {
      setReloading(false);
    }
  };

  const clearServerError = (field: Field) => setServerError(field, undefined);

  const changeOpen = (open: boolean) => {
    if (!open && !pending) onClose();
  };

  return {
    form,
    schema,
    error,
    conflict,
    reloading,
    pending,
    variant,
    reloadLatest,
    clearServerError,
    changeOpen,
  };
}
