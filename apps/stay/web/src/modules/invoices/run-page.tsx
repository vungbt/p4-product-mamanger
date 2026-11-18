import {
  AlertDialog,
  Button,
  Checkbox,
  type ColumnDef,
  cn,
  DataTable,
  type DataTableState,
  Icon,
  KpiCard,
  KpiGrid,
  useDataTable,
} from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import {
  useBillingPreview,
  useCreateInvoiceDrafts,
  useInvoices,
  useIssueInvoices,
} from '@stay/sdk/react';
import { type BillingPreviewRow, isPeriod, type StayInvoiceSummary } from '@stay/shared';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCanOn } from '@/libraries/ability';
import { useActiveBuilding } from '@/libraries/buildings/building-provider';
import { displayDate, formatVnd, todayIsoDate } from '@/libraries/format';
import { FormError, LoadError, LoadingRows } from '@/libraries/forms/page-states';
import { PeriodPicker } from '@/libraries/forms/period-picker';
import { ListTable, rowTestId } from '@/libraries/list-table';
import { ScreenHeader } from '@/libraries/screen-header';
import { PAGE_SIZE_OPTIONS } from '@/libraries/table-params';
import { useIsDesktop } from '@/libraries/use-media-query';
import {
  displayPeriod,
  exclusionLabel,
  INVOICE_STATUS_LABELS,
  invoiceErrorMessage,
  invoicePath,
  periodSharePath,
} from './invoice-ui';

const PREVIEW_TABLE_ID = 'billing-list';
const DRAFT_TABLE_ID = 'draft-list';

/**
 * O-20 Lập hoá đơn kỳ M: check (preview) → create drafts → issue selected drafts.
 * `period` is the invoice period M; utilities are the consumption of M−1.
 */
export default function BillingRunPage() {
  const { buildingId } = useActiveBuilding();
  const [params, setParams] = useSearchParams();
  const raw = params.get('period');
  const period = isPeriod(raw) ? raw : todayIsoDate().slice(0, 7);

  return (
    <div className="grid min-w-0 gap-5">
      <ScreenHeader
        title={`Lập hoá đơn kỳ ${displayPeriod(period)}`}
        description="Tiền phòng và dịch vụ tháng M, điện nước tháng M−1. Kiểm tra → tạo bản nháp → phát hành."
        action={
          <PeriodPicker
            label="Kỳ hoá đơn"
            value={period}
            className="w-full sm:w-48"
            onChange={(value) => {
              if (isPeriod(value)) setParams({ period: value }, { replace: true });
            }}
          />
        }
      />
      {!buildingId ? (
        <p>Chọn toà nhà để lập hoá đơn.</p>
      ) : (
        <BillingRun key={`${buildingId}:${period}`} buildingId={buildingId} period={period} />
      )}
    </div>
  );
}

function BillingRun({ buildingId, period }: { buildingId: string; period: string }) {
  const preview = useBillingPreview(buildingId, period);
  const createDrafts = useCreateInvoiceDrafts();
  const canCreate = useCanOn('create', 'Invoice', { buildingId });
  const canShare = useCanOn('update', 'Invoice', { buildingId });
  const [error, setError] = useState<string | null>(null);

  const data = preview.data;
  const issued =
    data?.rows.filter(
      (row) =>
        row.invoiceStatus !== null && row.invoiceStatus !== 'draft' && row.invoiceStatus !== 'void',
    ).length ?? 0;

  const generate = async () => {
    setError(null);
    try {
      // A fresh key per click: a retried request of the same click replays, a new click refreshes.
      const result = await createDrafts.mutateAsync({
        buildingId,
        period,
        idempotencyKey: crypto.randomUUID(),
      });

      toast.success(
        `Đã tạo ${result.created} bản nháp, làm mới ${result.refreshed} bản nháp kỳ ${displayPeriod(period)}.`,
      );
    } catch (cause) {
      setError(invoiceErrorMessage(cause, 'Không thể tạo bản nháp.'));
    }
  };

  return (
    <>
      <section aria-labelledby="billing-check-title" className="grid min-w-0 gap-3">
        <h2 id="billing-check-title" className="text-section font-semibold">
          Bước 1 – Kiểm tra
        </h2>
        {preview.isPending ? (
          <LoadingRows />
        ) : preview.isError ? (
          <LoadError error={preview.error} onRetry={() => void preview.refetch()} />
        ) : data ? (
          <>
            <p className="text-ui-sm text-muted">
              Điện nước tháng {displayPeriod(data.utilityPeriod)} · Phát hành{' '}
              {displayDate(data.issueDate)} · Hạn {displayDate(data.dueDate)}
            </p>
            <KpiGrid columns={3} data-testid="billing-summary">
              <KpiCard
                label="Đủ điều kiện"
                value={data.eligibleCount}
                icon="clipboardText"
                tone="success"
                compact
              />
              <KpiCard
                label="Bị loại"
                value={data.excludedCount}
                icon="clipboardText"
                tone={data.excludedCount ? 'warning' : 'neutral'}
                compact
              />
              <KpiCard
                label="Tổng dự kiến"
                value={formatVnd(data.expectedTotal)}
                icon="receipt"
                tone="brand"
                compact
              />
            </KpiGrid>
            {data.rows.length ? (
              <PreviewRows rows={data.rows} />
            ) : (
              <p className="text-muted">Không có hợp đồng nào cần lập hoá đơn trong kỳ này.</p>
            )}
          </>
        ) : null}
      </section>

      <section aria-labelledby="billing-drafts-title" className="grid min-w-0 gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="billing-drafts-title" className="text-section font-semibold">
            Bước 2 – Bản nháp
          </h2>
          {canCreate ? (
            <Button
              loading={createDrafts.isPending}
              disabled={!data?.eligibleCount}
              onClick={() => void generate()}
            >
              <Icon name="plus" className="size-4" aria-hidden />
              Tạo bản nháp
            </Button>
          ) : null}
        </div>
        <p className="text-ui-sm text-muted">
          Gọi lại an toàn: bản nháp được tính lại, dòng thêm tay được giữ, hoá đơn đã phát hành
          không đổi.
        </p>
        <FormError message={error} />
        <Drafts buildingId={buildingId} period={period} />
      </section>

      {canShare && issued ? (
        <section
          aria-labelledby="billing-share-title"
          className="flex flex-wrap items-center justify-between gap-3 rounded-panel border border-line bg-surface p-4"
        >
          <div className="grid gap-1">
            <h2 id="billing-share-title" className="text-section font-semibold">
              Bước 4 – Gửi hoá đơn
            </h2>
            <p className="text-ui-sm text-muted">
              {issued} hoá đơn đã phát hành: tạo link và ảnh hoá đơn của từng phòng để gửi lần lượt.
            </p>
          </div>
          <Link className="font-semibold text-accent underline" to={periodSharePath(period)}>
            Chia sẻ hàng loạt
          </Link>
        </section>
      ) : null}
    </>
  );
}

function ReasonCell({ row }: { row: BillingPreviewRow }) {
  if (row.eligible) return <span className="font-medium text-success-700">Đủ điều kiện</span>;
  const label = row.reason ? exclusionLabel(row.reason, row.reasonDetail) : 'Bị loại';

  return (
    <span className="grid gap-0.5">
      <span className="text-warning-700">{label}</span>
      {row.reason === 'missing_reading' ? (
        <Link
          className="text-accent underline"
          to={`/readings?period=${row.reasonDetail?.period ?? ''}`}
        >
          Chốt số tháng {displayPeriod(row.reasonDetail?.period ?? '')}
        </Link>
      ) : null}
    </span>
  );
}

function InvoiceCell({ row }: { row: BillingPreviewRow }) {
  if (!row.invoiceId || !row.invoiceStatus) return <span className="text-muted">—</span>;
  return (
    <Link className="text-accent underline" to={invoicePath(row.invoiceId)}>
      {INVOICE_STATUS_LABELS[row.invoiceStatus]}
    </Link>
  );
}

const previewColumns: ColumnDef<BillingPreviewRow, unknown>[] = [
  { id: 'roomCode', header: 'Phòng', accessorFn: (row) => row.roomCode },
  {
    id: 'contract',
    header: 'Hợp đồng',
    cell: ({ row }) => (
      <Link
        className="whitespace-nowrap text-accent underline"
        to={`/contracts/${row.original.contractId}`}
      >
        {row.original.contractCode}
      </Link>
    ),
  },
  { id: 'check', header: 'Kiểm tra', cell: ({ row }) => <ReasonCell row={row.original} /> },
  { id: 'invoice', header: 'Hoá đơn', cell: ({ row }) => <InvoiceCell row={row.original} /> },
  {
    id: 'total',
    header: 'Tổng dự kiến',
    cell: ({ row }) => (
      <span className="whitespace-nowrap">
        {row.original.total === null ? '—' : formatVnd(row.original.total)}
      </span>
    ),
  },
];

/** Every contract of the period on one page (no paging): a client-side DataTable. */
function PreviewRows({ rows }: { rows: BillingPreviewRow[] }) {
  const isDesktop = useIsDesktop();

  if (!isDesktop)
    return (
      <ul className="grid gap-3" aria-label="Kiểm tra hợp đồng">
        {rows.map((row) => (
          <li
            key={row.contractId}
            className="grid gap-1 rounded-panel border border-line bg-surface p-4"
            data-testid={rowTestId(PREVIEW_TABLE_ID, row.contractId)}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <strong>Phòng {row.roomCode}</strong>
              <span>{row.total === null ? '—' : formatVnd(row.total)}</span>
            </div>
            <Link className="text-ui-sm text-accent underline" to={`/contracts/${row.contractId}`}>
              {row.contractCode}
            </Link>
            <ReasonCell row={row} />
            {row.invoiceId ? (
              <span className="text-ui-sm">
                Hoá đơn: <InvoiceCell row={row} />
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    );

  return (
    <DataTable<BillingPreviewRow>
      caption="Kiểm tra hợp đồng"
      rows={rows}
      columns={previewColumns}
      rowId={(row) => row.contractId}
      data-testid={PREVIEW_TABLE_ID}
    />
  );
}

function Drafts({ buildingId, period }: { buildingId: string; period: string }) {
  const canIssue = useCanOn('issue', 'Invoice', { buildingId });
  const issue = useIssueInvoices();
  const [state, setState] = useState<DataTableState>({
    sorting: [],
    pagination: { pageIndex: 0, pageSize: 100 },
  });
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const query = useInvoices({
    buildingId,
    period,
    kind: 'monthly',
    status: 'draft',
    page: state.pagination.pageIndex + 1,
    pageSize: state.pagination.pageSize,
    sortBy: 'createdAt',
    sortOrder: 'asc',
  });

  const drafts = query.data?.data ?? [];
  const known = new Map<string, StayInvoiceSummary>(drafts.map((row) => [row.id, row]));
  const chosen = [...selected].filter((id) => known.has(id));
  const chosenTotal = chosen.reduce((sum, id) => sum + (known.get(id)?.total ?? 0), 0);
  const allChosen = drafts.length > 0 && chosen.length === drafts.length;

  const toggle = (id: string, on: boolean) =>
    setSelected((current) => {
      const next = new Set(current);

      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const confirmIssue = async () => {
    setError(null);
    try {
      const result = await issue.mutateAsync({ ids: chosen });

      toast.success(`Đã phát hành ${result.count} hoá đơn, tổng ${formatVnd(result.total)}.`);
      setSelected(new Set());
    } catch (cause) {
      setError(invoiceErrorMessage(cause, 'Không thể phát hành hoá đơn.'));
    }
    setConfirm(false);
  };

  const controller = useDataTable<StayInvoiceSummary>({
    caption: 'Bản nháp',
    mode: 'server',
    rows: drafts,
    rowCount: query.data?.meta.total ?? 0,
    // Keep the page height only once rows exist (not the first load's skeleton).
    preservePageHeight: (query.data?.meta.total ?? 0) > 0,
    columns: draftColumns(selected, toggle),
    rowId: (row) => row.id,
    state,
    onStateChange: setState,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    loading: query.isPending,
    classNames: { row: 'has-[[aria-checked=true]]:bg-selected' },
    'data-testid': DRAFT_TABLE_ID,
  });

  if (query.isPending) return <LoadingRows rows={2} />;
  if (query.isError) return <LoadError error={query.error} onRetry={() => void query.refetch()} />;
  if (!drafts.length)
    return <p className="text-muted">Chưa có bản nháp kỳ {displayPeriod(period)}.</p>;

  return (
    <div className="grid min-w-0 gap-3">
      {/* Selection on the left, the bulk action on the right of the row above the list. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Checkbox
            label={`Chọn tất cả (${drafts.length})`}
            checked={allChosen ? true : chosen.length ? 'indeterminate' : false}
            onCheckedChange={(value) =>
              setSelected(value === true ? new Set(drafts.map((row) => row.id)) : new Set())
            }
          />
          {canIssue ? (
            <p role="status" className="text-ui-sm text-muted">
              Đã chọn {chosen.length} hoá đơn · tổng {formatVnd(chosenTotal)}
            </p>
          ) : null}
        </div>
        {canIssue ? (
          <Button disabled={!chosen.length} onClick={() => setConfirm(true)}>
            <Icon name="send" className="size-4" aria-hidden />
            Phát hành
          </Button>
        ) : null}
      </div>
      <ListTable
        controller={controller}
        refreshing={query.isFetching && !query.isPending}
        cards={(items) => (
          <ul className="grid gap-2" aria-label="Bản nháp">
            {items.map((draft) => (
              <li
                key={draft.id}
                className={cn(
                  'flex flex-wrap items-center justify-between gap-3 rounded-panel border p-3',
                  selected.has(draft.id)
                    ? 'border-brand-700 bg-selected'
                    : 'border-line bg-surface',
                )}
                data-testid={rowTestId(DRAFT_TABLE_ID, draft.id)}
              >
                <DraftCheckbox draft={draft} selected={selected} onToggle={toggle} />
                <div className="flex flex-wrap items-center gap-3">
                  <strong className="whitespace-nowrap">{formatVnd(draft.total)}</strong>
                  <DraftLink draft={draft} />
                </div>
              </li>
            ))}
          </ul>
        )}
      />
      <FormError message={error} />
      <AlertDialog
        open={confirm}
        onOpenChange={(open) => {
          if (!open && !issue.isPending) setConfirm(false);
        }}
        title="Phát hành hoá đơn?"
        description={`Phát hành ${chosen.length} hoá đơn, tổng ${formatVnd(chosenTotal)}. Hoá đơn được cấp mã, khoá chỉ số và không tính lại.`}
        confirmLabel="Phát hành"
        cancelLabel="Quay lại"
        closeOnConfirm={false}
        confirmLoading={issue.isPending}
        onConfirm={() => void confirmIssue()}
      />
    </div>
  );
}

type DraftToggle = (id: string, on: boolean) => void;

/**
 * Selection keeps its own labelled checkbox ("Phòng 101 · HĐ…") rather than DataTable
 * `selectable`, whose row checkbox is named after the row id and adds a second selection bar.
 */
function DraftCheckbox({
  draft,
  selected,
  onToggle,
}: {
  draft: StayInvoiceSummary;
  selected: ReadonlySet<string>;
  onToggle: DraftToggle;
}) {
  return (
    <Checkbox
      label={`Phòng ${draft.roomCode} · ${draft.contractCode}`}
      checked={selected.has(draft.id)}
      onCheckedChange={(value) => onToggle(draft.id, value === true)}
    />
  );
}

function DraftLink({ draft }: { draft: StayInvoiceSummary }) {
  return (
    <Link className="whitespace-nowrap text-accent underline" to={invoicePath(draft.id)}>
      Xem nháp phòng {draft.roomCode}
    </Link>
  );
}

function draftColumns(
  selected: ReadonlySet<string>,
  onToggle: DraftToggle,
): ColumnDef<StayInvoiceSummary, unknown>[] {
  return [
    {
      id: 'draft',
      header: 'Phòng · Hợp đồng',
      cell: ({ row }) => (
        <DraftCheckbox draft={row.original} selected={selected} onToggle={onToggle} />
      ),
    },
    {
      id: 'total',
      header: 'Tổng',
      meta: { align: 'right' },
      cell: ({ row }) => (
        <strong className="whitespace-nowrap">{formatVnd(row.original.total)}</strong>
      ),
    },
    {
      id: 'link',
      header: () => <span className="sr-only">Xem nháp</span>,
      cell: ({ row }) => <DraftLink draft={row.original} />,
    },
  ];
}
