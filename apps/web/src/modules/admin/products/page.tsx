import {
  Button,
  type ColumnDef,
  DataTable,
  DropdownMenu,
  Icon,
  IconButton,
  Input,
  Select,
  StatusTag,
  Tooltip,
  useFormatters,
} from '@itclabs/react-ui';
import { ImagePreview } from '@itclabs/react-ui/media-gallery';
import { useCanAccess } from '@p4/ability/browser';
import type { Product } from '@p4/api-sdk/shared';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/constants';
import { PAGE_SIZE_OPTIONS } from '@/constants/list';
import { useConfirm } from '@/libraries/confirm';
import { CategorySelect } from '@/libraries/selects';
import {
  PRODUCT_STATUSES,
  TRANSITIONS,
  useProductPublication,
  useProductStatusOptions,
} from './components/product-status';
import useProductsPage from './hooks/use-products-page';

const OPTIONAL_COLUMNS = ['category', 'stock', 'createdAt'] as const;

export default function AdminProductsPage() {
  const { t } = useTranslation();

  const confirm = useConfirm();

  const { formatCurrency, formatDate, formatNumber } = useFormatters();

  const navigate = useNavigate();

  const location = useLocation();

  const canWrite = useCanAccess('write', 'Catalog');

  const {
    rows,
    rowCount,
    state,
    search,
    filters,
    hasFilters,
    hasAppliedFilters,
    loading,
    refreshing,
    error,
    changeTableState,
    changeSearch,
    clearSearch,
    changeFilter,
    resetOrRefresh,
    changeColumnVisibility,
    refetch,
  } = useProductsPage();

  const savePublication = useProductPublication(refetch);

  const statusOptions = useProductStatusOptions();

  const listState = { from: location.search, returnTo: 'list' };

  const openDetails = (product: Product) =>
    navigate(ROUTES.admin['product-detail'](product.id), { state: listState });

  const openEdit = (product: Product) =>
    navigate(ROUTES.admin['product-edit'](product.id), { state: listState });

  const columns: ColumnDef<Product, unknown>[] = [
    {
      id: 'name',
      accessorKey: 'name',
      header: t('adminProducts.name'),
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex min-w-0 items-center gap-3">
          <ImagePreview
            size="sm"
            className="shrink-0"
            aria-label={row.original.name}
            items={
              row.original.thumbnailUrl
                ? [{ id: row.original.id, src: row.original.thumbnailUrl, alt: row.original.name }]
                : []
            }
          />
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{row.original.name}</p>
            <p className="truncate text-ui-sm text-muted">{row.original.slug}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'category',
      header: t('adminProducts.category'),
      enableSorting: false,
      cell: ({ row }) => row.original.category?.name ?? t('adminProducts.noCategory'),
    },
    {
      id: 'price',
      accessorKey: 'price',
      header: t('adminProducts.price'),
      enableHiding: false,
      cell: ({ row }) => (
        <span className="tabular-nums">{formatCurrency(row.original.price, 'VND')}</span>
      ),
    },
    {
      id: 'stock',
      accessorKey: 'stock',
      header: t('adminProducts.stock'),
      cell: ({ row }) => (
        <span className={row.original.stock > 0 ? 'tabular-nums' : 'tabular-nums text-danger-700'}>
          {formatNumber(row.original.stock)}
        </span>
      ),
    },
    {
      id: 'status',
      header: t('adminProducts.statusLabel'),
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <StatusTag
          value={row.original.status}
          options={statusOptions}
          transitions={TRANSITIONS}
          exclude={['archived']}
          onValueChange={canWrite ? (status) => savePublication(row.original, status) : undefined}
          aria-label={`${t('adminProducts.changeStatus')}: ${row.original.name}`}
        />
      ),
    },
    {
      id: 'createdAt',
      accessorKey: 'createdAt',
      header: t('adminProducts.createdAt'),
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      id: 'actions',
      header: t('adminProducts.actions'),
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          {canWrite && row.original.status !== 'archived' && (
            <Tooltip content={t('adminProducts.archive')}>
              <span className="inline-flex">
                <IconButton
                  icon="delete"
                  variant="ghost"
                  size="sm"
                  className="bg-danger-50 text-danger-700 hover:bg-danger-50 hover:text-danger-800"
                  label={`${t('adminProducts.archive')}: ${row.original.name}`}
                  onClick={() =>
                    void confirm({
                      title: t('adminProducts.archiveTitle'),
                      description: t('adminProducts.archiveConfirm', { name: row.original.name }),
                      tone: 'danger',
                      confirmLabel: t('adminProducts.archive'),
                      onConfirm: () => savePublication(row.original, 'archived'),
                    })
                  }
                />
              </span>
            </Tooltip>
          )}
          <Tooltip content={t('adminProducts.details')}>
            <IconButton
              icon="view"
              variant="ghost"
              size="sm"
              className="bg-info-50 text-info-700 hover:bg-info-50 hover:text-info-700"
              label={`${t('adminProducts.details')}: ${row.original.name}`}
              onClick={() => openDetails(row.original)}
            />
          </Tooltip>
          {canWrite && row.original.status !== 'archived' && (
            <Tooltip content={t('adminProducts.edit')}>
              <IconButton
                icon="edit"
                variant="ghost"
                size="sm"
                className="bg-warning-50 text-warning-700 hover:bg-warning-50 hover:text-warning-700"
                label={`${t('adminProducts.edit')}: ${row.original.name}`}
                onClick={() => openEdit(row.original)}
              />
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="grid gap-4">
      <p className="text-ui-sm text-muted">{t('adminProducts.intro')}</p>
      <div className="overflow-hidden rounded-panel border border-line bg-surface shadow-panel">
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-3">
          <Input
            aria-label={t('adminProducts.search')}
            placeholder={t('adminProducts.search')}
            icon="search"
            size="sm"
            rootClassName="w-full sm:w-72"
            value={search}
            onChange={(event) => changeSearch(event.target.value)}
            endAddon={
              search ? (
                <Tooltip content={t('adminProducts.clearSearch')}>
                  <IconButton
                    icon="close"
                    variant="ghost"
                    size="sm"
                    label={t('adminProducts.clearSearch')}
                    className="size-5 rounded p-0.5 text-muted hover:bg-hover-strong hover:text-ink [&_svg]:stroke-[1.5]"
                    iconClassName="size-4"
                    onClick={clearSearch}
                  />
                </Tooltip>
              ) : undefined
            }
          />
          <Select
            aria-label={t('adminProducts.statusFilter')}
            classNames={{
              control: 'text-ui-sm',
              menu: 'text-ui-sm',
              clearIndicator: '[&_svg]:stroke-[1.5]',
            }}
            rootClassName="w-full sm:w-44"
            size="sm"
            searchable={false}
            clearable
            placeholder={t('adminProducts.allStatuses')}
            value={filters.status ?? null}
            options={PRODUCT_STATUSES.map((status) => ({
              value: status,
              label:
                (
                  {
                    draft: t('adminProducts.status.draft'),
                    active: t('adminProducts.status.active'),
                    inactive: t('adminProducts.status.inactive'),
                    archived: t('adminProducts.status.archived'),
                  } as Record<string, string>
                )[status] ?? String(status),
            }))}
            onValueChange={(value) =>
              changeFilter({ status: PRODUCT_STATUSES.find((status) => status === value) })
            }
          />
          <CategorySelect
            aria-label={t('adminProducts.categoryFilter')}
            size="sm"
            rootClassName="w-full sm:w-52"
            classNames={{
              control: 'text-ui-sm',
              menu: 'text-ui-sm',
              clearIndicator: '[&_svg]:stroke-[1.5]',
            }}
            clearable
            placeholder={t('adminProducts.allCategories')}
            value={filters.categoryId ?? null}
            onValueChange={(value) => changeFilter({ categoryId: value || undefined })}
          />
          <Select
            aria-label={t('adminProducts.availabilityFilter')}
            classNames={{
              control: 'text-ui-sm',
              menu: 'text-ui-sm',
              clearIndicator: '[&_svg]:stroke-[1.5]',
            }}
            rootClassName="w-full sm:w-44"
            size="sm"
            searchable={false}
            clearable
            placeholder={t('adminProducts.allAvailability')}
            value={filters.availability ?? null}
            options={[
              { value: 'in_stock', label: t('adminProducts.availability.in_stock') },
              { value: 'out_of_stock', label: t('adminProducts.availability.out_of_stock') },
            ]}
            onValueChange={(value) =>
              changeFilter({
                availability: value === 'in_stock' || value === 'out_of_stock' ? value : undefined,
              })
            }
          />
          <Tooltip content={t(hasFilters ? 'adminProducts.clearFilters' : 'adminProducts.refresh')}>
            <IconButton
              icon="refresh"
              variant="secondary"
              size="sm"
              label={t(hasFilters ? 'adminProducts.clearFilters' : 'adminProducts.refresh')}
              loading={(loading || refreshing) && !hasFilters}
              onClick={resetOrRefresh}
            />
          </Tooltip>
          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu
              trigger={
                <Button variant="secondary" size="sm">
                  <Icon name="settings" />
                  {t('adminProducts.columns')}
                </Button>
              }
              items={OPTIONAL_COLUMNS.map((id) => ({
                id,
                type: 'checkbox' as const,
                label: {
                  category: t('adminProducts.category'),
                  stock: t('adminProducts.stock'),
                  createdAt: t('adminProducts.createdAt'),
                }[id],
                checked: state.columnVisibility?.[id] !== false,
                closeOnSelect: false,
                onCheckedChange: (checked: boolean) => changeColumnVisibility(id, checked),
              }))}
            />
            {canWrite && (
              <Button
                size="sm"
                onClick={() => navigate(ROUTES.admin['product-new'], { state: listState })}
              >
                <Icon name="plus" />
                {t('adminProducts.add')}
              </Button>
            )}
          </div>
        </div>
        <DataTable
          className="rounded-none border-0 shadow-none"
          classNames={{
            thead: 'bg-table-header text-ink',
            row: 'border-line',
            cell: 'align-middle',
          }}
          mode="server"
          rowCount={rowCount}
          rows={rows}
          loading={loading}
          error={error}
          onRetry={refetch}
          emptyText={hasAppliedFilters ? t('adminProducts.noMatches') : t('adminProducts.empty')}
          columns={columns}
          rowId={(row) => row.id}
          caption={t('menu.product-list')}
          state={state}
          onStateChange={changeTableState}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
        />
      </div>
    </div>
  );
}
