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
import type { InventoryBalance } from '@p4/shared';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/constants';
import useVariantsPage from './hooks/use-variants-page';

export default function VariantPage() {
  const { t } = useTranslation();

  const { formatCurrency, formatNumber } = useFormatters();

  const navigate = useNavigate();

  const {
    rows,
    rowCount,
    state,
    search,
    status,
    loading,
    refreshing,
    error,
    currency,
    changeSearch,
    clearSearch,
    changeStatus,
    changeTableState,
    refresh,
  } = useVariantsPage();

  const columns = useMemo<ColumnDef<InventoryBalance, unknown>[]>(
    () => [
      {
        id: 'sku',
        accessorKey: 'sku',
        header: t('adminProducts.sku'),
        cell: ({ row }) => {
          const item = row.original;
          const thumbnail = item.images?.[0]?.url;

          return (
            <div className="flex items-center gap-3">
              {thumbnail ? (
                <UiImage
                  src={thumbnail}
                  alt={item.sku}
                  className="size-10 rounded border border-canvas object-cover"
                />
              ) : (
                <div className="flex size-10 items-center justify-center rounded border border-canvas text-muted">
                  <Icon name="tag" className="size-5" />
                </div>
              )}
              <div className="min-w-0">
                <div className="font-medium text-ink">{item.sku}</div>
                {item.barcode && <div className="text-ui-sm text-muted">{item.barcode}</div>}
              </div>
            </div>
          );
        },
      },
      {
        id: 'variants',
        header: t('adminProducts.productInfo'),
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-ui-sm text-ink">
            <span>{row.original.size}</span>
            <span className="text-muted">·</span>
            <span>{row.original.color}</span>
          </div>
        ),
      },
      {
        id: 'price',
        accessorKey: 'price',
        header: t('adminProducts.price'),
        cell: ({ row }) => (
          <span className="tabular-nums font-medium text-ink">
            {formatCurrency(row.original.price, currency)}
          </span>
        ),
      },
      {
        id: 'onHand',
        accessorKey: 'onHand',
        header: t('adminProducts.stock'),
        cell: ({ row }) => {
          const { onHand, reserved } = row.original;

          return (
            <div className="text-ui-sm">
              <div className="tabular-nums font-medium text-ink">{formatNumber(onHand)}</div>
              {reserved > 0 && (
                <div className="text-xs text-muted">
                  {t('adminProducts.variant.reserved')}: {formatNumber(reserved)}
                </div>
              )}
            </div>
          );
        },
      },
      {
        id: 'status',
        header: t('adminProducts.statusLabel'),
        enableSorting: false,
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
        enableSorting: false,
        cell: ({ row }) => (
          <Tooltip content={t('adminProducts.details')}>
            <IconButton
              label={t('adminProducts.details')}
              icon="arrowRight"
              variant="ghost"
              onClick={() => navigate(ROUTES.admin['product-detail'](row.original.productId))}
            />
          </Tooltip>
        ),
      },
    ],
    [t, formatCurrency, formatNumber, navigate, currency],
  );

  return (
    <div className="grid gap-4">
      <p className="text-ui-sm text-muted">{t('adminProducts.variantsSubtitle')}</p>

      <div className="overflow-hidden rounded-panel border border-line bg-surface shadow-panel">
        <div className="flex flex-wrap items-center gap-3 border-line p-3">
          <div className="w-full sm:w-72">
            <Input
              placeholder={t('adminProducts.searchVariants')}
              value={search}
              onChange={(e) => changeSearch(e.target.value)}
              endAddon={
                search ? (
                  <Tooltip content={t('adminProducts.clearSearch')}>
                    <IconButton
                      icon="close"
                      variant="ghost"
                      size="sm"
                      label={t('adminProducts.clearSearch')}
                      className="size-5 p-0.5 text-muted hover:bg-hover-strong hover:text-ink [&_svg]:stroke-[1.5]"
                      iconClassName="size-4"
                      onClick={clearSearch}
                    />
                  </Tooltip>
                ) : undefined
              }
            />
          </div>

          <div className="w-full sm:w-44">
            <Select
              value={status ?? 'all'}
              options={[
                { value: 'all', label: t('adminProducts.all') },
                { value: 'active', label: t('adminProductForm.variantActive') },
                { value: 'inactive', label: t('adminProductForm.variantInactive') },
              ]}
              onValueChange={(val) => changeStatus(val as 'all' | 'active' | 'inactive')}
            />
          </div>

          <Tooltip content={t('adminProducts.refresh')}>
            <IconButton
              icon="refresh"
              variant="secondary"
              size="sm"
              label={t('adminProducts.refresh')}
              loading={refreshing}
              onClick={refresh}
            />
          </Tooltip>
        </div>

        <DataTable
          mode="server"
          columns={columns}
          rows={rows}
          rowCount={rowCount}
          loading={loading}
          error={error}
          onRetry={refresh}
          state={state}
          onStateChange={changeTableState}
          rowId={(row) => row.id}
          caption={t('adminProductForm.variantSection')}
          emptyText={t('adminProducts.noMatches')}
        />
      </div>
    </div>
  );
}
