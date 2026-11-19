import { type ColumnDef, Icon, StatusTag } from '@itclabs/react-ui';
import { ImagePreview } from '@itclabs/react-ui/media-gallery';
import { useGetAdminSizeGuidesId } from '@p4/api-sdk/react';
import type { ProductVariant } from '@p4/shared';
import { useTranslation } from 'react-i18next';
import { CollectionEditor } from '@/libraries/collection-editor';
import type { ProductImageEntry } from '@/modules/admin/products/hooks/use-product-form';
import { useVariantErrorLabel } from '@/modules/admin/products/hooks/use-variant-error-label';
import {
  customVariantColor,
  matchVariantColor,
  saveVariantRow,
  toggleVariantRemoval,
  type VariantRow,
  variantDiff,
} from '@/modules/admin/products/hooks/variant-diff';
import { VariantDialog } from './variant-dialog';

export function VariantsSection({
  rows,
  baseline,
  images,
  onChange,
  errors,
  disabled,
  slug,
  price,
  sizeGuideId,
}: {
  rows: VariantRow[];
  baseline: ProductVariant[];
  images: ProductImageEntry[];
  onChange: (rows: VariantRow[]) => void;
  errors: Record<string, Record<string, string>>;
  disabled: boolean;
  slug: string;
  price: number;
  sizeGuideId: string;
}) {
  const { t, i18n } = useTranslation();

  const errorLabel = useVariantErrorLabel();

  const guide = useGetAdminSizeGuidesId(
    { params: { path: { id: sizeGuideId } } },
    { enabled: Boolean(sizeGuideId) },
  );

  const colors = [
    { value: 'Đen', color: '#000000', label: t('adminProducts.variant.colors.black') },
    { value: 'Trắng', color: '#FFFFFF', label: t('adminProducts.variant.colors.white') },
    { value: 'Xám', color: '#808080', label: t('adminProducts.variant.colors.gray') },
    { value: 'Be', color: '#D9C5A0', label: t('adminProducts.variant.colors.beige') },
    { value: 'Nâu', color: '#795548', label: t('adminProducts.variant.colors.brown') },
    { value: 'Đỏ', color: '#D32F2F', label: t('adminProducts.variant.colors.red') },
    { value: 'Hồng', color: '#EC407A', label: t('adminProducts.variant.colors.pink') },
    { value: 'Cam', color: '#F57C00', label: t('adminProducts.variant.colors.orange') },
    { value: 'Vàng', color: '#FBC02D', label: t('adminProducts.variant.colors.yellow') },
    { value: 'Xanh lá', color: '#388E3C', label: t('adminProducts.variant.colors.green') },
    { value: 'Xanh dương', color: '#1976D2', label: t('adminProducts.variant.colors.blue') },
    { value: 'Navy', color: '#000080', label: t('adminProducts.variant.colors.navy') },
    { value: 'Tím', color: '#7B1FA2', label: t('adminProducts.variant.colors.purple') },
  ];

  const measurements = guide.data?.data.measurements;
  const guideSizes = Array.isArray(measurements)
    ? measurements.flatMap((row) =>
        row && typeof row === 'object' && !Array.isArray(row) && typeof row.size === 'string'
          ? [row.size.toUpperCase()]
          : [],
      )
    : [];
  const sizes = [
    ...new Set([
      ...(guideSizes.length ? guideSizes : ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'FREESIZE']),
      ...rows.map((row) => row.size),
    ]),
  ];

  const createRow = (): VariantRow => ({
    key: crypto.randomUUID(),
    sku: '',
    barcode: null,
    size: '',
    color: '',
    price,
    stock: 0,
    status: 'active',
    isDefault: !rows.some((row) => !row.removed && row.isDefault),
    removed: false,
    images: [],
  });

  const columns: ColumnDef<VariantRow, unknown>[] = [
    {
      id: 'size',
      header: `${t('adminProducts.size')} · ${t('adminProducts.color')}`,
      cell: ({ row: { original: row } }) => {
        const color = matchVariantColor(row.color, colors) ?? customVariantColor(row.color);

        return (
          <span className="inline-flex items-center gap-2 whitespace-nowrap">
            <span
              aria-hidden="true"
              className="size-3 shrink-0 rounded-full border border-line"
              style={{ backgroundColor: color.color }}
            />
            {row.size} · {color.label}
          </span>
        );
      },
    },
    { accessorKey: 'sku', header: t('adminProducts.sku') },
    {
      id: 'barcode',
      header: t('adminProducts.variant.barcode'),
      cell: ({ row }) => row.original.barcode || '—',
    },
    {
      id: 'price',
      header: t('adminProducts.price'),
      cell: ({ row }) =>
        new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'VND' }).format(
          row.original.price,
        ),
    },
    {
      id: 'stock',
      header: t('adminProductForm.stock'),
      cell: ({ row }) => (row.original.id ? '—' : row.original.stock),
    },
    {
      id: 'status',
      header: t('adminProducts.statusLabel'),
      cell: ({ row }) => (
        <StatusTag
          value={row.original.status}
          options={[
            { value: 'active', label: t('adminProductForm.variantActive'), tone: 'success' },
            { value: 'inactive', label: t('adminProductForm.variantInactive'), tone: 'neutral' },
          ]}
        />
      ),
    },
    {
      id: 'isDefault',
      header: t('adminProducts.defaultSku'),
      cell: ({ row }) =>
        row.original.isDefault ? (
          <Icon name="check" aria-label={t('adminProducts.defaultSku')} />
        ) : (
          '—'
        ),
    },
    {
      id: 'images',
      header: t('adminProductForm.variantImagesColumn'),
      cell: ({ row }) => (
        <ImagePreview
          size="sm"
          variant="stack"
          maxVisible={3}
          emptyFallback="—"
          items={row.original.images.map((image) => ({
            id: image.storageId,
            src: image.url,
            alt: row.original.sku,
          }))}
        />
      ),
    },
  ];

  return (
    <CollectionEditor
      rows={rows}
      columns={columns}
      rowKey={(row) => row.key}
      rowLabel={(row) => row.sku}
      change={(row) =>
        row.removed
          ? 'deleted'
          : !row.id
            ? 'new'
            : variantDiff([row], baseline).changed
              ? 'edited'
              : undefined
      }
      createRow={createRow}
      saveRow={(row) => onChange(saveVariantRow(rows, row))}
      toggleRemoval={(row) => onChange(toggleVariantRemoval(rows, row.key))}
      errors={errors}
      errorLabel={errorLabel}
      disabled={disabled}
      labels={{
        title: t('adminProductForm.variantSection'),
        description: t('adminProductForm.variantHint'),
        add: t('adminProductForm.addVariant'),
        edit: t('adminProductForm.editVariant'),
        remove: t('adminProductForm.removeVariant'),
        undo: t('adminProductForm.undoVariant'),
        emptyTitle: t('adminProductForm.noVariants'),
        emptyDescription: t('adminProductForm.noVariantsDescription'),
        error: t('adminProductForm.variantError'),
        new: t('adminProductForm.rowNew'),
        edited: t('adminProductForm.rowEdited'),
        deleted: t('adminProductForm.rowDeleted'),
      }}
      renderDialog={({ initial, ...dialog }) => (
        <VariantDialog
          key={initial.key}
          initial={initial}
          {...dialog}
          rows={rows}
          images={images}
          sizes={sizes}
          colors={colors}
          slug={slug}
          disabled={disabled}
        />
      )}
    />
  );
}
