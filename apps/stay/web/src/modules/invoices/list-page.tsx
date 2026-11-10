import { Button, Checkbox, cn, EmptyState, IconButton, Input, Select } from '@itclabs/react-ui';
import { useInvoices, useRooms } from '@stay/sdk/react';
import { INVOICE_KINDS, INVOICE_STATUSES, isPeriod, type StayInvoiceSummary } from '@stay/shared';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCanOn } from '@/libraries/ability';
import { useActiveBuilding } from '@/libraries/buildings/building-provider';
import { displayDate, formatVnd, todayIsoDate } from '@/libraries/format';
import { LoadError, LoadingRows } from '@/libraries/forms/page-states';
import { ScreenHeader } from '@/libraries/screen-header';
import { latestSearchParams } from '@/libraries/search-params';
import { useIsDesktop } from '@/libraries/use-media-query';
import { PaymentDialog } from '../payments/payment-dialog';
import { isCollectable } from '../payments/payment-ui';
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

const PAGE_SIZE = 20;

/** O-21 Danh sách hoá đơn: filters on the URL, server paging, cards on phones. */
export default function InvoiceListPage() {
  const { buildingId } = useActiveBuilding();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('q') ?? '');
  const [roomSearch, setRoomSearch] = useState('');
  const isDesktop = useIsDesktop();
  const navigate = useNavigate();
  const canCreate = useCanOn('create', 'Invoice', { buildingId: buildingId ?? undefined });
  const canPay = useCanOn('create', 'Payment', { buildingId: buildingId ?? undefined });
  const canShare = useCanOn('update', 'Invoice', { buildingId: buildingId ?? undefined });
  const [collecting, setCollecting] = useState<StayInvoiceSummary | null>(null);

  const q = params.get('q') ?? '';
  const period = isPeriod(params.get('period')) ? (params.get('period') ?? '') : '';
  const status = INVOICE_STATUSES.find((value) => value === params.get('status'));
  const kind = INVOICE_KINDS.find((value) => value === params.get('kind'));
  const overdue = params.get('overdue') === 'true';
  const roomId = params.get('roomId') ?? '';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const rooms = useRooms(buildingId ?? '', { pageSize: 100, q: roomSearch || undefined });
  const query = useInvoices({
    buildingId: buildingId ?? undefined,
    period: period || undefined,
    status,
    kind,
    overdue: overdue ? 'true' : undefined,
    roomId: roomId || undefined,
    q: q || undefined,
    page,
    pageSize: PAGE_SIZE,
    sortBy: 'createdAt',
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
  const total = query.data?.meta.total ?? 0;
  const totalPages = query.data?.meta.totalPages ?? 1;
  const pageSum = rows.reduce((sum, row) => sum + row.total, 0);
  const pageRemaining = rows.reduce((sum, row) => sum + row.remaining, 0);

  return (
    <div className="grid min-w-0 gap-5">
      <ScreenHeader
        title="Hoá đơn"
        description="Hoá đơn của toà đang chọn: lọc theo kỳ, trạng thái, phòng."
        action={
          canCreate ? (
            <Button onClick={() => navigate(billingRunPath(period || todayIsoDate().slice(0, 7)))}>
              Lập hoá đơn kỳ
            </Button>
          ) : undefined
        }
      />
      {!buildingId ? (
        <p>Chọn toà nhà để xem hoá đơn.</p>
      ) : (
        <>
          <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              label="Kỳ"
              type="month"
              value={period}
              onChange={(event) => filter('period', event.target.value)}
            />
            <Input
              label="Tìm"
              type="search"
              placeholder="Mã hoá đơn hoặc phòng"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Select
              label="Trạng thái"
              placeholder="Tất cả trạng thái"
              clearable
              value={status ?? null}
              options={INVOICE_STATUSES.map((value) => ({
                value,
                label: INVOICE_STATUS_LABELS[value],
              }))}
              onValueChange={(value) => filter('status', value)}
            />
            <Select
              label="Loại"
              placeholder="Tất cả loại"
              clearable
              value={kind ?? null}
              options={INVOICE_KINDS.map((value) => ({
                value,
                label: INVOICE_KIND_LABELS[value],
              }))}
              onValueChange={(value) => filter('kind', value)}
            />
            <Select
              label="Phòng"
              placeholder="Tất cả phòng"
              clearable
              searchMode="server"
              onSearchChange={setRoomSearch}
              value={roomId || null}
              options={(rooms.data?.data ?? []).map((room) => ({
                value: room.id,
                label: room.code,
              }))}
              onValueChange={(value) => filter('roomId', value)}
            />
            <Checkbox
              className="self-end"
              label="Chỉ hoá đơn quá hạn"
              checked={overdue}
              onCheckedChange={(value) => filter('overdue', value === true ? 'true' : null)}
            />
          </div>
          {canShare && period ? (
            <Link className="font-semibold text-accent underline" to={periodSharePath(period)}>
              Chia sẻ hoá đơn kỳ {displayPeriod(period)}
            </Link>
          ) : null}

          {query.isPending ? (
            <LoadingRows />
          ) : query.isError ? (
            <LoadError error={query.error} onRetry={() => void query.refetch()} />
          ) : !rows.length ? (
            <EmptyState
              title="Chưa có hoá đơn"
              description="Lập hoá đơn kỳ hoặc đổi bộ lọc."
              variant={period || status || kind || overdue || roomId || q ? 'no-results' : 'empty'}
            />
          ) : (
            <>
              {isDesktop ? (
                <InvoiceTable rows={rows} onCollect={canPay ? setCollecting : undefined} />
              ) : (
                <InvoiceCards rows={rows} onCollect={canPay ? setCollecting : undefined} />
              )}
              <p className="text-ui-sm text-muted" data-testid="invoice-page-total">
                Trang này: tổng {formatVnd(pageSum)} · còn lại {formatVnd(pageRemaining)}
              </p>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button
                  variant="secondary"
                  disabled={page <= 1 || query.isFetching}
                  onClick={() => filter('page', String(page - 1))}
                >
                  Trước
                </Button>
                <span>
                  Trang {page}/{Math.max(1, totalPages)} · {total} hoá đơn
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
      {collecting ? (
        <PaymentDialog invoice={collecting} onClose={() => setCollecting(null)} />
      ) : null}
    </div>
  );
}

type RowsProps = {
  rows: StayInvoiceSummary[];
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

/** O-21 "đã gửi link chưa": the expiry of the active share link. */
function ShareStatus({ invoice }: { invoice: StayInvoiceSummary }) {
  return invoice.shareExpiresAt ? (
    <span>Đến {displayExpiry(invoice.shareExpiresAt)}</span>
  ) : (
    <span className="text-muted">Chưa gửi</span>
  );
}

function CodeLink({ invoice }: { invoice: StayInvoiceSummary }) {
  return (
    <Link className="font-semibold text-accent underline" to={invoicePath(invoice.id)}>
      {invoice.code ?? 'Nháp'}
    </Link>
  );
}

function InvoiceTable({ rows, onCollect }: RowsProps) {
  return (
    <div className="min-w-0 overflow-x-auto rounded-panel border border-line bg-surface">
      <table className="w-full text-left" aria-label="Danh sách hoá đơn">
        <thead>
          <tr>
            {[
              'Mã',
              'Phòng',
              'Kỳ',
              'Loại',
              'Tổng',
              'Đã thu',
              'Còn lại',
              'Hạn',
              'Trạng thái',
              'Link',
            ].map((label) => (
              <th key={label} scope="col" className="whitespace-nowrap p-3">
                {label}
              </th>
            ))}
            {onCollect ? (
              <th scope="col" className="p-3">
                <span className="sr-only">Thao tác</span>
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((invoice) => (
            <tr
              key={invoice.id}
              className={cn('border-t border-line', invoice.overdue && 'bg-danger-50')}
              data-testid="invoice-row"
              data-overdue={invoice.overdue || undefined}
            >
              <td className="whitespace-nowrap p-3">
                <CodeLink invoice={invoice} />
              </td>
              <td className="p-3">{invoice.roomCode}</td>
              <td className="whitespace-nowrap p-3">{displayPeriod(invoice.period)}</td>
              <td className="p-3">{INVOICE_KIND_LABELS[invoice.kind]}</td>
              <td className="whitespace-nowrap p-3">{formatVnd(invoice.total)}</td>
              <td className="whitespace-nowrap p-3">{formatVnd(invoice.paidTotal)}</td>
              <td
                className={cn(
                  'whitespace-nowrap p-3',
                  invoice.overdue && 'font-semibold text-danger-700',
                )}
              >
                {formatVnd(invoice.remaining)}
              </td>
              <td className={cn('whitespace-nowrap p-3', invoice.overdue && 'text-danger-700')}>
                {displayDate(invoice.dueOn)}
              </td>
              <td className="p-3">
                <InvoiceStatusTag invoice={invoice} />
              </td>
              <td className="whitespace-nowrap p-3 text-ui-sm">
                <ShareStatus invoice={invoice} />
              </td>
              {onCollect ? (
                <td className="p-1">
                  <CollectButton invoice={invoice} onCollect={onCollect} />
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
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
          data-testid="invoice-row"
          data-overdue={invoice.overdue || undefined}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CodeLink invoice={invoice} />
            <div className="flex items-center gap-1">
              <InvoiceStatusTag invoice={invoice} />
              <CollectButton invoice={invoice} onCollect={onCollect} />
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
            <dt className="text-muted">Link</dt>
            <dd className="text-right">
              <ShareStatus invoice={invoice} />
            </dd>
          </dl>
        </li>
      ))}
    </ul>
  );
}
