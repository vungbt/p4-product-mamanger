import { AlertDialog, Button, Checkbox, cn } from '@itclabs/react-ui';
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
import { ScreenHeader } from '@/libraries/screen-header';
import { useIsDesktop } from '@/libraries/use-media-query';
import {
  displayPeriod,
  exclusionLabel,
  INVOICE_STATUS_LABELS,
  invoiceErrorMessage,
  invoicePath,
  periodSharePath,
} from './invoice-ui';

const DRAFT_PAGE_SIZE = 100;

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
            <div
              className="grid gap-3 rounded-panel border border-line bg-surface p-4 sm:grid-cols-3"
              data-testid="billing-summary"
            >
              <p>
                Đủ điều kiện <strong className="block text-section">{data.eligibleCount}</strong>
              </p>
              <p>
                Bị loại <strong className="block text-section">{data.excludedCount}</strong>
              </p>
              <p>
                Tổng dự kiến{' '}
                <strong className="block text-section">{formatVnd(data.expectedTotal)}</strong>
              </p>
            </div>
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

function PreviewRows({ rows }: { rows: BillingPreviewRow[] }) {
  const isDesktop = useIsDesktop();

  if (!isDesktop)
    return (
      <ul className="grid gap-3" aria-label="Kiểm tra hợp đồng">
        {rows.map((row) => (
          <li
            key={row.contractId}
            className="grid gap-1 rounded-panel border border-line bg-surface p-4"
            data-testid="billing-row"
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
    <div className="min-w-0 relative overflow-x-auto rounded-panel border border-line bg-surface">
      <table className="w-full text-left" aria-label="Kiểm tra hợp đồng">
        <thead>
          <tr>
            {['Phòng', 'Hợp đồng', 'Kiểm tra', 'Hoá đơn', 'Tổng dự kiến'].map((label) => (
              <th key={label} scope="col" className="whitespace-nowrap p-3">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.contractId} className="border-t border-line" data-testid="billing-row">
              <td className="p-3">{row.roomCode}</td>
              <td className="whitespace-nowrap p-3">
                <Link className="text-accent underline" to={`/contracts/${row.contractId}`}>
                  {row.contractCode}
                </Link>
              </td>
              <td className="p-3">
                <ReasonCell row={row} />
              </td>
              <td className="p-3">
                <InvoiceCell row={row} />
              </td>
              <td className="whitespace-nowrap p-3">
                {row.total === null ? '—' : formatVnd(row.total)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Drafts({ buildingId, period }: { buildingId: string; period: string }) {
  const canIssue = useCanOn('issue', 'Invoice', { buildingId });
  const issue = useIssueInvoices();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const query = useInvoices({
    buildingId,
    period,
    kind: 'monthly',
    status: 'draft',
    page,
    pageSize: DRAFT_PAGE_SIZE,
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

  if (query.isPending) return <LoadingRows rows={2} />;
  if (query.isError) return <LoadError error={query.error} onRetry={() => void query.refetch()} />;
  if (!drafts.length)
    return <p className="text-muted">Chưa có bản nháp kỳ {displayPeriod(period)}.</p>;

  const totalPages = query.data?.meta.totalPages ?? 1;

  return (
    <div className="grid min-w-0 gap-3">
      <Checkbox
        label={`Chọn tất cả (${drafts.length})`}
        checked={allChosen ? true : chosen.length ? 'indeterminate' : false}
        onCheckedChange={(value) =>
          setSelected(value === true ? new Set(drafts.map((row) => row.id)) : new Set())
        }
      />
      <ul className="grid gap-2" aria-label="Bản nháp">
        {drafts.map((draft) => (
          <li
            key={draft.id}
            className={cn(
              'flex flex-wrap items-center justify-between gap-3 rounded-panel border p-3',
              selected.has(draft.id) ? 'border-brand-700 bg-selected' : 'border-line bg-surface',
            )}
            data-testid="draft-row"
          >
            <Checkbox
              label={`Phòng ${draft.roomCode} · ${draft.contractCode}`}
              checked={selected.has(draft.id)}
              onCheckedChange={(value) => toggle(draft.id, value === true)}
            />
            <div className="flex flex-wrap items-center gap-3">
              <strong className="whitespace-nowrap">{formatVnd(draft.total)}</strong>
              <Link className="text-accent underline" to={invoicePath(draft.id)}>
                Xem nháp phòng {draft.roomCode}
              </Link>
            </div>
          </li>
        ))}
      </ul>
      {totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button
            variant="secondary"
            disabled={page <= 1 || query.isFetching}
            onClick={() => setPage(page - 1)}
          >
            Trước
          </Button>
          <span>
            Trang {page}/{totalPages}
          </span>
          <Button
            variant="secondary"
            disabled={page >= totalPages || query.isFetching}
            onClick={() => setPage(page + 1)}
          >
            Sau
          </Button>
        </div>
      ) : null}
      <FormError message={error} />
      {canIssue ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-panel border border-line bg-surface p-4">
          <p role="status">
            Đã chọn {chosen.length} hoá đơn · tổng {formatVnd(chosenTotal)}
          </p>
          <Button disabled={!chosen.length} onClick={() => setConfirm(true)}>
            Phát hành
          </Button>
        </div>
      ) : null}
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
