import type { ColumnDef } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';
import { cn, getStockTag } from '../../helpers';
import { Table } from '../../modules/table';
import { UiImage } from '../link-image-provider';
import { Tag } from '../tag';

export type LowStockProduct = {
  id: string;
  name: string;
  stock: number;
  image?: {
    url: string;
    alt?: string;
  };
};

export type LowStockTableProps = {
  products: LowStockProduct[];
  loading?: boolean;
  className?: string;
};

// AD-03 Dashboard (docs/design/DESIGN-SYSTEM-TASKS.md) — the "products running low on stock"
// table. The API (GET /api/dashboard/stats) already filters to stock <= LOW_STOCK_THRESHOLD, so
// every row here is "low" by definition; the Tag still distinguishes out-of-stock (error) from
// merely low (pending) via the same getStockTag rule ProductCard uses for its own stock badge.
export function LowStockTable({ products, loading, className }: LowStockTableProps) {
  const { t } = useTranslation('ui');

  const columns: ColumnDef<LowStockProduct>[] = [
    {
      id: 'product',
      header: t('lowStockTable.columnProduct'),
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          {row.original.image?.url && (
            <UiImage
              src={row.original.image.url}
              alt={row.original.image.alt ?? row.original.name}
              className="h-9 w-9 shrink-0 rounded-lg object-cover"
            />
          )}
          <span className="text-13.5 font-medium text-neutral-text-primary">
            {row.original.name}
          </span>
        </div>
      ),
    },
    {
      id: 'stock',
      header: t('lowStockTable.columnStock'),
      meta: { align: 'right' },
      cell: ({ row }) => {
        const { content, color } = getStockTag(
          row.original.stock,
          t('lowStockTable.stockCount', { count: row.original.stock }),
          t('lowStockTable.outOfStock'),
        );
        return <Tag content={content} color={color} />;
      },
    },
  ];

  return (
    <Table
      columns={columns}
      data={products}
      rowKey="id"
      loading={loading}
      customClasses={{ root: cn('rounded-xl border border-neutral-border', className) }}
    />
  );
}
