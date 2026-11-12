import {
  Button,
  type ColumnDef,
  cn,
  EmptyState,
  Icon,
  IconButton,
  Input,
  Select,
  Tabs,
  TabsList,
  TabsTrigger,
  useDataTable,
} from '@itclabs/react-ui';
import { invoiceQueryOptions, useRooms, useStaySdk } from '@stay/sdk/react';
import { getErrorMessage } from '@stay/sdk/shared';
import { INVOICE_KINDS, INVOICE_STATUSES, isPeriod, type StayInvoiceSummary } from '@stay/shared';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCanOn } from '@/libraries/ability';
import { useActiveBuilding } from '@/libraries/buildings/building-provider';
import { FILTER_ROW_FIELD, FILTER_ROW_GROW, FilterBar } from '@/libraries/filter-bar';
import { displayDate, formatVnd, todayIsoDate } from '@/libraries/format';
import { PeriodPicker } from '@/libraries/forms/period-picker';
import { ListTable, rowTestId } from '@/libraries/list-table';
import { ScreenHeader } from '@/libraries/screen-header';
import { latestSearchParams } from '@/libraries/search-params';
import { PAGE_SIZE_OPTIONS, useTableParams } from '@/libraries/table-params';
import { PaymentDialog } from '../payments/payment-dialog';
import { isCollectable } from '../payments/payment-ui';
import { useCurrentBillingPeriod } from './current-period';
import {
  billingRunPath,
  displayExpiry,
  displayPeriod,
  INVOICE_KIND_LABELS,
  INVOICE_STATUS_LABELS,
  InvoiceStatusTag,
  invoicePath,
  periodSharePath,
} from './invoice-ui';
import { InvoicePreviewButton } from './share/invoice-preview';

const TABLE_ID = 'invoice-list';
/** `sortBy` values of `GET /api/invoices` with a column here (createdAt is the default). */
const SORT_FIELDS = ['code', 'period', 'total', 'dueOn', 'createdAt'] as const;
/** Status tabs above the filters, in the order an owner follows an invoice. */
const STATUS_TABS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'draft', label: INVOICE_STATUS_LABELS.draft },
  { value: 'issued', label: INVOICE_STATUS_LABELS.issued },
  { value: 'partially_paid', label: INVOICE_STATUS_LABELS.partially_paid },
  { value: 'paid', label: INVOICE_STATUS_LABELS.paid },
  { value: 'overdue', label: 'Quá hạn' },
  { value: 'void', label: INVOICE_STATUS_LABELS.void },
] as const;
/** `?period=all`: every period, chosen by clearing the picker (no `period` means the current one). */
const ALL_PERIODS = 'all';

/** O-21 Danh sách hoá đơn: filters, paging and sort on the URL; cards on phones. */
export default function InvoiceListPage() {
  const { buildingId } = useActiveBuilding();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('q') ?? '');
  const [roomSearch, setRoomSearch] = useState('');
  const navigate = useNavigate();
  const canCreate = useCanOn('create', 'Invoice', { buildingId: buildingId ?? undefined });
  const canPay = useCanOn('create', 'Payment', { buildingId: buildingId ?? undefined });
  const canShare = useCanOn('update', 'Invoice', { buildingId: buildingId ?? undefined });
  const [collecting, setCollecting] = useState<StayInvoiceSummary | null>(null);
  const table = useTableParams({
    sortFields: SORT_FIELDS,
    defaultSort: { sortBy: 'createdAt', sortOrder: 'desc' },
  });

  const q = params.get('q') ?? '';
  const periodParam = params.get('period');
  const currentPeriod = useCurrentBillingPeriod(buildingId);
  // No `period` on the URL: the current billing period (as the overview); `all`: every period.
  const period = isPeriod(periodParam)
    ? periodParam
    : periodParam === ALL_PERIODS
      ? ''
      : (currentPeriod ?? '');
  const periodReady = isPeriod(periodParam) || periodParam === ALL_PERIODS || !!currentPeriod;
  const status = INVOICE_STATUSES.find((value) => value === params.get('status'));
  const kind = INVOICE_KINDS.find((value) => value === params.get('kind'));
  const overdue = params.get('overdue') === 'true';
  const roomId = params.get('roomId') ?? '';
  const rooms = useRooms(buildingId ?? '', { pageSize: 100, q: roomSearch || undefined });
  const query = useQuery({
    ...invoiceQueryOptions(useStaySdk()).list({
      buildingId: buildingId ?? undefined,
      period: period || undefined,
      status,
      kind,
      overdue: overdue ? 'true' : undefined,
      roomId: roomId || undefined,
      q: q || undefined,
      page: table.page,
      pageSize: table.pageSize,
      sortBy: table.sortBy,
      sortOrder: table.sortOrder,
    }),
    enabled: periodReady,
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

  // Status tabs: one of the statuses, or "Quá hạn" (`overdue=true`); "Tất cả" clears both.
  const statusTab = overdue ? 'overdue' : (status ?? 'all');
  const selectStatusTab = (value: string) =>
    setParams(
      () => {
        const next = latestSearchParams();
        const nextStatus = INVOICE_STATUSES.find((item) => item === value);

        if (nextStatus) next.set('status', nextStatus);
        else next.delete('status');
        if (value === 'overdue') next.set('overdue', 'true');
        else next.delete('overdue');
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
  const pageSum = rows.reduce((sum, row) => sum + row.total, 0);
  const pageRemaining = rows.reduce((sum, row) => sum + row.remaining, 0);
  const onCollect = canPay ? setCollecting : undefined;
  const filtered = Boolean(period || status || kind || overdue || roomId || q);

  const controller = useDataTable<StayInvoiceSummary>({
    caption: 'Danh sách hoá đơn',
    mode: 'server',
    rows,
    rowCount: query.data?.meta.total ?? 0,
    // Keep the page height only once rows exist (not the first load's skeleton).
    preservePageHeight: (query.data?.meta.total ?? 0) > 0,
    columns: invoiceColumns(onCollect),
    rowId: (row) => row.id,
    state: table.state,
    onStateChange: table.onStateChange,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    loading: !periodReady || query.isPending,
    error: query.isError ? getErrorMessage(query.error, 'Không tải được hoá đơn.') : undefined,
    onRetry: () => void query.refetch(),
    emptyState: (
      <EmptyState
        size="compact"
        title="Chưa có hoá đơn"
        description="Lập hoá đơn kỳ hoặc đổi bộ lọc."
        variant={filtered ? 'no-results' : 'empty'}
      />
    ),
    classNames: { row: 'has-[[data-overdue]]:bg-danger-50' },
    'data-testid': TABLE_ID,
  });

  return (
    <div className="grid min-w-0 gap-5">
      <ScreenHeader
        title="Hoá đơn"
        description="Hoá đơn của toà đang chọn: lọc theo kỳ, trạng thái, phòng."
      />
      {!buildingId ? (
        <p>Chọn toà nhà để xem hoá đơn.</p>
      ) : (
        <>
          <FilterBar
            layout="row"
            header={
              <Tabs
                variant="underline"
                label="Trạng thái hoá đơn"
                value={statusTab}
                onValueChange={selectStatusTab}
                className="min-w-0"
              >
                {/* Phones: the tabs scroll inside their own strip, never the page. */}
                <div className="min-w-0 overflow-x-auto">
                  <TabsList className="w-max min-w-full">
                    {STATUS_TABS.map((tab) => (
                      <TabsTrigger key={tab.value} value={tab.value}>
                        {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
              </Tabs>
            }
            actions={
              <>
                {canShare && period ? (
                  <IconButton
                    icon="share"
                    variant="secondary"
                    label={`Chia sẻ hoá đơn kỳ ${displayPeriod(period)}`}
                    onClick={() => navigate(periodSharePath(period))}
                  />
                ) : null}
                {canCreate ? (
                  <Button
                    className="flex-1 sm:flex-none"
                    onClick={() => navigate(billingRunPath(period || todayIsoDate().slice(0, 7)))}
                  >
                    <Icon name="plus" className="size-4" aria-hidden />
                    Lập hoá đơn kỳ
                  </Button>
                ) : null}
              </>
            }
          >
            <PeriodPicker
              label="Kỳ"
              value={period}
              clearable
              placeholder="Tất cả kỳ"
              className={FILTER_ROW_FIELD}
              onChange={(value) => filter('period', value || ALL_PERIODS)}
            />
            <Input
              label="Tìm"
              type="search"
              icon="search"
              rootClassName={FILTER_ROW_GROW}
              placeholder="Mã hoá đơn, phòng"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Select
              label="Phòng"
              placeholder="Tất cả phòng"
              clearable
              searchMode="server"
              onSearchChange={setRoomSearch}
              rootClassName={FILTER_ROW_FIELD}
              value={roomId || null}
              options={(rooms.data?.data ?? []).map((room) => ({
                value: room.id,
                label: room.code,
              }))}
              onValueChange={(value) => filter('roomId', value)}
            />
            <Select
              label="Loại"
              placeholder="Tất cả loại"
              clearable
              rootClassName={FILTER_ROW_FIELD}
              value={kind ?? null}
              options={INVOICE_KINDS.map((value) => ({
                value,
                label: INVOICE_KIND_LABELS[value],
              }))}
              onValueChange={(value) => filter('kind', value)}
            />
          </FilterBar>

          <ListTable
            controller={controller}
            refreshing={query.isFetching && !query.isPending}
            cards={(items) => <InvoiceCards rows={items} onCollect={onCollect} />}
          />
          {rows.length ? (
            <p className="text-ui-sm text-muted" data-testid="invoice-page-total">
              Trang này: tổng {formatVnd(pageSum)} · còn lại {formatVnd(pageRemaining)}
            </p>
          ) : null}
        </>
      )}
      {collecting ? (
        <PaymentDialog invoice={collecting} onClose={() => setCollecting(null)} />
      ) : null}
    </div>
  );
}

type RowsProps = {
  rows: readonly StayInvoiceSummary[];
  /** Opens "Thu tiền" for an issued invoice with something left to collect. */
  onCollect?: (invoice: StayInvoiceSummary) => void;
};

function CollectButton({
  invoice,
  onCollect,
}: {
  invoice: StayInvoiceSummary;
  onCollect: RowsProps['onCollect'];
}) {
  if (!onCollect || !isCollectable(invoice)) return null;
  return (
    <IconButton
      icon="moneyReceive"
      variant="ghost"
      size="sm"
      label={`Thu tiền hoá đơn ${invoice.code ?? ''}`}
      onClick={() => onCollect(invoice)}
    />
  );
}

/** Row actions (≤3 inline): preview what the tenant sees, collect money. */
function RowActions({
  invoice,
  onCollect,
}: {
  invoice: StayInvoiceSummary;
  onCollect: RowsProps['onCollect'];
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <InvoicePreviewButton
        invoiceId={invoice.id}
        iconOnly
        variant="ghost"
        size="sm"
        label={`Xem trước hoá đơn ${invoice.code ?? `nháp phòng ${invoice.roomCode}`}`}
      />
      <CollectButton invoice={invoice} onCollect={onCollect} />
    </div>
  );
}

/** O-21 "đã gửi link chưa": the expiry of the active share link. */
function ShareStatus({ invoice }: { invoice: StayInvoiceSummary }) {
  return invoice.shareExpiresAt ? (
    <span>Link đến {displayExpiry(invoice.shareExpiresAt)}</span>
  ) : (
    <span className="text-muted">Chưa gửi link</span>
  );
}

function CodeLink({ invoice }: { invoice: StayInvoiceSummary }) {
  return (
    <Link className="font-semibold text-accent underline" to={invoicePath(invoice.id)}>
      {invoice.code ?? 'Nháp'}
    </Link>
  );
}

function invoiceColumns(
  onCollect: RowsProps['onCollect'],
): ColumnDef<StayInvoiceSummary, unknown>[] {
  const columns: ColumnDef<StayInvoiceSummary, unknown>[] = [
    {
      id: 'code',
      header: 'Mã',
      accessorFn: (row) => row.code ?? '',
      cell: ({ row }) => (
        <span className="whitespace-nowrap">
          <CodeLink invoice={row.original} />
        </span>
      ),
    },
    { id: 'room', header: 'Phòng', enableSorting: false, accessorFn: (row) => row.roomCode },
    {
      id: 'period',
      header: 'Kỳ',
      accessorFn: (row) => row.period,
      // The kind sits under the period: one column fewer keeps the row actions on screen.
      cell: ({ row }) => (
        <span className="grid whitespace-nowrap">
          {displayPeriod(row.original.period)}
          <span className="text-ui-sm text-muted">{INVOICE_KIND_LABELS[row.original.kind]}</span>
        </span>
      ),
    },
    {
      id: 'total',
      header: 'Tổng',
      meta: { align: 'right' },
      accessorFn: (row) => row.total,
      cell: ({ row }) => <span className="whitespace-nowrap">{formatVnd(row.original.total)}</span>,
    },
    {
      id: 'paidTotal',
      header: 'Đã thu',
      meta: { align: 'right' },
      cell: ({ row }) => (
        <span className="whitespace-nowrap">{formatVnd(row.original.paidTotal)}</span>
      ),
    },
    {
      id: 'remaining',
      header: 'Còn lại',
      meta: { align: 'right' },
      cell: ({ row }) => (
        <span
          className={cn(
            'whitespace-nowrap',
            row.original.overdue && 'font-semibold text-danger-700',
          )}
          data-overdue={row.original.overdue || undefined}
        >
          {formatVnd(row.original.remaining)}
        </span>
      ),
    },
    {
      id: 'dueOn',
      header: 'Hạn',
      accessorFn: (row) => row.dueOn,
      cell: ({ row }) => (
        <span className={cn('whitespace-nowrap', row.original.overdue && 'text-danger-700')}>
          {displayDate(row.original.dueOn)}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Trạng thái',
      // Share link state under the status (O-21), like the kind under the period.
      cell: ({ row }) => (
        <span className="grid justify-items-start gap-1 whitespace-nowrap">
          <InvoiceStatusTag invoice={row.original} />
          <span className="text-ui-sm">
            <ShareStatus invoice={row.original} />
          </span>
        </span>
      ),
    },
  ];

  columns.push({
    id: 'actions',
    header: () => <span className="sr-only">Thao tác</span>,
    cell: ({ row }) => <RowActions invoice={row.original} onCollect={onCollect} />,
  });
  return columns;
}

function InvoiceCards({ rows, onCollect }: RowsProps) {
  return (
    <ul className="grid gap-3" aria-label="Danh sách hoá đơn">
      {rows.map((invoice) => (
        <li
          key={invoice.id}
          className={cn(
            'grid gap-2 rounded-panel border bg-surface p-4',
            invoice.overdue ? 'border-danger-700' : 'border-line',
          )}
          data-testid={rowTestId(TABLE_ID, invoice.id)}
          data-overdue={invoice.overdue || undefined}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CodeLink invoice={invoice} />
            <div className="flex items-center gap-1">
              <InvoiceStatusTag invoice={invoice} />
              <RowActions invoice={invoice} onCollect={onCollect} />
            </div>
          </div>
          <p>
            Phòng {invoice.roomCode} · Kỳ {displayPeriod(invoice.period)} ·{' '}
            {INVOICE_KIND_LABELS[invoice.kind]}
          </p>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-ui-sm">
            <dt className="text-muted">Tổng</dt>
            <dd className="text-right font-semibold">{formatVnd(invoice.total)}</dd>
            <dt className="text-muted">Đã thu</dt>
            <dd className="text-right">{formatVnd(invoice.paidTotal)}</dd>
            <dt className="text-muted">Còn lại</dt>
            <dd className={cn('text-right', invoice.overdue && 'font-semibold text-danger-700')}>
              {formatVnd(invoice.remaining)}
            </dd>
            <dt className="text-muted">Hạn</dt>
            <dd className={cn('text-right', invoice.overdue && 'text-danger-700')}>
              {displayDate(invoice.dueOn)}
            </dd>
            <dt className="text-muted">Chia sẻ</dt>
            <dd className="text-right">
              <ShareStatus invoice={invoice} />
            </dd>
          </dl>
        </li>
      ))}
    </ul>
  );
}
