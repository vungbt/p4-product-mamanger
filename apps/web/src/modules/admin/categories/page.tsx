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
import {
  CloseIcon,
  DeleteIcon,
  EditIcon,
  PlusIcon,
  RefreshIcon,
  SearchIcon,
  SettingsIcon,
  ViewIcon,
} from '@itclabs/react-ui/icons/outline';
import { type Category, DESCRIPTION_FILTER_VALUES, type DescriptionFilter } from '@p4/shared';
import { useTranslation } from 'react-i18next';
import CategoryDetails from './components/category-details';
import CategoryEditor from './components/category-editor';
import useCategoryPage from './hooks/use-category-page';

const descriptionLabels: Record<DescriptionFilter, string> = {
  all: 'categories.allDescriptions',
  has: 'categories.withDescription',
  none: 'categories.withoutDescription',
};

export default function AdminCategoriesPage() {
  const {
    rows,
    state,
    search,
    descriptionFilter,
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
    changeDescriptionFilter,
    changeColumnVisibility,
    openCreate,
    openDetails,
    closeDetails,
    openEdit,
    closeEditor,
    openDelete,
    closeDelete,
    saveCategory,
    deleteCategory,
    retry,
  } = useCategoryPage();

  const { t } = useTranslation();

  const columns: ColumnDef<Category, unknown>[] = [
    { accessorKey: 'name', header: t('categories.categoryName'), enableHiding: false },
    { accessorKey: 'slug', header: t('categories.slug') },
    {
      accessorKey: 'description',
      header: t('categories.description'),
      filterFn: (row, id, value) => Boolean(row.getValue<string>(id).trim()) === (value === 'has'),
      cell: ({ row }) => (
        <span className="block max-w-sm truncate" title={row.original.description}>
          {row.original.description || t('categories.noDescription')}
        </span>
      ),
    },
    {
      id: 'actions',
      header: t('categories.actions'),
      enableSorting: false,
      enableHiding: false,
      enableGlobalFilter: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Tooltip content={t('categories.delete')}>
            <IconButton
              icon={DeleteIcon}
              variant="ghost"
              size="sm"
              className="bg-danger-50 text-danger-700 hover:bg-danger-50 hover:text-danger-800"
              label={`${t('categories.delete')}: ${row.original.name}`}
              onClick={() => openDelete(row.original)}
            />
          </Tooltip>
          <Tooltip content={t('categories.details')}>
            <IconButton
              icon={ViewIcon}
              variant="ghost"
              size="sm"
              className="bg-info-50 text-info-700 hover:bg-info-50 hover:text-info-700"
              label={`${t('categories.details')}: ${row.original.name}`}
              onClick={() => openDetails(row.original)}
            />
          </Tooltip>
          <Tooltip content={t('categories.edit')}>
            <IconButton
              icon={EditIcon}
              variant="ghost"
              size="sm"
              className="bg-warning-50 text-warning-700 hover:bg-warning-50 hover:text-warning-700"
              label={`${t('categories.edit')}: ${row.original.name}`}
              onClick={() => openEdit(row.original)}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="grid gap-4">
      <p className="text-ui-sm text-muted">{t('categories.intro')}</p>
      <div className="overflow-hidden rounded-panel border border-line bg-surface shadow-panel">
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-3">
          <Input
            aria-label={t('categories.search')}
            placeholder={t('categories.search')}
            icon={SearchIcon}
            size="sm"
            rootClassName="w-full sm:w-72"
            value={search}
            onChange={(event) => changeSearch(event.target.value)}
            endAddon={
              search ? (
                <Tooltip content={t('categories.clearSearch')}>
                  <IconButton
                    icon={CloseIcon}
                    variant="ghost"
                    size="sm"
                    label={t('categories.clearSearch')}
                    className="size-5 rounded p-0.5 text-muted hover:bg-hover-strong hover:text-ink [&_svg]:stroke-[1.5]"
                    iconClassName="size-4"
                    onClick={clearSearch}
                  />
                </Tooltip>
              ) : undefined
            }
          />
          <Select
            aria-label={t('categories.descriptionFilter')}
            classNames={{
              control: 'text-ui-sm',
              menu: 'text-ui-sm',
              clearIndicator: '[&_svg]:stroke-[1.5]',
            }}
            rootClassName="w-full sm:w-48"
            size="sm"
            searchable={false}
            clearable
            placeholder={t('categories.allDescriptions')}
            value={descriptionFilter ?? null}
            options={DESCRIPTION_FILTER_VALUES.filter((value) => value !== 'all').map((value) => ({
              value,
              label: t(descriptionLabels[value]),
            }))}
            onValueChange={changeDescriptionFilter}
          />
          <Tooltip content={t(hasFilters ? 'categories.clearFilters' : 'categories.refresh')}>
            <IconButton
              icon={RefreshIcon}
              variant="secondary"
              size="sm"
              label={t(hasFilters ? 'categories.clearFilters' : 'categories.refresh')}
              loading={loading && !hasFilters}
              onClick={resetOrRefresh}
            />
          </Tooltip>
          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu
              trigger={
                <Button variant="secondary" size="sm">
                  <Icon glyph={SettingsIcon} />
                  {t('categories.columns')}
                </Button>
              }
              items={['slug', 'description'].map((id) => ({
                id,
                type: 'checkbox' as const,
                label: t(id === 'slug' ? 'categories.slug' : 'categories.description'),
                checked: state.columnVisibility?.[id] !== false,
                closeOnSelect: false,
                onCheckedChange: (checked) => changeColumnVisibility(id, checked),
              }))}
            />
            <Button size="sm" onClick={openCreate}>
              <Icon glyph={PlusIcon} />
              {t('categories.add')}
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
          rows={rows}
          loading={loading}
          error={error}
          onRetry={retry}
          emptyText={hasAppliedFilters ? t('categories.noMatches') : t('categories.empty')}
          columns={columns}
          rowId={(row) => row.id}
          caption={t('menu.product-categories')}
          state={state}
          onStateChange={changeTableState}
          pagination
          pageSizeOptions={[10, 20, 50]}
        />
      </div>
      {viewing && <CategoryDetails id={viewing} onClose={closeDetails} />}
      {deleting && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) closeDelete();
          }}
          title={t('categories.delete')}
          description={t('categories.deleteConfirm', { name: deleting.name })}
          actions={[
            {
              id: 'cancel',
              label: t('categories.cancel'),
              variant: 'secondary',
              disabled: deletingPending,
              onClick: closeDelete,
            },
            {
              id: 'delete',
              label: t('categories.delete'),
              variant: 'danger',
              loading: deletingPending,
              onClick: deleteCategory,
            },
          ]}
        />
      )}
      {editor && (
        <CategoryEditor
          initial={editor}
          pending={saving}
          onClose={closeEditor}
          onSave={saveCategory}
        />
      )}
    </div>
  );
}
