import { Button, cn, EmptyState, Input, Select } from '@itclabs/react-ui';
import { useReceivables } from '@stay/sdk/react';
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
import { displayDate, formatVnd } from '@/libraries/format';
import { LoadError, LoadingRows } from '@/libraries/forms/page-states';
import { ScreenHeader } from '@/libraries/screen-header';
import { latestSearchParams } from '@/libraries/search-params';
import { useIsDesktop } from '@/libraries/use-media-query';
import { ShareInvoiceDialog } from '../invoices/share/share-dialog';
import { InvoicesPaymentDialog } from '../payments/payment-dialog';
import {
  BUCKET_LABELS,
  OverdueTag,
  ReceivableActions,
  ReceivableInvoices,
  type RowActions,
} from './receivable-ui';

const PAGE_SIZE = 20;

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
  const isDesktop = useIsDesktop();
  const scope = { buildingId: buildingId ?? undefined };
  const canPay = useCanOn('create', 'Payment', scope);
  const canShare = useCanOn('update', 'Invoice', scope);

  const q = params.get('q') ?? '';
  const bucket = RECEIVABLE_BUCKETS.find((value) => value === params.get('bucket'));
  const sortBy =
    RECEIVABLE_SORT_FIELDS.find((value) => value === params.get('sort')) ?? 'remaining';
  const page = Math.max(1, Number(params.get('page')) || 1);

  const query = useReceivables(buildingId ?? '', {
    bucket,
    q: q || undefined,
    page,
    pageSize: PAGE_SIZE,
    sortBy,
    sortOrder: sortBy === 'roomCode' ? 'asc' : 'desc',
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

  const rows: StayReceivable[] = query.data?.data ?? [];
  const meta = query.data?.meta;
  const totalPages = meta?.totalPages ?? 1;
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
            <dl className="grid min-w-0 grid-cols-2 gap-3" aria-label="Tổng công nợ">
              <div className="grid gap-0.5 rounded-panel border border-line bg-surface p-3">
                <dt className="text-ui-sm text-muted">
                  Tổng công nợ{bucket || q ? ' (theo bộ lọc)' : ''} · {meta.invoiceCount} hoá đơn
                </dt>
                <dd className="font-bold break-all" data-testid="receivables-total">
                  {formatVnd(meta.totalRemaining)}
                </dd>
              </div>
              <div className="grid gap-0.5 rounded-panel border border-line bg-surface p-3">
                <dt className="text-ui-sm text-muted">Đã quá hạn</dt>
                <dd
                  className={cn(
                    'font-bold break-all',
                    meta.overdueRemaining > 0 && 'text-danger-700',
                  )}
                  data-testid="receivables-overdue"
                >
                  {formatVnd(meta.overdueRemaining)}
                </dd>
              </div>
            </dl>
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

          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            <Input
              label="Tìm"
              type="search"
              placeholder="Phòng, mã hợp đồng, tên hoặc SĐT"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Select
              label="Sắp xếp"
              value={sortBy}
              options={SORT_OPTIONS}
              onValueChange={(value) => filter('sort', value === 'remaining' ? null : value)}
            />
          </div>

          {query.isPending ? (
            <LoadingRows />
          ) : query.isError ? (
            <LoadError error={query.error} onRetry={() => void query.refetch()} />
          ) : !rows.length ? (
            <EmptyState
              title={bucket || q ? 'Không có công nợ phù hợp' : 'Không có công nợ'}
              description={
                bucket || q
                  ? 'Đổi nhóm hoặc từ khoá tìm kiếm.'
                  : 'Mọi hoá đơn đã phát hành của toà đều đã thu đủ.'
              }
              variant={bucket || q ? 'no-results' : 'empty'}
            />
          ) : (
            <>
              {isDesktop ? (
                <ReceivableTable
                  rows={rows}
                  expanded={expanded}
                  onToggle={toggle}
                  actions={actions}
                />
              ) : (
                <ReceivableCards
                  rows={rows}
                  expanded={expanded}
                  onToggle={toggle}
                  actions={actions}
                />
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
                  Trang {page}/{Math.max(1, totalPages)} · {meta?.total ?? 0} hợp đồng
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
  rows: StayReceivable[];
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

function ReceivableTable({ rows, expanded, onToggle, actions }: ListProps) {
  return (
    <div className="min-w-0 overflow-x-auto rounded-panel border border-line bg-surface">
      <table className="w-full text-left" aria-label="Công nợ">
        <thead>
          <tr>
            {['Phòng', 'Người đại diện', 'Số kỳ nợ', 'Còn lại', 'Quá hạn', 'Hạn cũ nhất'].map(
              (label) => (
                <th key={label} scope="col" className="whitespace-nowrap p-3">
                  {label}
                </th>
              ),
            )}
            <th scope="col" className="p-3">
              <span className="sr-only">Thao tác</span>
            </th>
          </tr>
        </thead>
        {rows.map((row) => {
          const open = expanded.has(row.contractId);

          return (
            <tbody
              key={row.contractId}
              className="border-t border-line"
              data-testid="receivable-row"
              data-room={row.roomCode}
              data-bucket={row.bucket}
            >
              <tr>
                <th scope="row" className="whitespace-nowrap p-3 font-semibold">
                  {row.roomCode}
                </th>
                <td className="max-w-56 p-3">
                  <Representative row={row} />
                </td>
                <td className="p-2">
                  <PeriodsToggle row={row} open={open} onToggle={() => onToggle(row.contractId)} />
                </td>
                <td
                  className={cn(
                    'whitespace-nowrap p-3 font-semibold',
                    row.overdueDays > 0 && 'text-danger-700',
                  )}
                  data-testid="receivable-remaining"
                >
                  {formatVnd(row.remaining)}
                </td>
                <td className="whitespace-nowrap p-3">
                  <OverdueTag row={row} />
                </td>
                <td className="whitespace-nowrap p-3">{displayDate(row.oldestDueOn)}</td>
                <td className="p-1">
                  <ReceivableActions row={row} {...actions} />
                </td>
              </tr>
              {open ? (
                <tr id={`receivable-${row.contractId}`}>
                  <td colSpan={7} className="px-3 pb-3">
                    <ReceivableInvoices row={row} {...actions} />
                  </td>
                </tr>
              ) : null}
            </tbody>
          );
        })}
      </table>
    </div>
  );
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
            data-testid="receivable-row"
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
