import { Button, cn, DatePicker, EmptyState, IconButton, Input, Select } from '@itclabs/react-ui';
import { usePayments } from '@stay/sdk/react';
import { isIsoDate, PAYMENT_METHODS, type StayPayment } from '@stay/shared';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCanOn } from '@/libraries/ability';
import { useActiveBuilding } from '@/libraries/buildings/building-provider';
import { FILTER_WIDE, FilterBar, FilterCheckbox } from '@/libraries/filter-bar';
import { displayDate, formatVnd } from '@/libraries/format';
import { LoadError, LoadingRows } from '@/libraries/forms/page-states';
import { ScreenHeader } from '@/libraries/screen-header';
import { latestSearchParams } from '@/libraries/search-params';
import { useIsDesktop } from '@/libraries/use-media-query';
import { invoicePath } from '../invoices/invoice-ui';
import { PAYMENT_METHOD_LABELS, PAYMENT_METHOD_OPTIONS, PaymentStatusTag } from './payment-ui';
import { ReversePaymentDialog } from './reverse-dialog';

const PAGE_SIZE = 20;

/** O-23 Sổ thu: payments by date with totals per method, to reconcile with bank statements. */
export default function PaymentsPage() {
  const { buildingId } = useActiveBuilding();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('q') ?? '');
  const [reversing, setReversing] = useState<StayPayment | null>(null);
  const isDesktop = useIsDesktop();
  const canReverse = useCanOn('void', 'Payment', { buildingId: buildingId ?? undefined });

  const q = params.get('q') ?? '';
  const from = isIsoDate(params.get('from')) ? (params.get('from') ?? '') : '';
  const to = isIsoDate(params.get('to')) ? (params.get('to') ?? '') : '';
  const method = PAYMENT_METHODS.find((value) => value === params.get('method'));
  const hideReversed = params.get('reversed') === 'hide';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const invalidRange = Boolean(from && to && from > to);

  const query = usePayments({
    buildingId: buildingId ?? undefined,
    dateFrom: from || undefined,
    dateTo: invalidRange ? undefined : to || undefined,
    method,
    includeReversed: hideReversed ? 'false' : 'true',
    q: q || undefined,
    page,
    pageSize: PAGE_SIZE,
    sortBy: 'paidOn',
    sortOrder: 'desc',
  });

  const filter = (field: string, value: string | null) =>
    setParams(
      () => {
        const next = latestSearchParams();

        if (value) next.set(field, value);
        else next.delete(field);
        if (field !== 'page') next.delete('page');
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
  const totalPages = meta?.totalPages ?? 1;
  const filtered = Boolean(from || to || method || q || hideReversed);
  const onReverse = canReverse ? setReversing : undefined;

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
            <dl
              className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-4"
              aria-label="Tổng theo phương thức"
              data-testid="payment-totals"
            >
              {meta.totals.map((total) => (
                <div
                  key={total.method}
                  className="grid gap-0.5 rounded-panel border border-line bg-surface p-3"
                  data-testid={`payment-total-${total.method}`}
                >
                  <dt className="text-ui-sm text-muted">
                    {PAYMENT_METHOD_LABELS[total.method]} · {total.count} khoản
                  </dt>
                  <dd className="font-bold break-all">{formatVnd(total.amount)}</dd>
                </div>
              ))}
              <div
                className="grid gap-0.5 rounded-panel border border-line bg-surface p-3"
                data-testid="payment-total-all"
              >
                <dt className="text-ui-sm text-muted">Tổng đã thu</dt>
                <dd className="font-bold break-all">{formatVnd(meta.totalAmount)}</dd>
              </div>
            </dl>
          ) : null}

          {query.isPending ? (
            <LoadingRows />
          ) : query.isError ? (
            <LoadError error={query.error} onRetry={() => void query.refetch()} />
          ) : !rows.length ? (
            <EmptyState
              title="Chưa có khoản thu"
              description="Thu tiền từ chi tiết hoá đơn, danh sách hoá đơn hoặc sơ đồ phòng."
              variant={filtered ? 'no-results' : 'empty'}
            />
          ) : (
            <>
              {isDesktop ? (
                <PaymentTable rows={rows} onReverse={onReverse} />
              ) : (
                <PaymentCards rows={rows} onReverse={onReverse} />
              )}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button
                  variant="secondary"
                  disabled={page <= 1 || query.isFetching}
                  onClick={() => filter('page', String(page - 1))}
                >
                  Trước
                </Button>
                <span>
                  Trang {page}/{Math.max(1, totalPages)} · {meta?.total ?? 0} khoản
                </span>
                <Button
                  variant="secondary"
                  disabled={page >= totalPages || query.isFetching}
                  onClick={() => filter('page', String(page + 1))}
                >
                  Sau
                </Button>
              </div>
            </>
          )}
        </>
      )}
      {reversing ? (
        <ReversePaymentDialog payment={reversing} onClose={() => setReversing(null)} />
      ) : null}
    </div>
  );
}

type RowsProps = {
  rows: StayPayment[];
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

function PaymentTable({ rows, onReverse }: RowsProps) {
  return (
    <div className="min-w-0 relative overflow-x-auto rounded-panel border border-line bg-surface">
      <table className="w-full text-left" aria-label="Sổ thu">
        <thead>
          <tr>
            {['Ngày', 'Hoá đơn', 'Số tiền', 'Phương thức', 'Chi tiết', 'Trạng thái'].map(
              (label) => (
                <th key={label} scope="col" className="whitespace-nowrap p-3">
                  {label}
                </th>
              ),
            )}
            {onReverse ? (
              <th scope="col" className="p-3">
                <span className="sr-only">Thao tác</span>
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((payment) => (
            <tr
              key={payment.id}
              className="border-t border-line"
              data-testid="payment-row"
              data-payment-status={payment.status}
            >
              <td className="whitespace-nowrap p-3">{displayDate(payment.paidOn)}</td>
              <td className="whitespace-nowrap p-3">
                <InvoiceLink payment={payment} />
                <span className="block text-ui-sm text-muted">Phòng {payment.roomCode}</span>
              </td>
              <td className="p-3">
                <Amount payment={payment} />
              </td>
              <td className="whitespace-nowrap p-3">{PAYMENT_METHOD_LABELS[payment.method]}</td>
              <td className="max-w-48 p-3">
                <span className="block truncate" title={payment.reference ?? undefined}>
                  {payment.reference ? `Mã GD ${payment.reference}` : '—'}
                </span>
                <span className="block truncate text-ui-sm text-muted">
                  Người ghi {payment.actorName ?? '—'}
                </span>
              </td>
              <td className="p-3">
                <PaymentStatusTag payment={payment} />
              </td>
              {onReverse ? (
                <td className="p-1">
                  <ReverseButton payment={payment} onReverse={onReverse} />
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
                data-testid="payment-row"
                data-payment-status={payment.status}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <InvoiceLink payment={payment} />
                  <div className="flex items-center gap-1">
                    <PaymentStatusTag payment={payment} />
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
