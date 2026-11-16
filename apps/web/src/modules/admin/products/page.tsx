import {
  Button,
  type ColumnDef,
  DataTable,
  Dialog,
  DropdownMenu,
  Icon,
  IconButton,
  Input,
  Select,
  Tooltip,
} from '@itclabs/react-ui';
import { useCategories } from '@p4/api-sdk/react';
import type { Product } from '@p4/shared';
import { useTranslation } from 'react-i18next';
import ProductDetails from './components/products-details';
import ProductEditor from './components/products-editor';
import useProductsPage from './hooks/use-products-page';

// Navigation preview only; the product CRUD exercise remains unimplemented.
export default function AdminProductsPage() {
  const { t } = useTranslation();
  const categoriesQuery = useCategories({ pageSize: 50 });
  const categoryOptions = (categoriesQuery.data?.data ?? []).map((cat) => ({
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
    deleting,
    editor,
    loading,
    error,
    saving,
    deletingPending,
    changeTableState,
    changeSearch,
    clearSearch,
    resetOrRefresh,
    changeCategoryFilter,
    changeColumnVisibility,
    openCreate,
    openDetails,
    closeDetails,
    openEdit,
    closeEditor,
    openDelete,
    closeDelete,
    saveProduct,
    deleteProduct,
    retry,
  } = useProductsPage();

  const columns: ColumnDef<Product, unknown>[] = [
    { accessorKey: 'name', header: t('products.name', 'Tên sản phẩm'), enableHiding: false },
    {
      accessorKey: 'price',
      header: t('products.price', 'Giá bán'),
      cell: ({ row }) => `${row.original.price?.toLocaleString(`vi-VN`) ?? 0}đ`,
    },
    {
      accessorKey: 'stock',
      header: t('products.stock', 'Số lượng tồn kho'),
      cell: ({ row }) => row.original.stock ?? 0,
    },
    {
      accessorKey: 'imageUrl',
      header: t('products.showcaseImage', 'Ảnh mô tả sản phẩm'),
      cell: ({ row }) => `${row.original.imageUrl}`,
    },
    {
      accessorKey: 'description',
      header: t('products.description', 'Mô tả sản phẩm'),
      cell: ({ row }) => (
        <span className="block max-w-sm truncate" title={row.original.description}>
          {row.original.description || t('products.noDescription', 'Chưa có mô tả')}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: t('products.status', 'Trạng thái'),
      cell: ({ row }) => {
        const status = (row.original as any).status || 'draft';
        return (
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-ui-xs font-medium capitalize">
            {String(t(`products.statuses.${status}` as any, status))}
          </span>
        );
      },
    },
    {
      id: 'category',
      header: t('products.category', 'Danh mục'),
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
          <Tooltip content={t('products.deleted')}>
            <IconButton
              icon="delete"
              variant="ghost"
              size="sm"
              className="bg-danger-50 text-danger-700 hover:bg-danger-50 hover:text-danger-800"
              label={`${t('products.deleted', 'Xóa')}: ${row.original.name}`}
              onClick={() => openDelete(row.original)}
            />
          </Tooltip>
          <Tooltip content={t('products.details', 'Xem chi tiết')}>
            <IconButton
              icon="view"
              variant="ghost"
              size="sm"
              className="bg-info-50 text-info-700 hover:bg-info-50 hover:text-info-700"
              label={`${t('common.details', 'Xem chi tiết')}:${row.original.name}`}
              onClick={() => openDetails(row.original)}
            />
          </Tooltip>
          <Tooltip content={t('products.edit', 'Chỉnh sửa')}>
            <IconButton
              icon="edit"
              variant="ghost"
              size="sm"
              className="bg-info-50 text-info-700 hover:bg-info-50 hover:text-info-700"
              label={`${t('products.edit', 'Chỉnh sửa')}:${row.original.name}`}
              onClick={() => openEdit(row.original)}
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
                  {t('products.columns')}
                </Button>
              }
              items={['price', 'stock', 'category', 'description', 'image'].map((id) => ({
                id,
                type: 'checkbox' as const,
                label: t(`products.${id}`),
                checked: state.columnVisibility?.[id] !== false,
                onCheckedChange: (checked) => changeColumnVisibility(id, checked),
              }))}
            />
            <Button size="sm" onClick={openCreate}>
              {t('products.add')}
            </Button>
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
      {deleting && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) closeDelete();
          }}
          title={t('products.delete')}
          description={t('products.deleteConfirm', { name: deleting.name })}
          actions={[
            {
              id: 'cancel',
              label: t('products.cancel'),
              variant: 'secondary',
              disabled: deletingPending,
              onClick: closeDelete,
            },
            {
              id: 'delete',
              label: t('products.delete'),
              variant: 'danger',
              loading: deletingPending,
              onClick: deleteProduct,
            },
          ]}
        />
      )}
      {editor && (
        <ProductEditor
          initial={editor}
          pending={saving}
          onClose={closeEditor}
          onSave={saveProduct}
        />
      )}
    </div>
  );
}
