import type { ProductVariant, ProductVariantChanges } from '@p4/shared';
import {
  collectionDiff,
  saveCollectionRow,
  toggleCollectionRemoval,
} from '@/libraries/collection-editor/collection-diff';

export type VariantRow = {
  key: string;
  id?: string;
  expectedVersion?: number;
  sku: string;
  barcode: string | null;
  size: string;
  color: string;
  price: number;
  stock: number;
  status: 'active' | 'inactive';
  isDefault: boolean;
  removed: boolean;
  images: { storageId: string; url: string }[];
};

export function ensureRowDefault(rows: VariantRow[]): VariantRow[] {
  const active = rows.filter((row) => !row.removed && row.status === 'active');
  const chosen = active.find((row) => row.isDefault) ?? active[0];
  return rows.map((row) => ({ ...row, isDefault: row.key === chosen?.key }));
}

export function variantRows(variants: ProductVariant[]): VariantRow[] {
  return variants.map((row) => ({
    key: row.id,
    id: row.id,
    expectedVersion: row.version,
    sku: row.sku,
    barcode: row.barcode,
    size: row.size,
    color: row.color,
    price: row.price,
    stock: 0,
    status: row.status,
    isDefault: row.isDefault,
    removed: false,
    images: (row.images ?? []).map(({ storageId, url }) => ({ storageId, url })),
  }));
}

function variantValues(row: VariantRow) {
  return {
    sku: row.sku,
    barcode: row.barcode || null,
    size: row.size,
    color: row.color,
    price: row.price,
    status: row.status,
    isDefault: row.isDefault,
    imageStorageIds: row.images.map((image) => image.storageId),
  };
}

export function variantDiff(rows: VariantRow[], baseline: ProductVariant[]) {
  return collectionDiff<
    VariantRow,
    ProductVariant,
    string,
    NonNullable<ProductVariantChanges['create']>[number],
    NonNullable<ProductVariantChanges['update']>[number]
  >(rows, baseline, {
    path: 'variants',
    rowKey: (row) => row.key,
    rowId: (row) => row.id,
    baselineId: (row) => row.id,
    isRemoved: (row) => row.removed,
    create: (row) => ({ ...variantValues(row), stock: row.stock }),
    update: (row, previous) => {
      const fields = Object.fromEntries(
        Object.entries(variantValues(row)).filter(([key, value]) =>
          key === 'imageStorageIds'
            ? JSON.stringify(value) !==
              JSON.stringify((previous.images ?? []).map((image) => image.storageId))
            : value !== previous[key as keyof ProductVariant],
        ),
      );
      return Object.keys(fields).length
        ? { ...fields, id: previous.id, expectedVersion: previous.version }
        : undefined;
    },
  });
}

export type VariantColorOption = { value: string; label: string; color: string };

function normalizeColor(value: string) {
  return value.trim().normalize('NFD').replace(/\p{M}/gu, '').replace(/[đĐ]/g, 'd').toLowerCase();
}

export function matchVariantColor(value: string, options: readonly VariantColorOption[]) {
  const normalized = normalizeColor(value);
  return options.find((option) =>
    [option.value, option.label].some((candidate) => normalizeColor(candidate) === normalized),
  );
}

export function customVariantColor(value: string): VariantColorOption {
  return {
    value,
    label: value,
    color: /^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(value)
      ? value
      : 'var(--color-muted)',
  };
}

// Dialog submissions replace one row without generating other combinations.
export function saveVariantRow(rows: VariantRow[], value: VariantRow): VariantRow[] {
  const next = saveCollectionRow(rows, value, (row) => row.key);
  return ensureRowDefault(
    next.map((row) =>
      value.isDefault && row.key !== value.key ? { ...row, isDefault: false } : row,
    ),
  );
}

export function toggleVariantRemoval(rows: VariantRow[], key: string): VariantRow[] {
  return ensureRowDefault(
    toggleCollectionRemoval(rows, key, {
      rowKey: (row) => row.key,
      rowId: (row) => row.id,
      toggleRemoved: (row) => ({ ...row, removed: !row.removed }),
    }),
  );
}
