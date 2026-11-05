import { type DataTableState, useDebouncedCallback } from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import { type Category, type CategoryInput, DESCRIPTION_FILTER_VALUES } from '@p4/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import useCategories, { categoryErrorMessage } from './use-categories';

export default function useCategoryPage() {
  const { t } = useTranslation();

  const { query, create, update, remove } = useCategories();

  const [viewing, setViewing] = useState<string | null>(null);

  const [deleting, setDeleting] = useState<Category | null>(null);

  const [editor, setEditor] = useState<(CategoryInput & { id?: string }) | null>(null);

  const [state, setState] = useState<DataTableState>({
    sorting: [],
    pagination: { pageIndex: 0, pageSize: 10 },
    globalFilter: '',
    columnFilters: [],
  });

  const [search, setSearch] = useState('');

  const applySearch = (value: string) =>
    setState((previous) => ({
      ...previous,
      globalFilter: value,
      pagination: { ...previous.pagination, pageIndex: 0 },
    }));

  const debouncedSearch = useDebouncedCallback(applySearch, 300);

  const clearSearch = () => {
    debouncedSearch.cancel();
    setSearch('');
    applySearch('');
  };

  const resetFilters = () => {
    debouncedSearch.cancel();
    setSearch('');
    setState((previous) => ({
      ...previous,
      globalFilter: '',
      columnFilters: [],
      pagination: { ...previous.pagination, pageIndex: 0 },
    }));
  };

  const rows = query.data?.data ?? [];

  const rawDescriptionFilter = state.columnFilters?.find(
    (filter) => filter.id === 'description',
  )?.value;

  const descriptionFilter = DESCRIPTION_FILTER_VALUES.find(
    (value) => value === rawDescriptionFilter,
  );

  const hasAppliedFilters = Boolean(state.globalFilter || state.columnFilters?.length);

  const hasFilters = Boolean(search || hasAppliedFilters);

  const resetOrRefresh = () => {
    if (hasFilters) resetFilters();
    else if (!query.isFetching) void query.refetch();
  };

  const changeSearch = (value: string) => {
    setSearch(value);
    if (value.trim()) debouncedSearch(value.trim());
    else {
      debouncedSearch.cancel();
      applySearch('');
    }
  };

  const changeDescriptionFilter = (value: string | null) => {
    const filter = DESCRIPTION_FILTER_VALUES.find((option) => option === value) ?? 'all';

    setState((previous) => ({
      ...previous,
      columnFilters: filter === 'all' ? [] : [{ id: 'description', value: filter }],
      pagination: { ...previous.pagination, pageIndex: 0 },
    }));
  };

  const changeColumnVisibility = (id: string, checked: boolean) =>
    setState((previous) => ({
      ...previous,
      columnVisibility: { ...previous.columnVisibility, [id]: checked },
    }));

  const openCreate = () => setEditor({ name: '', slug: '', description: '' });

  const openDetails = (category: Category) => setViewing(category.id);

  const closeDetails = () => setViewing(null);

  const closeEditor = () => {
    if (!create.isPending && !update.isPending) setEditor(null);
  };

  const closeDelete = () => {
    if (!remove.isPending) setDeleting(null);
  };

  const saveCategory = async (body: CategoryInput) => {
    if (!editor) return;
    if (editor.id) await update.mutateAsync({ id: editor.id, body });
    else await create.mutateAsync(body);
    toast.success(t(editor.id ? 'categories.updated' : 'categories.created'));
    resetFilters();
    setEditor(null);
  };

  const deleteCategory = async () => {
    if (!deleting || remove.isPending) return;
    try {
      await remove.mutateAsync(deleting.id);
      toast.success(t('categories.deleted'));
      setDeleting(null);
    } catch (error) {
      toast.error(categoryErrorMessage(error, t('categories.deleteFailed')));
    }
  };

  return {
    rows,
    state,
    search,
    descriptionFilter,
    hasFilters,
    hasAppliedFilters,
    viewing,
    deleting,
    editor,
    loading: query.isPending || query.isFetching,
    error: query.isError
      ? categoryErrorMessage(query.error, t('categories.loadFailed'))
      : undefined,
    saving: create.isPending || update.isPending,
    deletingPending: remove.isPending,
    changeTableState: setState,
    changeSearch,
    clearSearch,
    resetOrRefresh,
    changeDescriptionFilter,
    changeColumnVisibility,
    openCreate,
    openDetails,
    closeDetails,
    openEdit: setEditor,
    closeEditor,
    openDelete: setDeleting,
    closeDelete,
    saveCategory,
    deleteCategory,
    retry: () => {
      void query.refetch();
    },
  };
}
