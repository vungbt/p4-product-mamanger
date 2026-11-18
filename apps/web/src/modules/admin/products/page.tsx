import {
  Button,
  type ColumnDef,
  DataTable,
  DropdownMenu,
  Icon,
  IconButton,
  Input,
  Select,
  Tag,
  type TagTone,
  Tooltip,
} from '@itclabs/react-ui';
import { useAllCategories } from '@p4/api-sdk/react';
import type { Product, ProductPublicationStatus } from '@p4/shared';
import { useTranslation } from 'react-i18next';
import ProductDetails from './components/products-details';
import ProductsImage from './components/products-image';
import { extractRichText } from './helpers/rich-text';
import useProductsPage from './hooks/use-products-page';

const statusTone: Record<ProductPublicationStatus, TagTone> = {
  draft: 'neutral',
  active: 'success',
  inactive: 'warning',
  archived: 'danger',
};

export default function AdminProductsPage() {
  const { t } = useTranslation();
  const categoriesQuery = useAllCategories();
  const categoryOptions = (categoriesQuery.data ?? []).map((cat) => ({
    value: cat.id,
    label: cat.name,
  }));

  const {
    rows,
    rowCount,
    state,
    search,
    categoryFilter,
    hasFilters,
    hasAppliedFilters,
    viewing,
    loading,
    error,
    changeTableState,
    changeSearch,
    clearSearch,
    resetOrRefresh,
    changeCategoryFilter,
    changeColumnVisibility,
    openDetails,
    closeDetails,
    retry,
  } = useProductsPage();

  const columns: ColumnDef<Product, unknown>[] = [
    {
      accessorKey: 'imageUrl',
      header: t('products.image', 'Ảnh'),
      enableSorting: false,
      cell: ({ row }) => {
        return row.original.imageUrl ? (
          <ProductsImage src={row.original.imageUrl} alt={row.original.name} />
        ) : (
          <span className="text-ui-xs text-muted">{t('products.noImage', 'Không có ảnh')}</span>
        );
      },
    },
    { accessorKey: 'name', header: t('products.name', 'Tên sản phẩm'), enableHiding: false },
    {
      accessorKey: 'price',
      header: t('products.price', 'Giá bán'),
      cell: ({ row }) => `${row.original.price?.toLocaleString('vi-VN') ?? 0}đ`,
    },
    {
      accessorKey: 'stock',
      header: t('products.stock', 'Số lượng tồn kho'),
      cell: ({ row }) => row.original.stock ?? 0,
    },
    {
      accessorKey: 'description',
      header: t('products.description', 'Mô tả sản phẩm'),
      enableSorting: false,
      cell: ({ row }) => {
        const text = extractRichText(row.original.description).replace(/\s+/g, ' ').trim();
        return (
          <span className="block max-w-sm truncate" title={text}>
            {text || t('products.noDescription', 'Chưa có mô tả')}
          </span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: t('products.status', 'Trạng thái'),
      enableSorting: false,
      cell: ({ row }) => {
        const status = (row.original as Product & { status?: ProductPublicationStatus }).status;
        if (!status) return null;
        return (
          <Tag tone={statusTone[status] ?? 'neutral'} size="sm">
            {t(`products.statuses.${status}`, status)}
          </Tag>
        );
      },
    },
    {
      id: 'category',
      header: t('products.category', 'Danh mục'),
      enableSorting: false,
      cell: ({ row }) => row.original.category?.name || t('products.none', 'Chưa phân loại'),
    },
    {
      id: 'actions',
      header: t('products.actions', 'Thao tác'),
      enableSorting: false,
      enableHiding: false,
      enableGlobalFilter: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Tooltip content={t('products.details', 'Xem chi tiết')}>
            <IconButton
              icon="view"
              variant="ghost"
              size="sm"
              className="bg-info-50 text-info-700 hover:bg-info-100 hover:text-info-800"
              label={`${t('products.details', 'Xem chi tiết')}: ${row.original.name}`}
              onClick={() => openDetails(row.original)}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="grid gap-4">
      <p className="text-ui-sm text-muted">{t('products.intro')}</p>
      <div className="overflow-hidden rounded-panel border border-line bg-surface shadow-panel">
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-3">
          <Input
            aria-label={t('products.search')}
            placeholder={t('products.search')}
            icon="search"
            size="sm"
            rootClassName="w-full sm:w-72"
            value={search}
            onChange={(event) => changeSearch(event.target.value)}
            endAddon={
              search ? (
                <Tooltip content={t('products.clearSearch')}>
                  <IconButton
                    icon="close"
                    variant="ghost"
                    size="sm"
                    label={t('products.clearSearch')}
                    className="size-5 rounded p-0.5 text-muted hover:bg-hover-strong hover:text-ink [&_svg]:stroke-[1.5]"
                    iconClassName="size-4"
                    onClick={clearSearch}
                  />
                </Tooltip>
              ) : undefined
            }
          />
          <Select
            aria-label={t('products.category')}
            classNames={{
              control: 'text-ui-sm',
              menu: 'text-ui-sm',
              clearIndicator: '[&_svg]:stroke-[1.5]',
            }}
            rootClassName="w-full sm:w-48"
            size="sm"
            searchable={false}
            clearable
            placeholder={t('products.category')}
            value={categoryFilter ?? null}
            options={categoryOptions}
            onValueChange={changeCategoryFilter}
          />
          <Tooltip content={t(hasFilters ? 'products.clearFilters' : 'products.refresh')}>
            <IconButton
              icon="refresh"
              variant="secondary"
              size="sm"
              label={t(hasFilters ? 'products.clearFilters' : 'products.refresh')}
              loading={loading && !hasFilters}
              onClick={resetOrRefresh}
            />
          </Tooltip>
          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu
              trigger={
                <Button variant="secondary" size="sm">
                  <Icon name="settings" />
                  {t('products.columns', 'Cột hiển thị')}
                </Button>
              }
              items={['imageUrl', 'price', 'stock', 'description', 'category', 'status'].map(
                (id) => ({
                  id,
                  type: 'checkbox' as const,
                  label: id === 'imageUrl' ? t('products.image', 'Ảnh') : t(`products.${id}`),
                  checked: state.columnVisibility?.[id] !== false,
                  onCheckedChange: (checked) => changeColumnVisibility(id, checked),
                }),
              )}
            />
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
          onRetry={retry}
          emptyText={hasAppliedFilters ? t('products.noMatches') : t('products.empty')}
          columns={columns}
          rowId={(row) => row.id}
          caption={t('menu.admin-products')}
          state={state}
          onStateChange={changeTableState}
          pageSizeOptions={[10, 20, 50]}
        />
      </div>
      {viewing && <ProductDetails id={viewing} onClose={closeDetails} />}
    </div>
  );
}
