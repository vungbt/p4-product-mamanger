import { clearErrors, setErrors, slugify, useAppForm, useLinkedField } from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import { useQueryClient } from '@p4/api-client';
import {
  resourceInvalidationKeys,
  useCreateProduct,
  useDeleteProduct,
  useTicketUpload,
  useUpdateProduct,
} from '@p4/api-sdk/react';
import { ApiSdkError, getErrorMessage, type ProductDetail } from '@p4/api-sdk/shared';
import type { ProductVariant } from '@p4/shared';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import * as v from 'valibot';
import { ROUTES } from '@/constants/constants';
import { useUnsavedChanges } from '@/libraries/forms/unsaved-changes';
import { useFormValue } from '@/libraries/forms/use-form-value';
import { variantDiff, variantRows } from './variant-diff';

function valuesFrom(product?: ProductDetail) {
  return {
    name: product?.name ?? '',
    slug: product?.slug ?? '',
    description: product?.description ?? '',
    price: (product?.price ?? null) as number | null,
    stock: (product?.stock ?? 0) as number | null,
    categoryId: product?.categoryId ?? '',
    sizeGuideId: product?.sizeGuideId ?? '',
    brand: product?.brand ?? '',
    material: product?.material ?? '',
    careInstructions: product?.careInstructions ?? '',
    seoTitle: product?.seoTitle ?? '',
    seoDescription: product?.seoDescription ?? '',
  };
}

export type ProductFormValues = ReturnType<typeof valuesFrom>;

export type ProductImageEntry = {
  key: string;
  storageId?: string;
  url: string;
  alt: string;
  status: 'idle' | 'uploading' | 'error';
  progress?: number;
  error?: string;
};

function imagesFrom(product?: ProductDetail): ProductImageEntry[] {
  return [
    ...(product?.thumbnail ? [{ ...product.thumbnail, id: product.thumbnail.fileId }] : []),
    ...(product?.images ?? []),
  ]
    .filter(
      (image, index, images) =>
        images.findIndex((item) => item.storageId === image.storageId) === index,
    )
    .map((image) => ({
      key: image.id,
      storageId: image.storageId,
      url: image.url,
      alt: product?.name ?? '',
      status: 'idle',
    }));
}

const imageIds = (images: ProductImageEntry[]) => images.map((image) => image.storageId);

export function useProductForm(
  initial: ProductDetail | undefined,
  reload: () => Promise<ProductDetail | undefined>,
  initialVariants: ProductVariant[] = [],
  reloadVariants?: () => Promise<ProductVariant[]>,
) {
  const { t } = useTranslation();

  const navigate = useNavigate();

  const location = useLocation();

  const listSearch = typeof location.state?.from === 'string' ? location.state.from : '';
  const returnToList = !initial || location.state?.returnTo === 'list';
  const listUrl = `${ROUTES.admin.products}${listSearch}`;

  const client = useQueryClient();

  const create = useCreateProduct({ invalidate: [] });

  const update = useUpdateProduct({ invalidate: [] });

  const removeProduct = useDeleteProduct();

  const upload = useTicketUpload({
    purpose: 'product',
    mode: 'batch',
    resourceId: initial?.id,
    failureMessage: t('adminProductForm.uploadFailed'),
  });

  const [rows, setRows] = useState(() => variantRows(initialVariants));

  const variantBaseline = useRef(initialVariants);

  const [rowErrors, setRowErrors] = useState<Record<string, Record<string, string>>>({});

  const rowsChanged = JSON.stringify(rows) !== JSON.stringify(variantRows(variantBaseline.current));

  const [error, setError] = useState('');

  const [conflict, setConflict] = useState(false);

  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState(false);

  const [images, setImages] = useState(() => imagesFrom(initial));

  const imageBaseline = useRef(imageIds(imagesFrom(initial)));

  useEffect(() => {
    setImages((previous) => {
      const uploads = upload.items.map(
        (item): ProductImageEntry => ({
          key: item.id,
          storageId: item.result?.storageId,
          url: item.preview,
          alt: item.file.name,
          status:
            item.status === 'completed' ? 'idle' : item.status === 'error' ? 'error' : 'uploading',
          progress: item.progress,
          error: item.error,
        }),
      );
      const byKey = new Map(uploads.map((item) => [item.key, item]));
      return [
        ...previous.map((item) => byKey.get(item.key) ?? item),
        ...uploads.filter((item) => !previous.some((existing) => existing.key === item.key)),
      ];
    });
  }, [upload.items]);

  const imagesChanged = JSON.stringify(imageIds(images)) !== JSON.stringify(imageBaseline.current);
  const uploadsIncomplete = upload.busy || images.some((image) => !image.storageId);

  const version = useRef(initial?.version);

  const savingRef = useRef(false);

  const baseline = useRef(valuesFrom(initial));

  const leave = (replace = false) =>
    navigate(initial && !returnToList ? ROUTES.admin['product-detail'](initial.id) : listUrl, {
      replace,
      state: { from: listSearch },
    });

  const schema = useMemo(() => {
    const text = (max: number) =>
      v.pipe(v.string(), v.maxLength(max, t('adminProductForm.tooLong', { max })));

    const integer = v.pipe(
      v.number(t('adminProductForm.integer')),
      v.integer(t('adminProductForm.integer')),
      v.minValue(0, t('adminProductForm.integer')),
      v.maxValue(2147483647, t('adminProductForm.integer')),
    );

    return {
      name: v.pipe(
        v.string(),
        v.trim(),
        v.minLength(1, t('adminProductForm.required')),
        v.maxLength(255, t('adminProductForm.tooLong', { max: 255 })),
      ),
      slug: v.pipe(
        text(160),
        v.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, t('adminProductForm.slugInvalid')),
      ),
      description: v.string(),
      price: integer,
      stock: integer,
      categoryId: v.string(),
      sizeGuideId: v.string(),
      brand: text(255),
      material: text(255),
      careInstructions: text(10000),
      seoTitle: text(255),
      seoDescription: text(255),
    };
  }, [t]);

  const form = useAppForm({
    defaultValues: baseline.current,
    onSubmit: async ({ value }) => {
      if (savingRef.current || uploadsIncomplete || deleting) return;
      savingRef.current = true;
      setSaving(true);
      setError('');
      setConflict(false);
      clearErrors(form);

      setRowErrors({});
      const diff = variantDiff(rows, variantBaseline.current);
      let savedId: string | undefined;
      try {
        const thumbnailStorageId = images[0]?.storageId ?? null;
        const imageStorageIds = images
          .slice(1)
          .flatMap((image) => (image.storageId ? [image.storageId] : []));
        const { stock, categoryId, sizeGuideId, ...fields } = value;
        const body = {
          ...fields,
          name: value.name.trim(),
          price: Number(value.price),
          // The generated request contract accepts IDs but does not expose null clearing.
          categoryId: categoryId || undefined,
          sizeGuideId: sizeGuideId || undefined,
        };
        if (!initial) {
          const created = await create.mutateAsync({
            ...body,
            stock: Number(stock),
            ...(diff.changed ? { variants: { create: diff.changes.create } } : {}),
            ...(typeof thumbnailStorageId === 'string' ? { thumbnailStorageId } : {}),
            imageStorageIds,
          });
          savedId = created.data.id;
          allowNavigation();
          toast.success(t('adminProductForm.created'));
          leave(true);
          return;
        }
        const changedFields = Object.fromEntries(
          Object.entries(body).filter(
            ([key, field]) =>
              field !==
              (key === 'categoryId' || key === 'sizeGuideId'
                ? baseline.current[key] || undefined
                : baseline.current[key as keyof ProductFormValues]),
          ),
        );
        const response = await update.mutateAsync({
          id: initial.id,
          body: {
            ...changedFields,
            ...(diff.changed ? { variants: diff.changes } : {}),
            ...(imagesChanged ? { thumbnailStorageId, imageStorageIds } : {}),
            expectedVersion: version.current,
          },
        });
        savedId = initial.id;
        version.current = response.data.version;
        baseline.current = valuesFrom(response.data);
        form.reset(baseline.current);
        imageBaseline.current = imageIds(imagesFrom(response.data));
        toast.success(t('adminProductForm.saved'));
        allowNavigation();
        leave(true);
      } catch (cause) {
        let message = getErrorMessage(cause, t('adminProductForm.saveFailed'));

        if (cause instanceof ApiSdkError) {
          const productErrors: Record<string, string[]> = {};
          const cells: Record<string, Record<string, string>> = {};
          for (const [path, messages] of Object.entries(cause.fieldErrors)) {
            const prefix = Object.keys(diff.paths).find(
              (key) => path === key || path.startsWith(`${key}.`),
            );
            if (prefix) {
              const key = diff.paths[prefix];
              cells[key] = {
                ...cells[key],
                [path.slice(prefix.length + 1).split('.')[0] || 'row']: messages.join(' '),
              };
            } else productErrors[path] = messages;
          }
          setRowErrors(cells);
          const { unmatched } = setErrors(form, productErrors);
          if (unmatched.length) message += ` (${unmatched.join(', ')})`;
          setConflict(cause.status === 409);
        }
        setError(message);
      } finally {
        if (savedId)
          await Promise.all(
            resourceInvalidationKeys.products.map((queryKey) =>
              client.invalidateQueries({ queryKey }),
            ),
          );
        savingRef.current = false;
        setSaving(false);
      }
    },
  });

  useLinkedField(form, {
    source: 'name',
    target: 'slug',
    transform: (value) => slugify(value, { maxLength: 160 }),
    initiallyLinked: !initial,
  });

  const values = useFormValue(form, (state) => state.values);

  const dirty =
    saving ||
    imagesChanged ||
    rowsChanged ||
    upload.items.length > 0 ||
    JSON.stringify(values) !== JSON.stringify(baseline.current);

  const { allowNavigation } = useUnsavedChanges(dirty);

  const reloadSnapshot = async () => {
    if (saving || deleting) return;
    setSaving(true);
    savingRef.current = true;
    try {
      const fresh = await reload();
      if (!fresh) throw new Error(t('adminProductForm.loadFailed'));
      const freshVariants = await reloadVariants?.();
      if (freshVariants) {
        variantBaseline.current = freshVariants;
        setRows(variantRows(freshVariants));
      }
      setRowErrors({});
      version.current = fresh.version;
      baseline.current = valuesFrom(fresh);
      form.reset(baseline.current);
      for (const item of upload.items) upload.remove(item.id);
      setImages(imagesFrom(fresh));
      imageBaseline.current = imageIds(imagesFrom(fresh));
      setConflict(false);
      setError('');
    } catch (cause) {
      const message = getErrorMessage(cause, t('adminProductForm.loadFailed'));
      setError(message);
      toast.error(message);
      throw cause;
    } finally {
      setSaving(false);
      savingRef.current = false;
    }
  };

  const deleteConfirmed = async () => {
    if (!initial || deleting || saving) return;
    setDeleting(true);
    setError('');
    try {
      await removeProduct.mutateAsync(initial.id);
      allowNavigation();
      toast.success(t('adminProductForm.deleted'));
      navigate(listUrl, { replace: true });
    } catch (cause) {
      const message = getErrorMessage(cause, t('adminProductForm.deleteFailed'));
      setError(message);
      toast.error(message);
      throw cause;
    } finally {
      setDeleting(false);
    }
  };

  return {
    variantBaseline: variantBaseline.current,
    rows,
    setRows,
    rowErrors,
    form,
    schema,
    leave,
    returnToList,
    error,
    conflict,
    saving,
    deleting,
    upload,
    images,
    uploadsIncomplete,
    onItemsReorder: (ids: string[]) =>
      setImages((previous) => {
        const byKey = new Map(previous.map((image) => [image.key, image]));
        const ordered = [...new Set(ids)].flatMap((id) => {
          const image = byKey.get(id);
          return image ? [image] : [];
        });
        return [...ordered, ...previous.filter((image) => !ids.includes(image.key))];
      }),
    removeImage: (key: string) => {
      setRows((previous) =>
        previous.map((row) => ({
          ...row,
          images: row.images.filter(
            (image) => image.storageId !== images.find((entry) => entry.key === key)?.storageId,
          ),
        })),
      );
      upload.remove(key);
      setImages((previous) => previous.filter((image) => image.key !== key));
    },
    reloadSnapshot,
    deleteConfirmed,
  };
}
