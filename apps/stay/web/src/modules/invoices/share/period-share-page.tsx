import { AlertDialog, Button, EmptyState, Icon } from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import { useInvoices, useSharePeriodInvoices } from '@stay/sdk/react';
import { type InvoicePeriodShareResult, type InvoiceStatus, isPeriod } from '@stay/shared';
import { type ReactNode, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useActiveBuilding } from '@/libraries/buildings/building-provider';
import { FilterBar } from '@/libraries/filter-bar';
import { formatVnd, todayIsoDate } from '@/libraries/format';
import { FormError, LoadError, LoadingRows } from '@/libraries/forms/page-states';
import { PeriodPicker } from '@/libraries/forms/period-picker';
import { ScreenHeader } from '@/libraries/screen-header';
import { latestSearchParams } from '@/libraries/search-params';
import {
  displayExpiry,
  displayPeriod,
  INVOICE_STATUS_LABELS,
  invoiceErrorMessage,
  invoicePath,
} from '../invoice-ui';
import { InvoicePreviewButton } from './invoice-preview';
import { ShareLinkActions } from './share-dialog';
import { copyWithToast } from './share-tools';

/** At most one page of a building's invoices of a period is listed before sharing. */
const PAGE_SIZE = 100;

const SHAREABLE: InvoiceStatus[] = ['issued', 'partially_paid', 'paid'];

/**
 * "Chia sẻ hàng loạt" (O-20 after issuing, O-21 for a period): one link per room of the period,
 * to send one by one (copy / share / image).
 */
export default function PeriodSharePage() {
  const { buildingId } = useActiveBuilding();
  const [params, setParams] = useSearchParams();

  const raw = params.get('period');
  const period = isPeriod(raw) ? raw : todayIsoDate().slice(0, 7);

  const picker = (
    <PeriodPicker
      label="Kỳ hoá đơn"
      value={period}
      onChange={(value) => {
        if (!isPeriod(value)) return;

        setParams(
          () => {
            const next = latestSearchParams();

            next.set('period', value);
            return next;
          },
          { replace: true },
        );
      }}
    />
  );

  return (
    <div className="grid min-w-0 gap-5">
      <ScreenHeader
        title={`Chia sẻ kỳ ${displayPeriod(period)}`}
        description="Tạo link xem hoá đơn (có mã VietQR số tiền còn lại) cho từng phòng rồi gửi lần lượt qua Zalo hoặc tin nhắn."
      />
      {!buildingId ? (
        <>
          <FilterBar>{picker}</FilterBar>
          <p>Chọn toà nhà để chia sẻ hoá đơn.</p>
        </>
      ) : (
        <PeriodShares
          key={`${buildingId}:${period}`}
          buildingId={buildingId}
          period={period}
          filters={picker}
        />
      )}
    </div>
  );
}

/** The period's invoices (or the links just created) under a toolbar with the period actions. */
function PeriodShares({
  buildingId,
  period,
  filters,
}: {
  buildingId: string;
  period: string;
  filters: ReactNode;
}) {
  const query = useInvoices({
    buildingId,
    period,
    page: 1,
    pageSize: PAGE_SIZE,
    sortBy: 'code',
    sortOrder: 'asc',
  });
  const sharePeriod = useSharePeriodInvoices();
  const [result, setResult] = useState<InvoicePeriodShareResult | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shareable = (query.data?.data ?? []).filter((row) => SHAREABLE.includes(row.status));
  const active = shareable.filter((row) => row.shareExpiresAt).length;

  const generate = async () => {
    setError(null);
    try {
      // A fresh key per click: a retried request of the same click returns the same links.
      const data = await sharePeriod.mutateAsync({
        buildingId,
        period,
        idempotencyKey: crypto.randomUUID(),
      });

      setResult(data);
      toast.success(`Đã tạo ${data.count} link chia sẻ kỳ ${displayPeriod(period)}.`);
    } catch (cause) {
      setError(invoiceErrorMessage(cause, 'Không tạo được link chia sẻ.'));
    }
    setConfirm(false);
  };

  const copyAll = () => {
    if (!result) return;
    const text = result.links
      .map(
        (link) =>
          `Phòng ${link.roomCode} · ${link.code} · còn lại ${formatVnd(link.remaining)}: ${link.url}`,
      )
      .join('\n');

    void copyWithToast(text, 'tất cả link');
  };

  const actions = result?.links.length ? (
    <Button variant="secondary" onClick={copyAll}>
      <Icon name="copy" className="size-4" aria-hidden />
      Sao chép tất cả
    </Button>
  ) : !result && shareable.length ? (
    <Button
      loading={sharePeriod.isPending}
      onClick={() => (active ? setConfirm(true) : void generate())}
    >
      <Icon name="link" className="size-4" aria-hidden />
      Tạo link cho cả kỳ
    </Button>
  ) : null;

  let content: ReactNode;

  if (query.isPending) content = <LoadingRows rows={3} />;
  else if (query.isError)
    content = <LoadError error={query.error} onRetry={() => void query.refetch()} />;
  else if (result)
    content = (
      <section aria-labelledby="period-share-links" className="grid min-w-0 gap-3">
        <h2 id="period-share-links" className="text-section font-semibold">
          {result.count} link · hết hạn{' '}
          {result.links[0] ? displayExpiry(result.links[0].expiresAt) : ''}
        </h2>
        <p className="text-ui-sm text-muted">
          Link chỉ hiện một lần. Tạo lại link cho kỳ sẽ làm các link này hết hiệu lực.
        </p>
        <ul className="grid gap-3" aria-label="Link chia sẻ theo phòng">
          {result.links.map((link) => (
            <li
              key={link.invoiceId}
              className="grid min-w-0 gap-2 rounded-panel border border-line bg-surface p-4"
              data-testid="period-share-row"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p>
                  Phòng <strong>{link.roomCode}</strong> ·{' '}
                  <Link className="text-accent underline" to={invoicePath(link.invoiceId)}>
                    {link.code}
                  </Link>
                </p>
                <p className="text-ui-sm">
                  Còn lại <strong>{formatVnd(link.remaining)}</strong> / {formatVnd(link.total)}
                </p>
              </div>
              <p className="text-ui-sm break-all text-muted">{link.url}</p>
              <ShareLinkActions
                invoice={{ code: link.code, roomCode: link.roomCode, period }}
                link={link}
              />
            </li>
          ))}
        </ul>
      </section>
    );
  else if (!shareable.length)
    content = (
      <EmptyState
        title="Chưa có hoá đơn đã phát hành"
        description={`Phát hành hoá đơn kỳ ${displayPeriod(period)} trước khi chia sẻ.`}
      />
    );
  else
    content = (
      <section aria-labelledby="period-share-invoices" className="grid min-w-0 gap-3">
        <h2 id="period-share-invoices" className="text-section font-semibold">
          {shareable.length} hoá đơn đã phát hành
        </h2>
        <ul className="grid gap-2" aria-label="Hoá đơn của kỳ">
          {shareable.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-panel border border-line bg-surface p-3"
            >
              <p>
                Phòng <strong>{row.roomCode}</strong> · {row.code} ·{' '}
                {INVOICE_STATUS_LABELS[row.status]}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-ui-sm text-muted">
                  Còn lại {formatVnd(row.remaining)} ·{' '}
                  {row.shareExpiresAt
                    ? `Có link đến ${displayExpiry(row.shareExpiresAt)}`
                    : 'Chưa có link'}
                </p>
                <InvoicePreviewButton
                  invoiceId={row.id}
                  variant="ghost"
                  size="sm"
                  label={`Xem trước hoá đơn ${row.code ?? ''}`}
                  iconOnly
                />
              </div>
            </li>
          ))}
        </ul>
      </section>
    );

  return (
    <>
      <FilterBar actions={actions}>{filters}</FilterBar>
      <FormError message={error} />
      {content}
      <AlertDialog
        open={confirm}
        onOpenChange={(open) => {
          if (!open && !sharePeriod.isPending) setConfirm(false);
        }}
        title="Tạo link mới cho cả kỳ?"
        description={`${active} hoá đơn đã có link. Link đã gửi trước đó sẽ không còn mở được.`}
        confirmLabel="Tạo link mới"
        cancelLabel="Quay lại"
        closeOnConfirm={false}
        confirmLoading={sharePeriod.isPending}
        onConfirm={() => void generate()}
      />
    </>
  );
}
