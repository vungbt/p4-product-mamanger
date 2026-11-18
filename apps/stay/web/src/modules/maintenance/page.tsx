import {
  Button,
  type ColumnDef,
  DataTablePagination,
  EmptyState,
  Icon,
  IconButton,
  Input,
  Select,
  useDataTable,
} from '@itclabs/react-ui';
import { useMaintenance, useRooms } from '@stay/sdk/react';
import { getErrorMessage } from '@stay/sdk/shared';
import { MAINTENANCE_SOURCES, MAINTENANCE_STATUSES, type StayMaintenance } from '@stay/shared';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCanOn } from '@/libraries/ability';
import { useActiveBuilding } from '@/libraries/buildings/building-provider';
import { FilterBar } from '@/libraries/filter-bar';
import { displayDate, formatVnd } from '@/libraries/format';
import { LoadError, LoadingRows } from '@/libraries/forms/page-states';
import { ListTable, Refreshing, rowTestId } from '@/libraries/list-table';
import { ScreenHeader } from '@/libraries/screen-header';
import { latestSearchParams } from '@/libraries/search-params';
import { PAGE_SIZE_OPTIONS, useTableParams } from '@/libraries/table-params';

const SORT_FIELDS = ['createdAt'] as const;
const TABLE_ID = 'maintenance-list';

export default function MaintenancePage() {
  const { t } = useTranslation('maintenance');
  const { buildingId } = useActiveBuilding();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const table = useTableParams({
    sortFields: SORT_FIELDS,
    defaultSort: { sortBy: 'createdAt', sortOrder: 'desc' },
  });
  const canCreate = useCanOn('create', 'Maintenance', { buildingId: buildingId ?? undefined });
  const rooms = useRooms(buildingId ?? '', { pageSize: 100 });

  const status = MAINTENANCE_STATUSES.find((value) => value === params.get('status'));
  const source = MAINTENANCE_SOURCES.find((value) => value === params.get('source'));
  const query = useMaintenance({
    buildingId: buildingId ?? undefined,
    roomId: params.get('roomId') || undefined,
    status,
    source,
    q: params.get('q') || undefined,
    page: table.page,
    pageSize: table.pageSize,
    sortBy: table.sortBy,
    sortOrder: table.sortOrder,
  });

  const filter = (name: string, value: string) =>
    setParams(
      () => {
        const next = latestSearchParams();

        if (value) next.set(name, value);
        else next.delete(name);
        next.delete('page');
        return next;
      },
      { replace: true },
    );

  const view = (row: StayMaintenance) => (
    <IconButton
      icon="view"
      label={t('view')}
      variant="ghost"
      onClick={() => navigate(`/maintenance/${row.id}`)}
    />
  );
  const columns: ColumnDef<StayMaintenance, unknown>[] = [
    {
      id: 'title',
      header: t('jobTitle'),
      cell: ({ row }) => (
        <Link className="text-accent underline" to={`/maintenance/${row.original.id}`}>
          {row.original.title}
        </Link>
      ),
    },
    { id: 'room', header: t('room'), cell: ({ row }) => row.original.roomCode ?? '—' },
    { id: 'status', header: t('status'), cell: ({ row }) => t(`statuses.${row.original.status}`) },
    { id: 'source', header: t('source'), cell: ({ row }) => t(`sources.${row.original.source}`) },
    {
      id: 'createdAt',
      header: t('createdAt'),
      accessorFn: (row) => row.createdAt,
      cell: ({ row }) => displayDate(row.original.createdAt.slice(0, 10)),
    },
    {
      id: 'expense',
      header: t('expense'),
      cell: ({ row }) => (row.original.expense ? formatVnd(row.original.expense.amount) : '—'),
    },
    { id: 'actions', header: '', cell: ({ row }) => view(row.original) },
  ];
  const controller = useDataTable<StayMaintenance>({
    caption: t('title'),
    mode: 'server',
    rows: query.data?.data ?? [],
    rowCount: query.data?.meta.total ?? 0,
    columns,
    rowId: (row) => row.id,
    state: table.state,
    onStateChange: table.onStateChange,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    loading: query.isPending,
    error: query.isError ? getErrorMessage(query.error, t('error')) : undefined,
    onRetry: () => void query.refetch(),
    emptyState: <EmptyState title={t('empty')} />,
    'data-testid': TABLE_ID,
  });

  const cards = (rows: readonly StayMaintenance[]) => (
    <ul className="grid gap-3">
      {rows.map((row) => (
        <li
          key={row.id}
          data-testid={rowTestId(TABLE_ID, row.id)}
          className="flex items-start justify-between gap-3 rounded-panel border border-line bg-surface p-4"
        >
          <div className="grid min-w-0 gap-1 break-words">
            <Link className="font-semibold text-accent underline" to={`/maintenance/${row.id}`}>
              {row.title}
            </Link>
            <p>
              {row.roomCode} · {t(`sources.${row.source}`)}
            </p>
            <p>
              {t(`statuses.${row.status}`)} · {displayDate(row.createdAt.slice(0, 10))}
            </p>
            <p>{row.expense ? formatVnd(row.expense.amount) : '—'}</p>
          </div>
          {view(row)}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="grid min-w-0 gap-5">
      <ScreenHeader title={t('title')} description={t('description')} />
      {!buildingId ? (
        <p>{t('chooseBuilding')}</p>
      ) : (
        <>
          <FilterBar
            actions={
              canCreate ? (
                <Button onClick={() => navigate('/maintenance/new')}>
                  <Icon name="plus" aria-hidden />
                  {t('create')}
                </Button>
              ) : undefined
            }
          >
            <Select
              label={t('room')}
              clearable
              options={rooms.data?.data.map((room) => ({ value: room.id, label: room.code })) ?? []}
              value={params.get('roomId')}
              onValueChange={(value) => filter('roomId', value ?? '')}
            />
            <Select
              label={t('status')}
              clearable
              options={MAINTENANCE_STATUSES.map((value) => ({
                value,
                label: t(`statuses.${value}`),
              }))}
              value={status ?? null}
              onValueChange={(value) => filter('status', value ?? '')}
            />
            <Select
              label={t('source')}
              clearable
              options={MAINTENANCE_SOURCES.map((value) => ({
                value,
                label: t(`sources.${value}`),
              }))}
              value={source ?? null}
              onValueChange={(value) => filter('source', value ?? '')}
            />
            <Input
              label={t('search')}
              type="search"
              value={params.get('q') ?? ''}
              onChange={(event) => filter('q', event.target.value)}
            />
            <Select
              label={t('view')}
              options={[
                { value: 'board', label: t('board') },
                { value: 'list', label: t('list') },
              ]}
              value={params.get('view') ?? 'board'}
              onValueChange={(value) => filter('view', value ?? 'board')}
            />
          </FilterBar>
          {rooms.isError ? (
            <LoadError error={rooms.error} onRetry={() => void rooms.refetch()} />
          ) : null}
          {params.get('view') === 'list' ? (
            <ListTable
              controller={controller}
              cards={cards}
              refreshing={query.isFetching && !query.isPending}
            />
          ) : (
            <Refreshing active={query.isFetching && !query.isPending}>
              {query.isError ? (
                <LoadError error={query.error} onRetry={() => void query.refetch()} />
              ) : null}
              {query.isPending ? (
                <LoadingRows />
              ) : query.data?.data.length ? (
                <section
                  className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-4"
                  aria-label={t('board')}
                >
                  {(['open', 'in_progress', 'done', 'cancelled'] as const).map((column) => {
                    const rows = query.data.data.filter((row) =>
                      column === 'open'
                        ? ['new', 'open'].includes(row.status)
                        : column === 'cancelled'
                          ? ['cancelled', 'rejected'].includes(row.status)
                          : row.status === column,
                    );

                    return (
                      <section key={column} className="grid min-w-0 content-start gap-3">
                        <h2 className="font-semibold">{t(`statuses.${column}`)}</h2>
                        {cards(rows)}
                      </section>
                    );
                  })}
                </section>
              ) : (
                <EmptyState title={t('empty')} />
              )}
              {query.data && query.data.meta.total > 0 ? (
                <DataTablePagination controller={controller} />
              ) : null}
            </Refreshing>
          )}
        </>
      )}
    </div>
  );
}
