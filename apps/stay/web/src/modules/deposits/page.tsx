import { type ColumnDef, DataTable, KpiCard, KpiGrid, Select } from '@itclabs/react-ui';
import { useDeposits } from '@stay/sdk/react';
import { type components, getErrorMessage } from '@stay/sdk/shared';
import { CONTRACT_STATUSES } from '@stay/shared';
import { Link, useSearchParams } from 'react-router-dom';
import { useActiveBuilding } from '@/libraries/buildings/building-provider';
import { FilterBar } from '@/libraries/filter-bar';
import { formatVnd } from '@/libraries/format';
import { Refreshing } from '@/libraries/list-table';
import { ScreenHeader } from '@/libraries/screen-header';
import { latestSearchParams } from '@/libraries/search-params';
import { PAGE_SIZE_OPTIONS, useTableParams } from '@/libraries/table-params';
import { CONTRACT_LABELS } from '@/modules/contracts/contract-ui';
import { DepositActions } from './actions';

type DepositRow = components['schemas']['DepositSummary'];

const SORT_FIELDS = ['code', 'createdAt'] as const;

const columns: ColumnDef<DepositRow, unknown>[] = [
  {
    id: 'code',
    header: 'Hợp đồng',
    accessorFn: (row) => row.code,
    cell: ({ row }) => (
      <Link
        className="whitespace-nowrap text-accent underline"
        to={`/contracts/${row.original.contractId}?tab=Cọc`}
      >
        {row.original.code}
      </Link>
    ),
  },
  { id: 'room', header: 'Phòng', enableSorting: false, accessorFn: (row) => row.roomCode },
  {
    id: 'tenant',
    header: 'Người đại diện',
    cell: ({ row }) => row.original.primaryTenantName ?? '—',
  },
  { id: 'status', header: 'Trạng thái', cell: ({ row }) => CONTRACT_LABELS[row.original.status] },
  {
    id: 'received',
    header: 'Đã thu',
    meta: { align: 'right' },
    cell: ({ row }) => (
      <span className="whitespace-nowrap">{formatVnd(row.original.received)}</span>
    ),
  },
  {
    id: 'held',
    header: 'Đang giữ',
    meta: { align: 'right' },
    cell: ({ row }) => (
      <span className="whitespace-nowrap" data-testid="deposit-held">
        {formatVnd(row.original.held)}
      </span>
    ),
  },
  {
    id: 'actions',
    header: 'Thao tác',
    cell: ({ row }) => (
      <DepositActions
        contractId={row.original.contractId}
        buildingId={row.original.buildingId}
        status={row.original.status}
      />
    ),
  },
];

/** O-15 Sổ cọc: deposits per contract; the table scrolls inside its frame on phones. */
export default function DepositsPage() {
  const { buildingId } = useActiveBuilding();
  const [params, setParams] = useSearchParams();
  const table = useTableParams({
    sortFields: SORT_FIELDS,
    defaultSort: { sortBy: 'code', sortOrder: 'asc' },
  });

  const status = CONTRACT_STATUSES.find((value) => value === params.get('status'));
  const query = useDeposits({
    buildingId: buildingId ?? undefined,
    status,
    page: table.page,
    pageSize: table.pageSize,
    sortBy: table.sortBy,
    sortOrder: table.sortOrder,
  });

  const filterStatus = (value: string | null) =>
    setParams(
      () => {
        const next = latestSearchParams();

        if (value) next.set('status', value);
        else next.delete('status');
        next.delete('page');
        return next;
      },
      { replace: true },
    );

  return (
    <div className="grid min-w-0 gap-5">
      <ScreenHeader
        title="Sổ cọc"
        description="Theo dõi tiền cọc theo hợp đồng. Sửa sai bằng bút toán mới."
      />
      <FilterBar>
        <Select
          label="Trạng thái"
          aria-label="Trạng thái hợp đồng"
          placeholder="Tất cả trạng thái"
          clearable
          options={CONTRACT_STATUSES.map((value) => ({ value, label: CONTRACT_LABELS[value] }))}
          value={status ?? null}
          onValueChange={filterStatus}
        />
      </FilterBar>
      {query.data ? (
        <KpiGrid columns={3}>
          <KpiCard
            label={`Tổng cọc đang giữ ${buildingId ? 'của toà' : 'tất cả toà'} (theo bộ lọc)`}
            value={formatVnd(query.data.meta.totalHeld)}
            icon="key"
            tone="info"
            compact
            data-testid="deposit-total"
          />
        </KpiGrid>
      ) : null}
      <Refreshing active={query.isFetching && !query.isPending}>
        <DataTable<DepositRow>
          caption="Sổ cọc"
          mode="server"
          rows={query.data?.data ?? []}
          rowCount={query.data?.meta.total ?? 0}
          preservePageHeight={(query.data?.meta.total ?? 0) > 0}
          columns={columns}
          rowId={(row) => row.contractId}
          state={table.state}
          onStateChange={table.onStateChange}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          loading={query.isPending}
          error={query.isError ? getErrorMessage(query.error, 'Không tải được sổ cọc.') : undefined}
          onRetry={() => void query.refetch()}
          emptyText="Chưa có hợp đồng phù hợp."
          data-testid="deposit-list"
        />
      </Refreshing>
    </div>
  );
}
