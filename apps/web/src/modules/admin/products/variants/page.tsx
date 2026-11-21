import {
  type ColumnDef,
  DataTable,
  Icon,
  IconButton,
  Input,
  Select,
  StatusTag,
  Tooltip,
  UiImage,
  useFormatters,
} from '@itclabs/react-ui';
import { useGetAdminVariants } from '@p4/api-sdk/react';
import type { InventoryBalance } from '@p4/shared';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import * as v from 'valibot';
import { ROUTES } from '@/constants/constants';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@/constants/list';
import useQueryParam from '@/hooks/use-query-param';

const variantQuerySchema = v.object({
  page: v.optional(
    v.fallback(v.pipe(v.string(), v.transform(Number), v.safeInteger(), v.minValue(1)), 1),
    '1',
  ),
  pageSize: v.optional(
    v.fallback(
      v.pipe(
        v.string(),
        v.transform(Number),
        v.check((value) => PAGE_SIZE_OPTIONS.some((size) => size === value)),
      ),
      DEFAULT_PAGE_SIZE,
    ),
    String(DEFAULT_PAGE_SIZE),
  ),
  q: v.optional(v.fallback(v.pipe(v.string(), v.trim()), '')),
  status: v.fallback(v.optional(v.picklist(['active', 'inactive'])), undefined),
  sortBy: v.optional(
    v.fallback(v.picklist(['sku', 'price', 'onHand', 'reserved', 'createdAt']), 'createdAt'),
    'createdAt',
  ),
  sortOrder: v.optional(v.fallback(v.picklist(['asc', 'desc']), 'desc'), 'desc'),
});
export default function VariantPage() {
  const { t } = useTranslation();
  const { formatCurrency, formatNumber } = useFormatters();
  const navigate = useNavigate();

  const [params, setQuery] = useQueryParam(variantQuerySchema);

  const { data, isLoading, isError, refetch } = useGetAdminVariants({
    params: {
      query: {
        page: params.page,
        pageSize: params.pageSize,
        q: params.q || undefined,
        status: params.status,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
      },
    },
  });
  const rows = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const columns: ColumnDef<InventoryBalance, unknown>[] = [
    {
      id: 'sku',
      header: t('adminProducts.sku'),
      cell: ({ row }) => {
        const item = row.original;
        const thumbnail = item.images?.[0]?.url;
        return (
          <div className="flex items-center gap-2">
            {thumbnail ? (
              <UiImage src={thumbnail} alt={item.sku} className="" />
            ) : (
              <div className="">
                <Icon name="tag" className="size-5" />
              </div>
            )}
            <div className="">
              <div className="">{item.sku}</div>
              {item.barcode && <div className="">{item.barcode}</div>}
            </div>
          </div>
        );
      },
    },
    {
      id: 'variants',
      header: t('adminProducts.productInfo'),
      cell: ({ row }) => (
        <div className="">
          <span>{row.original.size}</span>
          <span>.</span>
          <span>{row.original.color}</span>
        </div>
      ),
    },
    {
      id: 'price',
      header: t('adminProducts.price'),
      cell: ({ row }) => <span>{formatCurrency(row.original.price, 'VND')}</span>,
    },
    {
      id: 'stock',
      header: t('adminProducts.stock'),
      cell: ({ row }) => {
        const { onHand, reserved } = row.original;
        return (
          <div className="text-sm">
            <div>{formatNumber(onHand)}</div>
            {reserved > 0 && (
              <div className="text-xs text-muted-foreground">
                {t('adminProducts.variant.reserved')}:{formatNumber(reserved)}
              </div>
            )}
          </div>
        );
      },
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
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Tooltip content={t('adminProducts.viewDetails')}>
          <IconButton
            label={t('adminProducts.viewDetails')}
            icon="arrowRight"
            variant="ghost"
            onClick={() => navigate(ROUTES.admin['product-detail'](row.original.productId))}
          />
        </Tooltip>
      ),
    },
  ];
  const state = {
    sorting: [{ id: params.sortBy, desc: params.sortOrder === 'desc' }],
    pagination: { pageIndex: params.page - 1, pageSize: params.pageSize },
  };
  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('adminProducts.variants')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('adminProducts.variantsSubtitle', 'Quản lý toàn bộ SKU và tồn kho biến thể')}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-72">
          <Input
            placeholder={t('common.search')}
            value={params.q ?? ''}
            onChange={(e) => setQuery({ q: e.target.value, page: 1 })}
          />
        </div>
        <div className="w-44">
          <Select
            value={params.status ?? t('adminProducts.all')}
            options={[
              { value: 'all', label: t('adminProducts.all') },
              { value: 'active', label: t('adminProductForm.variantActive') },
              { value: 'inactive', label: t('adminProductForm.variantInactive') },
            ]}
            onValueChange={(val) =>
              setQuery({
                status: val === 'all' ? undefined : (val as 'active' | 'inactive'),
                page: 1,
              })
            }
          />
        </div>
      </div>
      <DataTable
        mode="server"
        columns={columns}
        rows={rows}
        rowCount={total}
        loading={isLoading}
        error={isError ? t('common.errorOccurred') : undefined}
        onRetry={refetch}
        state={state}
        onStateChange={(next) => {
          if (next.pagination) {
            setQuery({
              page: next.pagination.pageIndex + 1,
              pageSize: next.pagination.pageSize,
            });
          }
          if (next.sorting && next.sorting[0]) {
            setQuery({
              sortBy: next.sorting[0].id as any,
              sortOrder: next.sorting[0].desc ? 'desc' : 'asc',
            });
          }
        }}
        rowId={(row) => row.id}
        caption={t('adminProducts.variantSection')}
        emptyText={t('adminProducts.noMatches')}
      />
    </div>
  );
}
