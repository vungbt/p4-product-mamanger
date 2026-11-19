import {
  type ColumnDef,
  DataTable,
  type DataTableState,
  IconButton,
  Input,
  Select,
  Tag,
  Tooltip,
  useDebouncedCallback,
  useFormatters,
} from '@itclabs/react-ui';
import { useGetAdminVariants } from '@p4/api-sdk/react';
import { getErrorMessage } from '@p4/api-sdk/shared';
import type { InventoryBalance } from '@p4/shared';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import * as v from 'valibot';
import { ROUTES } from '@/constants/constants';
import useQueryParam from '@/hooks/use-query-param';

const SORT_FIELDS = ['sku', 'price', 'onHand', 'reserved', 'createdAt'] as const;

const PAGE_SIZES = [10, 20, 50];

const variantQuerySchema = v.object({
  page: v.optional(
    v.fallback(
      v.pipe(v.string(), v.transform(Number), v.safeInteger(), v.minValue(1), v.maxValue(100_000)),
      1,
    ),
    '1',
  ),
  pageSize: v.optional(
    v.fallback(
      v.pipe(
        v.string(),
        v.transform(Number),
        v.check((value) => PAGE_SIZES.includes(value)),
      ),
      20,
    ),
    '20',
  ),
  q: v.optional(v.fallback(v.pipe(v.string(), v.trim()), '')),
  status: v.fallback(v.optional(v.picklist(['active', 'inactive'])), undefined),
  sortBy: v.optional(v.fallback(v.picklist(SORT_FIELDS), 'sku'), 'sku'),
  sortOrder: v.optional(v.fallback(v.picklist(['asc', 'desc']), 'asc'), 'asc'),
});

/** Catalog-wide SKU search; each row leads to its product (FE-05). */
export default function AdminVariantsPage() {
  const { t } = useTranslation();
  const { formatCurrency, formatNumber } = useFormatters();
  const navigate = useNavigate();
  const [params, setQuery] = useQueryParam(variantQuerySchema);
  const [search, setSearch] = useState(params.q ?? '');

  const { page, pageSize, sortBy, sortOrder, status } = params;
  const q = params.q ?? '';

  const query = useGetAdminVariants({
    params: { query: { page, pageSize, q: q || undefined, status, sortBy, sortOrder } },
  });

  const applySearch = (value: string) => setQuery({ q: value, page: 1 }, { replace: true });

  const debouncedSearch = useDebouncedCallback(applySearch, 300);

  useEffect(() => {
    debouncedSearch.cancel();
    setSearch(q);
  }, [q, debouncedSearch]);

  const state: DataTableState = {
    sorting: [{ id: sortBy, desc: sortOrder === 'desc' }],
    pagination: { pageIndex: page - 1, pageSize },
    globalFilter: q,
    columnFilters: [],
    columnVisibility: {},
  };

  const changeTableState = (next: DataTableState) => {
    const sorting = next.sorting[0];
    const nextSortBy = SORT_FIELDS.find((field) => field === sorting?.id) ?? 'sku';
    const nextSortOrder = sorting?.desc ? 'desc' : 'asc';
    const reset =
      nextSortBy !== sortBy || nextSortOrder !== sortOrder || next.pagination.pageSize !== pageSize;

    if (!reset && next.pagination.pageIndex === page - 1) return;

    setQuery({
      page: reset ? 1 : next.pagination.pageIndex + 1,
      pageSize: next.pagination.pageSize,
      sortBy: nextSortBy,
      sortOrder: nextSortOrder,
    });
  };

  const changeSearch = (value: string) => {
    setSearch(value);

    if (value.trim()) debouncedSearch(value.trim());
    else {
      debouncedSearch.cancel();
      applySearch('');
    }
  };

  const columns: ColumnDef<InventoryBalance, unknown>[] = [
    {
      id: 'sku',
      accessorKey: 'sku',
      header: t('adminProducts.sku'),
      enableHiding: false,
      cell: ({ row }) => <span className="font-medium text-ink">{row.original.sku}</span>,
    },
    { id: 'size', accessorKey: 'size', header: t('adminProducts.size'), enableSorting: false },
    { id: 'color', accessorKey: 'color', header: t('adminProducts.color'), enableSorting: false },
    {
      id: 'price',
      accessorKey: 'price',
      header: t('adminProducts.price'),
      cell: ({ row }) => (
        <span className="tabular-nums">{formatCurrency(row.original.price, 'VND')}</span>
      ),
    },
    {
      id: 'onHand',
      accessorKey: 'onHand',
      header: t('adminProducts.variant.onHand'),
      cell: ({ row }) => <span className="tabular-nums">{formatNumber(row.original.onHand)}</span>,
    },
    {
      id: 'reserved',
      accessorKey: 'reserved',
      header: t('adminProducts.variant.reserved'),
      cell: ({ row }) => (
        <span className="tabular-nums">{formatNumber(row.original.reserved)}</span>
      ),
    },
    {
      id: 'status',
      header: t('adminProducts.statusLabel'),
      enableSorting: false,
      cell: ({ row }) => (
        <Tag size="sm" tone={row.original.status === 'active' ? 'success' : 'neutral'}>
          {t(`adminProducts.skuStatus.${row.original.status}`)}
        </Tag>
      ),
    },
    {
      id: 'actions',
      header: t('adminProducts.actions'),
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Tooltip content={t('adminProducts.variant.openProduct')}>
            <IconButton
              icon="view"
              variant="ghost"
              size="sm"
              label={`${t('adminProducts.variant.openProduct')}: ${row.original.sku}`}
              onClick={() => navigate(ROUTES.admin['product-detail'](row.original.productId))}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="overflow-hidden rounded-panel border border-line bg-surface shadow-panel">
      <div className="flex flex-wrap items-center gap-3 border-b border-line p-3">
        <Input
          aria-label={t('adminProducts.variant.search')}
          placeholder={t('adminProducts.variant.search')}
          icon="search"
          size="sm"
          rootClassName="w-full sm:w-72"
          value={search}
          clearable
          clearLabel={t('adminProducts.clearSearch')}
          onClear={() => changeSearch('')}
          onChange={(event) => changeSearch(event.target.value)}
        />
        <Select
          aria-label={t('adminProducts.statusFilter')}
          rootClassName="w-full sm:w-44"
          size="sm"
          searchable={false}
          clearable
          placeholder={t('adminProducts.allStatuses')}
          value={status ?? null}
          options={(['active', 'inactive'] as const).map((value) => ({
            value,
            label: t(`adminProducts.skuStatus.${value}`),
          }))}
          onValueChange={(value) =>
            setQuery({
              status: value === 'active' || value === 'inactive' ? value : undefined,
              page: 1,
            })
          }
        />
      </div>
      <DataTable
        className="rounded-none border-0 shadow-none"
        classNames={{ thead: 'bg-table-header text-ink', row: 'border-line', cell: 'align-middle' }}
        mode="server"
        rowCount={query.data?.meta?.total ?? 0}
        rows={query.data?.data ?? []}
        loading={query.isPending}
        error={
          query.isError
            ? getErrorMessage(query.error, t('adminProducts.variantsFailed'))
            : undefined
        }
        onRetry={() => void query.refetch()}
        emptyText={t(
          q || status ? 'adminProducts.variant.noMatches' : 'adminProducts.variant.empty',
        )}
        columns={columns}
        rowId={(row) => row.id}
        caption={t('menu.product-variants')}
        state={state}
        onStateChange={changeTableState}
        pageSizeOptions={PAGE_SIZES}
      />
    </div>
  );
}
