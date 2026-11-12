import {
  Button,
  type ColumnDef,
  cn,
  EmptyState,
  Input,
  KpiCard,
  KpiGrid,
  Select,
  useDataTable,
} from '@itclabs/react-ui';
import { useReceivables } from '@stay/sdk/react';
import { getErrorMessage } from '@stay/sdk/shared';
import {
  type InvoiceShareLink,
  RECEIVABLE_BUCKETS,
  RECEIVABLE_SORT_FIELDS,
  type ReceivableInvoice,
  type ReceivableSortField,
  type StayReceivable,
} from '@stay/shared';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCanOn } from '@/libraries/ability';
import { useActiveBuilding } from '@/libraries/buildings/building-provider';
import { FILTER_WIDE, FilterBar } from '@/libraries/filter-bar';
import { displayDate, formatVnd } from '@/libraries/format';
import { ListTable, rowTestId } from '@/libraries/list-table';
import { ScreenHeader } from '@/libraries/screen-header';
import { latestSearchParams } from '@/libraries/search-params';
import { PAGE_SIZE_OPTIONS, type SortOrder, useTableParams } from '@/libraries/table-params';
import { ShareInvoiceDialog } from '../invoices/share/share-dialog';
import { InvoicesPaymentDialog } from '../payments/payment-dialog';
import {
  BUCKET_LABELS,
  OverdueTag,
  ReceivableActions,
  ReceivableInvoices,
  type RowActions,
} from './receivable-ui';

const TABLE_ID = 'receivable-list';

/** Natural order of each sort field: room codes A→Z, amounts and days largest first. */
const SORT_ORDER: Record<ReceivableSortField, SortOrder> = {
  remaining: 'desc',
  overdueDays: 'desc',
  roomCode: 'asc',
};

const SORT_OPTIONS: { value: ReceivableSortField; label: string }[] = [
  { value: 'remaining', label: 'Còn nợ nhiều nhất' },
  { value: 'overdueDays', label: 'Quá hạn lâu nhất' },
  { value: 'roomCode', label: 'Mã phòng' },
];

type Collecting = { contractId: string; invoiceId?: string };
type Sharing = { contractId: string; invoiceId: string };

/** O-25 Công nợ: who owes, how much and how long overdue, grouped by contract. */
export default function ReceivablesPage() {
  const { buildingId } = useActiveBuilding();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('q') ?? '');
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const [collecting, setCollecting] = useState<Collecting | null>(null);
  const [sharing, setSharing] = useState<Sharing | null>(null);
  const [links, setLinks] = useState<Record<string, InvoiceShareLink | null>>({});
  const scope = { buildingId: buildingId ?? undefined };
  const canPay = useCanOn('create', 'Payment', scope);
  const canShare = useCanOn('update', 'Invoice', scope);
  const table = useTableParams({
    sortFields: RECEIVABLE_SORT_FIELDS,
    defaultSort: { sortBy: 'remaining', sortOrder: 'desc' },
  });

  const q = params.get('q') ?? '';
  const bucket = RECEIVABLE_BUCKETS.find((value) => value === params.get('bucket'));

  const query = useReceivables(buildingId ?? '', {
    bucket,
    q: q || undefined,
    page: table.page,
    pageSize: table.pageSize,
    sortBy: table.sortBy,
    sortOrder: table.sortOrder,
  });

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

  const rows: StayReceivable[] = query.data?.data ?? [];
  const meta = query.data?.meta;
  const allCount = meta?.buckets.reduce((sum, row) => sum + row.count, 0) ?? 0;
  const collectingRow = rows.find((row) => row.contractId === collecting?.contractId);
  const sharingRow = rows.find((row) => row.contractId === sharing?.contractId);
  const sharingInvoice = sharingRow?.invoices.find((invoice) => invoice.id === sharing?.invoiceId);

  const toggle = (contractId: string) =>
    setExpanded((current) => {
      const next = new Set(current);

      if (next.has(contractId)) next.delete(contractId);
      else next.add(contractId);
      return next;
    });

  const actions: RowActions = {
    onCollect: canPay
      ? (row, invoiceId) => setCollecting({ contractId: row.contractId, invoiceId })
      : undefined,
    onShare: canShare
      ? (row, invoice: ReceivableInvoice) =>
          setSharing({ contractId: row.contractId, invoiceId: invoice.id })
      : undefined,
  };

  const filtered = Boolean(bucket || q);

  const controller = useDataTable<StayReceivable>({
    caption: 'Công nợ',
    mode: 'server',
    rows,
    rowCount: meta?.total ?? 0,
    // Keep the page height only once rows exist (not the first load's skeleton).
    preservePageHeight: (meta?.total ?? 0) > 0,
    columns: receivableColumns({ expanded, onToggle: toggle, actions }),
    rowId: (row) => row.contractId,
    state: table.state,
    onStateChange: table.onStateChange,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    loading: query.isPending,
    error: query.isError ? getErrorMessage(query.error, 'Không tải được công nợ.') : undefined,
    onRetry: () => void query.refetch(),
    emptyState: (
      <EmptyState
        size="compact"
        title={filtered ? 'Không có công nợ phù hợp' : 'Không có công nợ'}
        description={
          filtered
            ? 'Đổi nhóm hoặc từ khoá tìm kiếm.'
            : 'Mọi hoá đơn đã phát hành của toà đều đã thu đủ.'
        }
        variant={filtered ? 'no-results' : 'empty'}
      />
    ),
    'data-testid': TABLE_ID,
  });

  return (
    <div className="grid min-w-0 gap-5">
      <ScreenHeader
        title="Công nợ"
        description="Hợp đồng còn hoá đơn chưa thu đủ của toà đang chọn: còn bao nhiêu, quá hạn bao lâu."
      />
      {!buildingId ? (
        <p>Chọn toà nhà để xem công nợ.</p>
      ) : (
        <>
          {meta ? (
            <KpiGrid columns={2} aria-label="Tổng công nợ">
              <KpiCard
                label={`Tổng công nợ${bucket || q ? ' (theo bộ lọc)' : ''}`}
                value={
                  <span data-testid="receivables-total">{formatVnd(meta.totalRemaining)}</span>
                }
                hint={`${meta.invoiceCount} hoá đơn chưa thu đủ`}
                icon="walletMoney"
                tone={meta.totalRemaining > 0 ? 'warning' : 'success'}
                compact
              />
              <KpiCard
                label="Đã quá hạn"
                value={
                  <span data-testid="receivables-overdue">{formatVnd(meta.overdueRemaining)}</span>
                }
                icon="moneyTime"
                tone={meta.overdueRemaining > 0 ? 'danger' : 'success'}
                compact
              />
            </KpiGrid>
          ) : null}

          <fieldset className="m-0 flex min-w-0 flex-wrap gap-2 border-0 p-0">
            <legend className="sr-only">Nhóm quá hạn</legend>
            <Button
              size="sm"
              variant={bucket ? 'secondary' : 'primary'}
              aria-pressed={!bucket}
              onClick={() => filter('bucket', null)}
            >
              Tất cả ({allCount})
            </Button>
            {RECEIVABLE_BUCKETS.map((value) => (
              <Button
                key={value}
                size="sm"
                variant={bucket === value ? 'primary' : 'secondary'}
                aria-pressed={bucket === value}
                data-testid={`bucket-${value}`}
                onClick={() => filter('bucket', bucket === value ? null : value)}
              >
                {BUCKET_LABELS[value]} (
                {meta?.buckets.find((row) => row.bucket === value)?.count ?? 0})
              </Button>
            ))}
          </fieldset>

          <FilterBar>
            <Input
              label="Tìm"
              type="search"
              rootClassName={FILTER_WIDE}
              placeholder="Phòng, mã hợp đồng, tên hoặc SĐT"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Select
              label="Sắp xếp"
              value={table.sortBy}
              options={SORT_OPTIONS}
              onValueChange={(value) => {
                const field = RECEIVABLE_SORT_FIELDS.find((option) => option === value);

                if (field) table.setSort({ sortBy: field, sortOrder: SORT_ORDER[field] });
              }}
            />
          </FilterBar>

          <ListTable
            controller={controller}
            refreshing={query.isFetching && !query.isPending}
            cards={(items) => (
              <ReceivableCards
                rows={items}
                expanded={expanded}
                onToggle={toggle}
                actions={actions}
              />
            )}
          />
        </>
      )}
      {collectingRow ? (
        <InvoicesPaymentDialog
          title={`Thu tiền phòng ${collectingRow.roomCode}`}
          invoices={collectingRow.invoices.map((invoice) => ({
            ...invoice,
            roomCode: collectingRow.roomCode,
          }))}
          invoiceId={collecting?.invoiceId}
          onClose={() => setCollecting(null)}
        />
      ) : null}
      {sharingRow && sharingInvoice ? (
        <ShareInvoiceDialog
          invoice={{ ...sharingInvoice, roomCode: sharingRow.roomCode }}
          link={links[sharingInvoice.id] ?? null}
          onLinkChange={(link) =>
            setLinks((current) => ({ ...current, [sharingInvoice.id]: link }))
          }
          onClose={() => setSharing(null)}
        />
      ) : null}
    </div>
  );
}

type ListProps = {
  rows: readonly StayReceivable[];
  expanded: ReadonlySet<string>;
  onToggle: (contractId: string) => void;
  actions: RowActions;
};

/** "2 kỳ" disclosure: shows the row's invoices. */
function PeriodsToggle({
  row,
  open,
  onToggle,
}: {
  row: StayReceivable;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <Button
      size="sm"
      variant="ghost"
      aria-expanded={open}
      aria-controls={`receivable-${row.contractId}`}
      aria-label={`${row.invoiceCount} kỳ nợ phòng ${row.roomCode}, ${open ? 'ẩn' : 'xem'} hoá đơn`}
      onClick={onToggle}
    >
      {row.invoiceCount} kỳ {open ? '▴' : '▾'}
    </Button>
  );
}

function Representative({ row }: { row: StayReceivable }) {
  return (
    <span className="grid min-w-0">
      <span className="truncate">{row.representativeName ?? '—'}</span>
      <span className="truncate text-ui-sm text-muted">HĐ {row.contractCode}</span>
    </span>
  );
}

/**
 * DataTable has no expandable rows: the "N kỳ" toggle opens the invoice list inside its own
 * cell, so the row keeps its invoices (and their actions) together.
 */
function receivableColumns({
  expanded,
  onToggle,
  actions,
}: Omit<ListProps, 'rows'>): ColumnDef<StayReceivable, unknown>[] {
  return [
    {
      id: 'roomCode',
      header: 'Phòng',
      accessorFn: (row) => row.roomCode,
      cell: ({ row }) => (
        <span className="whitespace-nowrap font-semibold">{row.original.roomCode}</span>
      ),
    },
    {
      id: 'representative',
      header: 'Người đại diện',
      cell: ({ row }) => (
        <span className="grid max-w-56">
          <Representative row={row.original} />
        </span>
      ),
    },
    {
      id: 'periods',
      header: 'Số kỳ nợ',
      cell: ({ row }) => {
        const open = expanded.has(row.original.contractId);

        return (
          <div className={cn('grid gap-2', open && 'min-w-80')}>
            <span>
              <PeriodsToggle
                row={row.original}
                open={open}
                onToggle={() => onToggle(row.original.contractId)}
              />
            </span>
            {open ? (
              <div id={`receivable-${row.original.contractId}`}>
                <ReceivableInvoices row={row.original} {...actions} />
              </div>
            ) : null}
          </div>
        );
      },
    },
    {
      id: 'remaining',
      header: 'Còn lại',
      meta: { align: 'right' },
      accessorFn: (row) => row.remaining,
      cell: ({ row }) => (
        <span
          className={cn(
            'whitespace-nowrap font-semibold',
            row.original.overdueDays > 0 && 'text-danger-700',
          )}
          data-testid="receivable-remaining"
        >
          {formatVnd(row.original.remaining)}
        </span>
      ),
    },
    {
      id: 'overdueDays',
      header: 'Quá hạn',
      accessorFn: (row) => row.overdueDays,
      cell: ({ row }) => (
        <span className="whitespace-nowrap">
          <OverdueTag row={row.original} />
        </span>
      ),
    },
    {
      id: 'oldestDueOn',
      header: 'Hạn cũ nhất',
      cell: ({ row }) => (
        <span className="whitespace-nowrap">{displayDate(row.original.oldestDueOn)}</span>
      ),
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Thao tác</span>,
      cell: ({ row }) => <ReceivableActions row={row.original} {...actions} />,
    },
  ];
}

function ReceivableCards({ rows, expanded, onToggle, actions }: ListProps) {
  return (
    <ul className="grid gap-3" aria-label="Công nợ">
      {rows.map((row) => {
        const open = expanded.has(row.contractId);

        return (
          <li
            key={row.contractId}
            className={cn(
              'grid min-w-0 gap-2 rounded-panel border bg-surface p-4',
              row.bucket === 'over_30' ? 'border-danger-700' : 'border-line',
            )}
            data-testid={rowTestId(TABLE_ID, row.contractId)}
            data-room={row.roomCode}
            data-bucket={row.bucket}
          >
            <div className="flex min-w-0 items-start justify-between gap-2">
              <div className="grid min-w-0 gap-0.5">
                <span className="font-semibold">Phòng {row.roomCode}</span>
                <Representative row={row} />
              </div>
              <ReceivableActions row={row} {...actions} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <OverdueTag row={row} />
              <span
                className={cn('font-bold', row.overdueDays > 0 && 'text-danger-700')}
                data-testid="receivable-remaining"
              >
                {formatVnd(row.remaining)}
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-ui-sm text-muted">
              <span>Hạn cũ nhất {displayDate(row.oldestDueOn)}</span>
              <PeriodsToggle row={row} open={open} onToggle={() => onToggle(row.contractId)} />
            </div>
            {open ? (
              <div id={`receivable-${row.contractId}`}>
                <ReceivableInvoices row={row} {...actions} />
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
