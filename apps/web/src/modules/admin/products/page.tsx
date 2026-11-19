import {
  Button,
  type ColumnDef,
  DataTable,
  DropdownMenu,
  Icon,
  IconButton,
  Input,
  Select,
  Tooltip,
  useFormatters,
} from '@itclabs/react-ui';
import { useCanAccess } from '@p4/ability/browser';
import type { Product } from '@p4/api-sdk/shared';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/constants';
import {
  PRODUCT_STATUSES,
  ProductStatusMenu,
  ProductStatusTag,
  useProductPublication,
} from './components/product-status';
import useProductsPage from './hooks/use-products-page';

const OPTIONAL_COLUMNS = ['category', 'stock', 'createdAt'] as const;

export default function AdminProductsPage() {
  const { t } = useTranslation();
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
    categories,
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
  const publication = useProductPublication(refetch);

  const listState = { from: location.search };

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
          {row.original.imageUrl ? (
            <img
              src={row.original.imageUrl}
              alt=""
              className="size-10 shrink-0 rounded-control border border-line object-cover"
              loading="lazy"
            />
          ) : (
            <span className="grid size-10 shrink-0 place-items-center rounded-control border border-line bg-canvas text-muted">
              <Icon name="grid" className="size-4" />
            </span>
          )}
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
      cell: ({ row }) => <ProductStatusTag status={row.original.status} />,
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
          <Tooltip content={t('adminProducts.details')}>
            <IconButton
              icon="view"
              variant="ghost"
              size="sm"
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
                label={`${t('adminProducts.edit')}: ${row.original.name}`}
                onClick={() => openEdit(row.original)}
              />
            </Tooltip>
          )}
          {canWrite && (
            <ProductStatusMenu
              product={row.original}
              disabled={publication.changing === row.original.id}
              onSelect={(status) => publication.request(row.original, status)}
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="grid gap-4">
      <div className="overflow-hidden rounded-panel border border-line bg-surface shadow-panel">
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-3">
          <Input
            aria-label={t('adminProducts.search')}
            placeholder={t('adminProducts.search')}
            icon="search"
            size="sm"
            rootClassName="w-full sm:w-72"
            value={search}
            clearable
            clearLabel={t('adminProducts.clearSearch')}
            onClear={clearSearch}
            onChange={(event) => changeSearch(event.target.value)}
          />
          <Select
            aria-label={t('adminProducts.statusFilter')}
            rootClassName="w-full sm:w-44"
            size="sm"
            searchable={false}
            clearable
            placeholder={t('adminProducts.allStatuses')}
            value={filters.status ?? null}
            options={PRODUCT_STATUSES.map((status) => ({
              value: status,
              label: t(`adminProducts.status.${status}`),
            }))}
            onValueChange={(value) =>
              changeFilter({ status: PRODUCT_STATUSES.find((status) => status === value) })
            }
          />
          <Select
            aria-label={t('adminProducts.categoryFilter')}
            rootClassName="w-full sm:w-52"
            size="sm"
            clearable
            placeholder={t('adminProducts.allCategories')}
            value={filters.categoryId ?? null}
            options={categories.map((category) => ({ value: category.id, label: category.name }))}
            onValueChange={(value) => changeFilter({ categoryId: value ?? undefined })}
          />
          <Select
            aria-label={t('adminProducts.availabilityFilter')}
            rootClassName="w-full sm:w-44"
            size="sm"
            searchable={false}
            clearable
            placeholder={t('adminProducts.allAvailability')}
            value={filters.availability ?? null}
            options={(['in_stock', 'out_of_stock'] as const).map((value) => ({
              value,
              label: t(`adminProducts.availability.${value}`),
            }))}
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
              loading={refreshing && !hasFilters}
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
                label: t(`adminProducts.${id}`),
                checked: state.columnVisibility?.[id] !== false,
                closeOnSelect: false,
                onCheckedChange: (checked: boolean) => changeColumnVisibility(id, checked),
              }))}
            />
            {canWrite && (
              <Button size="sm" onClick={() => navigate(ROUTES.admin['product-new'])}>
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
          pageSizeOptions={[10, 20, 50]}
        />
      </div>
      {publication.confirmDialog}
    </div>
  );
}
