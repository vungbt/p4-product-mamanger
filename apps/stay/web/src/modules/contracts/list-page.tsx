import {
  Button,
  type ColumnDef,
  DataTable,
  EmptyState,
  Icon,
  Input,
  Select,
} from '@itclabs/react-ui';
import { useContracts, useRooms } from '@stay/sdk/react';
import { getErrorMessage } from '@stay/sdk/shared';
import { CONTRACT_STATUSES, type StayContract } from '@stay/shared';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCanOn } from '@/libraries/ability';
import { useActiveBuilding } from '@/libraries/buildings/building-provider';
import { FILTER_WIDE, FilterBar, FilterCheckbox } from '@/libraries/filter-bar';
import { displayDate, formatVnd } from '@/libraries/format';
import { Refreshing } from '@/libraries/list-table';
import { ScreenHeader } from '@/libraries/screen-header';
import { latestSearchParams } from '@/libraries/search-params';
import { PAGE_SIZE_OPTIONS, useTableParams } from '@/libraries/table-params';
import { CONTRACT_LABELS } from './contract-ui';

const SORT_FIELDS = ['code', 'startDate', 'endDate', 'createdAt'] as const;

export default function ContractListPage() {
  const { buildingId } = useActiveBuilding();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const canCreate = useCanOn('create', 'Contract', { buildingId: buildingId ?? undefined });
  const [search, setSearch] = useState(params.get('q') ?? '');
  const table = useTableParams({
    sortFields: SORT_FIELDS,
    defaultSort: { sortBy: 'createdAt', sortOrder: 'asc' },
  });
  const q = params.get('q') ?? '';
  const status = CONTRACT_STATUSES.find((s) => s === params.get('status'));
  const rooms = useRooms(buildingId ?? '', { pageSize: 100 });
  const query = useContracts({
    buildingId: buildingId ?? undefined,
    page: table.page,
    pageSize: table.pageSize,
    sortBy: table.sortBy,
    sortOrder: table.sortOrder,
    q: q || undefined,
    status,
    roomId: params.get('roomId') || undefined,
    expiring: params.get('expiring') === 'true' ? 'true' : undefined,
  });

  const filter = (key: string, value: string | null) =>
    setParams(
      () => {
        const next = latestSearchParams();

        if (value) next.set(key, value);
        else next.delete(key);
        next.delete('page');
        return next;
      },
      { replace: true },
    );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.trim() !== q)
        setParams(
          () => {
            const next = latestSearchParams();

            if (search.trim()) next.set('q', search.trim());
            else next.delete('q');
            next.delete('page');
            return next;
          },
          { replace: true },
        );
    }, 300);

    return () => clearTimeout(timer);
  }, [search, q, setParams]);

  const columns: ColumnDef<StayContract, unknown>[] = [
    {
      id: 'code',
      header: 'Mã HĐ',
      accessorFn: (row) => row.code,
      cell: ({ row }) => (
        <Link
          className="whitespace-nowrap font-semibold text-accent"
          to={`/contracts/${row.original.id}`}
        >
          {row.original.code}
        </Link>
      ),
    },
    { accessorKey: 'roomCode', header: 'Phòng', enableSorting: false },
    { accessorKey: 'primaryTenantName', header: 'Người đại diện', enableSorting: false },
    {
      id: 'startDate',
      header: 'Ngày bắt đầu',
      accessorFn: (row) => row.startDate,
      cell: ({ row }) => displayDate(row.original.startDate),
    },
    {
      id: 'endDate',
      header: 'Ngày kết thúc',
      accessorFn: (row) => row.endDate ?? '',
      cell: ({ row }) => (row.original.endDate ? displayDate(row.original.endDate) : '—'),
    },
    {
      id: 'rent',
      header: 'Giá thuê',
      meta: { align: 'right' },
      cell: ({ row }) => formatVnd(row.original.rent),
    },
    {
      id: 'deposit',
      header: 'Cọc đang giữ',
      meta: { align: 'right' },
      cell: ({ row }) => formatVnd(row.original.depositHeld),
    },
    {
      id: 'status',
      header: 'Trạng thái',
      cell: ({ row }) =>
        row.original.status === 'ending' && row.original.noticeDate
          ? `${CONTRACT_LABELS.ending} · trả ${displayDate(row.original.noticeDate)}`
          : CONTRACT_LABELS[row.original.status],
    },
  ];

  return (
    <div className="grid min-w-0 gap-5">
      <ScreenHeader
        title="Hợp đồng"
        description="Hợp đồng thuê của toà đang chọn: lọc theo trạng thái, phòng, sắp hết hạn."
      />
      <FilterBar
        actions={
          canCreate ? (
            <Button onClick={() => navigate('/contracts/new')}>
              <Icon name="plus" className="size-4" aria-hidden />
              Tạo hợp đồng
            </Button>
          ) : null
        }
      >
        <Input
          label="Tìm hợp đồng"
          type="search"
          placeholder="Mã hợp đồng, phòng, người đại diện"
          rootClassName={FILTER_WIDE}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          label="Trạng thái"
          value={status ?? ''}
          options={[
            { value: '', label: 'Tất cả' },
            ...CONTRACT_STATUSES.map((s) => ({ value: s, label: CONTRACT_LABELS[s] })),
          ]}
          onValueChange={(v) => filter('status', v)}
        />
        <Select
          label="Phòng"
          value={params.get('roomId') ?? ''}
          options={[
            { value: '', label: 'Tất cả' },
            ...(rooms.data?.data ?? []).map((r) => ({ value: r.id, label: r.code })),
          ]}
          onValueChange={(v) => filter('roomId', v)}
        />
        <FilterCheckbox
          label="Sắp hết hạn ≤ 30 ngày"
          checked={params.get('expiring') === 'true'}
          onCheckedChange={(v) => filter('expiring', v === true ? 'true' : null)}
        />
      </FilterBar>
      <Refreshing active={query.isFetching && !query.isPending}>
        <DataTable<StayContract>
          caption="Hợp đồng"
          mode="server"
          rows={query.data?.data ?? []}
          rowCount={query.data?.meta.total ?? 0}
          preservePageHeight={(query.data?.meta.total ?? 0) > 0}
          columns={columns}
          rowId={(row) => row.id}
          state={table.state}
          onStateChange={table.onStateChange}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          loading={!buildingId || query.isPending}
          error={
            query.isError ? getErrorMessage(query.error, 'Không tải được hợp đồng.') : undefined
          }
          onRetry={() => void query.refetch()}
          emptyState={
            <EmptyState
              size="compact"
              title="Chưa có hợp đồng"
              description="Tạo hợp đồng cho một phòng trống hoặc đổi bộ lọc."
            />
          }
          data-testid="contract-list"
        />
      </Refreshing>
    </div>
  );
}
