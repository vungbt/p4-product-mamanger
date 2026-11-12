import { Button, type ColumnDef, EmptyState, Input, Select, useDataTable } from '@itclabs/react-ui';
import { useRequestInbox } from '@stay/sdk/react';
import { getErrorMessage } from '@stay/sdk/shared';
import { INBOX_KINDS, INBOX_STATUSES, type InboxItem } from '@stay/shared';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useActiveBuilding } from '@/libraries/buildings/building-provider';
import { FILTER_WIDE, FilterBar } from '@/libraries/filter-bar';
import { ListTable } from '@/libraries/list-table';
import { ScreenHeader } from '@/libraries/screen-header';
import { latestSearchParams } from '@/libraries/search-params';
import { PAGE_SIZE_OPTIONS, useTableParams } from '@/libraries/table-params';
import { RequestDetailDialog } from './request-detail';
import { RequestList } from './request-list';
import {
  displayDateTime,
  INBOX_STATUS_LABELS,
  InboxStatusTag,
  itemSummary,
  itemTypeLabel,
  KIND_LABELS,
} from './request-ui';

const SORT_FIELDS = ['createdAt'] as const;
const ALL = 'all';

const KIND_OPTIONS = [
  { value: ALL, label: 'Tất cả' },
  ...INBOX_KINDS.map((kind) => ({ value: kind, label: KIND_LABELS[kind] })),
];

/** O-26 Yêu cầu từ người thuê: báo hỏng, yêu cầu và báo chuyển khoản of the active building. */
export default function RequestsPage() {
  const { buildingId } = useActiveBuilding();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('q') ?? '');
  const [selected, setSelected] = useState<InboxItem | null>(null);
  const table = useTableParams({
    sortFields: SORT_FIELDS,
    defaultSort: { sortBy: 'createdAt', sortOrder: 'desc' },
  });

  const q = params.get('q') ?? '';
  const kind = INBOX_KINDS.find((value) => value === params.get('kind'));
  const statusParam = params.get('status');
  // Default chip: "Mới"; `status=all` shows every status.
  const status =
    statusParam === ALL
      ? undefined
      : (INBOX_STATUSES.find((value) => value === statusParam) ?? 'pending');

  const query = useRequestInbox(
    {
      buildingId: buildingId ?? undefined,
      kind,
      status,
      q: q || undefined,
      page: table.page,
      pageSize: table.pageSize,
      sortBy: table.sortBy,
      sortOrder: table.sortOrder,
    },
    { enabled: Boolean(buildingId) },
  );

  const filter = (field: string, value: string | null) =>
    setParams(
      () => {
        const next = latestSearchParams();

        if (value) next.set(field, value);
        else next.delete(field);
        next.delete('page');
        return next;
      },
      { replace: true },
    );

  useEffect(() => {
    if (search.trim() === q) return;
    const timer = setTimeout(
      () =>
        setParams(
          () => {
            const next = latestSearchParams();

            if (search.trim()) next.set('q', search.trim());
            else next.delete('q');
            next.delete('page');
            return next;
          },
          { replace: true },
        ),
      300,
    );

    return () => clearTimeout(timer);
  }, [search, q, setParams]);

  const rows = query.data?.data ?? [];
  const meta = query.data?.meta;
  const counts = meta?.counts ?? [];
  const countOf = (value: string) => counts.find((row) => row.status === value)?.count ?? 0;
  const allCount = counts.reduce((sum, row) => sum + row.count, 0);
  const filtered = Boolean(q || kind);

  const controller = useDataTable<InboxItem>({
    caption: 'Yêu cầu từ người thuê',
    mode: 'server',
    rows,
    rowCount: meta?.total ?? 0,
    // Keep the page height only once rows exist (not the first load's skeleton).
    preservePageHeight: (meta?.total ?? 0) > 0,
    columns: requestColumns(setSelected),
    rowId: (row) => `${row.kind}-${row.id}`,
    state: table.state,
    onStateChange: table.onStateChange,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    loading: query.isPending,
    error: query.isError ? getErrorMessage(query.error, 'Không tải được yêu cầu.') : undefined,
    onRetry: () => void query.refetch(),
    emptyState: (
      <EmptyState
        size="compact"
        title={filtered ? 'Không có yêu cầu phù hợp' : 'Không có yêu cầu'}
        description={
          filtered
            ? 'Đổi loại, trạng thái hoặc từ khoá tìm kiếm.'
            : 'Người thuê chưa gửi yêu cầu nào ở trạng thái này.'
        }
        variant={filtered ? 'no-results' : 'empty'}
      />
    ),
    'data-testid': 'request-table',
  });

  return (
    <div className="grid min-w-0 gap-5">
      <ScreenHeader
        title="Yêu cầu từ người thuê"
        description="Báo hỏng, yêu cầu thay đổi hợp đồng và báo chuyển khoản gửi từ cổng người thuê."
      />
      {!buildingId ? (
        <p>Chọn toà nhà để xem yêu cầu.</p>
      ) : (
        <>
          <fieldset className="m-0 flex min-w-0 flex-wrap gap-2 border-0 p-0">
            <legend className="sr-only">Trạng thái</legend>
            {INBOX_STATUSES.map((value) => (
              <Button
                key={value}
                size="sm"
                variant={status === value ? 'primary' : 'secondary'}
                aria-pressed={status === value}
                data-testid={`status-${value}`}
                onClick={() => filter('status', value === 'pending' ? null : value)}
              >
                {INBOX_STATUS_LABELS[value]} {countOf(value)}
              </Button>
            ))}
            <Button
              size="sm"
              variant={status ? 'secondary' : 'primary'}
              aria-pressed={!status}
              data-testid="status-all"
              onClick={() => filter('status', ALL)}
            >
              Tất cả {allCount}
            </Button>
          </fieldset>

          <FilterBar>
            <Input
              label="Tìm kiếm"
              type="search"
              rootClassName={FILTER_WIDE}
              placeholder="Phòng, hợp đồng, người gửi, tiêu đề, mã hoá đơn"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Select
              label="Loại"
              value={kind ?? ALL}
              options={KIND_OPTIONS}
              onValueChange={(value) => filter('kind', value === ALL ? null : value)}
            />
          </FilterBar>

          <ListTable
            controller={controller}
            refreshing={query.isFetching && !query.isPending}
            cards={(items) => <RequestList items={items} onOpen={setSelected} />}
          />
        </>
      )}
      {selected ? <RequestDetailDialog item={selected} onClose={() => setSelected(null)} /> : null}
    </div>
  );
}

/** Desktop rows; the summary button (`request-row-<id>`) opens the detail like a phone card. */
function requestColumns(onOpen: (item: InboxItem) => void): ColumnDef<InboxItem, unknown>[] {
  return [
    {
      id: 'summary',
      header: 'Nội dung',
      cell: ({ row }) => (
        <button
          type="button"
          className="grid max-w-96 rounded-control text-left font-semibold text-accent hover:underline focus-visible:outline-2 focus-visible:outline-accent"
          data-testid={`request-row-${row.original.id}`}
          onClick={() => onOpen(row.original)}
        >
          <span className="break-words">
            {itemSummary(row.original) || itemTypeLabel(row.original)}
          </span>
        </button>
      ),
    },
    { id: 'type', header: 'Loại', cell: ({ row }) => itemTypeLabel(row.original) },
    {
      id: 'room',
      header: 'Phòng',
      cell: ({ row }) => <span className="whitespace-nowrap">{row.original.roomCode ?? '—'}</span>,
    },
    { id: 'tenant', header: 'Người gửi', cell: ({ row }) => row.original.tenantName ?? '—' },
    {
      id: 'createdAt',
      header: 'Ngày gửi',
      accessorFn: (row) => row.createdAt,
      cell: ({ row }) => (
        <span className="whitespace-nowrap">{displayDateTime(row.original.createdAt)}</span>
      ),
    },
    {
      id: 'status',
      header: 'Trạng thái',
      cell: ({ row }) => <InboxStatusTag status={row.original.status} />,
    },
  ];
}
