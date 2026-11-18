import {
  type ColumnDef,
  cn,
  DatePicker,
  EmptyState,
  IconButton,
  type IconName,
  Input,
  KpiCard,
  KpiGrid,
  Select,
  useDataTable,
} from '@itclabs/react-ui';
import { usePayments } from '@stay/sdk/react';
import { getErrorMessage } from '@stay/sdk/shared';
import { isIsoDate, PAYMENT_METHODS, type PaymentMethod, type StayPayment } from '@stay/shared';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCanOn } from '@/libraries/ability';
import { useActiveBuilding } from '@/libraries/buildings/building-provider';
import { FILTER_WIDE, FilterBar, FilterCheckbox } from '@/libraries/filter-bar';
import { displayDate, formatVnd } from '@/libraries/format';
import { ListTable, rowTestId } from '@/libraries/list-table';
import { ScreenHeader } from '@/libraries/screen-header';
import { latestSearchParams } from '@/libraries/search-params';
import { PAGE_SIZE_OPTIONS, useTableParams } from '@/libraries/table-params';
import { invoicePath } from '../invoices/invoice-ui';
import { PAYMENT_METHOD_LABELS, PAYMENT_METHOD_OPTIONS, PaymentStatusTag } from './payment-ui';
import { ReversePaymentDialog } from './reverse-dialog';

const TABLE_ID = 'payment-list';

const METHOD_ICONS: Record<PaymentMethod, IconName> = {
  cash: 'walletMoney',
  bank_transfer: 'creditCard',
  other: 'receipt',
  deposit: 'key',
};
const SORT_FIELDS = ['paidOn', 'amount', 'createdAt'] as const;

/** O-23 Sổ thu: payments by date with totals per method, to reconcile with bank statements. */
export default function PaymentsPage() {
  const { buildingId } = useActiveBuilding();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('q') ?? '');
  const [reversing, setReversing] = useState<StayPayment | null>(null);
  const canReverse = useCanOn('void', 'Payment', { buildingId: buildingId ?? undefined });
  const table = useTableParams({
    sortFields: SORT_FIELDS,
    defaultSort: { sortBy: 'paidOn', sortOrder: 'desc' },
  });

  const q = params.get('q') ?? '';
  const from = isIsoDate(params.get('from')) ? (params.get('from') ?? '') : '';
  const to = isIsoDate(params.get('to')) ? (params.get('to') ?? '') : '';
  const method = PAYMENT_METHODS.find((value) => value === params.get('method'));
  const hideReversed = params.get('reversed') === 'hide';
  const invalidRange = Boolean(from && to && from > to);

  const query = usePayments({
    buildingId: buildingId ?? undefined,
    dateFrom: from || undefined,
    dateTo: invalidRange ? undefined : to || undefined,
    method,
    includeReversed: hideReversed ? 'false' : 'true',
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

  const rows = query.data?.data ?? [];
  const meta = query.data?.meta;
  const filtered = Boolean(from || to || method || q || hideReversed);
  const onReverse = canReverse ? setReversing : undefined;

  const controller = useDataTable<StayPayment>({
    caption: 'Sổ thu',
    mode: 'server',
    rows,
    rowCount: meta?.total ?? 0,
    // Keep the page height only once rows exist (not the first load's skeleton).
    preservePageHeight: (meta?.total ?? 0) > 0,
    columns: paymentColumns(onReverse),
    rowId: (row) => row.id,
    state: table.state,
    onStateChange: table.onStateChange,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    loading: query.isPending,
    error: query.isError ? getErrorMessage(query.error, 'Không tải được sổ thu.') : undefined,
    onRetry: () => void query.refetch(),
    emptyState: (
      <EmptyState
        size="compact"
        title="Chưa có khoản thu"
        description="Thu tiền từ chi tiết hoá đơn, danh sách hoá đơn hoặc sơ đồ phòng."
        variant={filtered ? 'no-results' : 'empty'}
      />
    ),
    'data-testid': TABLE_ID,
  });

  return (
    <div className="grid min-w-0 gap-5">
      <ScreenHeader
        title="Sổ thu"
        description="Các khoản đã thu của toà đang chọn, theo ngày thu. Tổng theo phương thức để đối chiếu sao kê ngân hàng."
      />
      {!buildingId ? (
        <p>Chọn toà nhà để xem sổ thu.</p>
      ) : (
        <>
          <FilterBar>
            <DatePicker
              label="Từ ngày"
              value={from || null}
              {...(to ? { maxDate: to } : {})}
              onValueChange={(value) => filter('from', value)}
            />
            <DatePicker
              label="Đến ngày"
              value={to || null}
              {...(from ? { minDate: from } : {})}
              onValueChange={(value) => filter('to', value)}
            />
            <Select
              label="Phương thức"
              placeholder="Tất cả phương thức"
              clearable
              value={method ?? null}
              options={PAYMENT_METHOD_OPTIONS}
              onValueChange={(value) => filter('method', value)}
            />
            <Input
              label="Tìm"
              type="search"
              rootClassName={FILTER_WIDE}
              placeholder="Mã hoá đơn, phòng, mã giao dịch"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <FilterCheckbox
              label="Ẩn bút toán đã huỷ"
              checked={hideReversed}
              onCheckedChange={(value) => filter('reversed', value === true ? 'hide' : null)}
            />
          </FilterBar>
          {invalidRange ? (
            <p className="text-danger-700" role="alert">
              "Đến ngày" phải bằng hoặc sau "Từ ngày".
            </p>
          ) : null}

          {meta ? (
            <KpiGrid columns={5} aria-label="Tổng theo phương thức" data-testid="payment-totals">
              {meta.totals.map((total) => (
                <KpiCard
                  key={total.method}
                  label={PAYMENT_METHOD_LABELS[total.method]}
                  value={formatVnd(total.amount)}
                  hint={`${total.count} khoản`}
                  icon={METHOD_ICONS[total.method]}
                  tone="neutral"
                  compact
                  data-testid={`payment-total-${total.method}`}
                />
              ))}
              <KpiCard
                label="Tổng đã thu"
                value={formatVnd(meta.totalAmount)}
                icon="moneyReceive"
                tone="success"
                compact
                data-testid="payment-total-all"
              />
            </KpiGrid>
          ) : null}

          <ListTable
            controller={controller}
            refreshing={query.isFetching && !query.isPending}
            cards={(items) => <PaymentCards rows={items} onReverse={onReverse} />}
          />
        </>
      )}
      {reversing ? (
        <ReversePaymentDialog payment={reversing} onClose={() => setReversing(null)} />
      ) : null}
    </div>
  );
}

type RowsProps = {
  rows: readonly StayPayment[];
  onReverse?: (payment: StayPayment) => void;
};

function InvoiceLink({ payment }: { payment: StayPayment }) {
  return (
    <Link className="font-semibold text-accent underline" to={invoicePath(payment.invoiceId)}>
      {payment.invoiceCode ?? 'Hoá đơn'}
    </Link>
  );
}

function ReverseButton({
  payment,
  onReverse,
}: { payment: StayPayment } & Pick<RowsProps, 'onReverse'>) {
  // Deposit offsets belong to a settlement (ST-17) and are final.
  if (!onReverse || payment.status === 'reversed' || payment.method === 'deposit') return null;
  return (
    <IconButton
      icon="rotateLeft"
      variant="ghost"
      size="sm"
      label={`Huỷ bút toán ${formatVnd(payment.amount)} hoá đơn ${payment.invoiceCode ?? ''}`}
      onClick={() => onReverse(payment)}
    />
  );
}

function Amount({ payment }: { payment: StayPayment }) {
  return (
    <span
      className={cn(
        'whitespace-nowrap font-semibold',
        payment.status === 'reversed' && 'text-muted line-through',
      )}
    >
      {formatVnd(payment.amount)}
    </span>
  );
}

function paymentColumns(onReverse: RowsProps['onReverse']): ColumnDef<StayPayment, unknown>[] {
  const columns: ColumnDef<StayPayment, unknown>[] = [
    {
      id: 'paidOn',
      header: 'Ngày',
      accessorFn: (row) => row.paidOn,
      cell: ({ row }) => (
        <span className="whitespace-nowrap">{displayDate(row.original.paidOn)}</span>
      ),
    },
    {
      id: 'invoice',
      header: 'Hoá đơn',
      cell: ({ row }) => (
        <span className="whitespace-nowrap">
          <InvoiceLink payment={row.original} />
          <span className="block text-ui-sm text-muted">Phòng {row.original.roomCode}</span>
        </span>
      ),
    },
    {
      id: 'amount',
      header: 'Số tiền',
      meta: { align: 'right' },
      accessorFn: (row) => row.amount,
      cell: ({ row }) => <Amount payment={row.original} />,
    },
    {
      id: 'method',
      header: 'Phương thức',
      cell: ({ row }) => (
        <span className="whitespace-nowrap">{PAYMENT_METHOD_LABELS[row.original.method]}</span>
      ),
    },
    {
      id: 'detail',
      header: 'Chi tiết',
      cell: ({ row }) => (
        <span className="grid max-w-48">
          <span className="truncate" title={row.original.reference ?? undefined}>
            {row.original.reference ? `Mã GD ${row.original.reference}` : '—'}
          </span>
          <span className="truncate text-ui-sm text-muted">
            Người ghi {row.original.actorName ?? '—'}
          </span>
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Trạng thái',
      cell: ({ row }) => <Status payment={row.original} />,
    },
  ];

  if (onReverse)
    columns.push({
      id: 'actions',
      header: () => <span className="sr-only">Thao tác</span>,
      cell: ({ row }) => <ReverseButton payment={row.original} onReverse={onReverse} />,
    });
  return columns;
}

/** Status tag; `data-payment-status` marks the row's payment status for tests. */
function Status({ payment }: { payment: StayPayment }) {
  return (
    <span className="inline-flex" data-payment-status={payment.status}>
      <PaymentStatusTag payment={payment} />
    </span>
  );
}

/** Phones: cards grouped under their payment date. */
function PaymentCards({ rows, onReverse }: RowsProps) {
  const days = new Map<string, StayPayment[]>();

  for (const payment of rows)
    days.set(payment.paidOn, [...(days.get(payment.paidOn) ?? []), payment]);

  return (
    <div className="grid gap-4">
      {[...days].map(([day, payments]) => (
        <section key={day} aria-labelledby={`payments-${day}`} className="grid gap-2">
          <h2 id={`payments-${day}`} className="text-ui-sm font-semibold text-muted">
            {displayDate(day)}
          </h2>
          <ul className="grid gap-2">
            {payments.map((payment) => (
              <li
                key={payment.id}
                className="grid gap-1 rounded-panel border border-line bg-surface p-3"
                data-testid={rowTestId(TABLE_ID, payment.id)}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <InvoiceLink payment={payment} />
                  <div className="flex items-center gap-1">
                    <Status payment={payment} />
                    <ReverseButton payment={payment} onReverse={onReverse} />
                  </div>
                </div>
                <p className="flex flex-wrap items-center justify-between gap-2">
                  <span>
                    Phòng {payment.roomCode} · {PAYMENT_METHOD_LABELS[payment.method]}
                  </span>
                  <Amount payment={payment} />
                </p>
                <p className="text-ui-sm text-muted break-words">
                  {displayDate(payment.paidOn)}
                  {payment.reference ? ` · Mã GD ${payment.reference}` : ''}
                  {payment.actorName ? ` · ${payment.actorName}` : ''}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
