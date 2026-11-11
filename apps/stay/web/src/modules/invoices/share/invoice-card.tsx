import { Alert, Button, cn, Tag } from '@itclabs/react-ui';
import type { PublicInvoice } from '@stay/shared';
import { QRCodeSVG } from 'qrcode.react';
import { type Ref, useId } from 'react';
import { displayDate, formatVnd } from '@/libraries/format';
import {
  displayPeriod,
  INVOICE_KIND_LABELS,
  lineFormula,
  lineReadings,
  useLineDescription,
} from '../invoice-ui';
import { copyWithToast } from './share-tools';

/** Status as the tenant reads it ("Đã thanh toán" when nothing is left). */
function PublicStatusTag({ invoice }: { invoice: PublicInvoice }) {
  if (invoice.remaining === 0)
    return (
      <Tag tone="success" size="sm" data-status="paid">
        Đã thanh toán
      </Tag>
    );
  if (invoice.overdue)
    return (
      <Tag tone="danger" size="sm" data-status="overdue">
        Quá hạn
      </Tag>
    );
  return invoice.status === 'partially_paid' ? (
    <Tag tone="warning" size="sm" data-status="partially_paid">
      Thanh toán một phần
    </Tag>
  ) : (
    <Tag tone="info" size="sm" data-status="issued">
      Chưa thanh toán
    </Tag>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  return (
    <span data-image-exclude="" className="print:hidden">
      <Button
        variant="ghost"
        size="sm"
        aria-label={`Sao chép ${label}`}
        onClick={() => void copyWithToast(value, label)}
      >
        Sao chép
      </Button>
    </span>
  );
}

function PayField({
  label,
  value,
  copy,
  testId,
}: {
  label: string;
  value: string;
  /** Name of the value in the "Sao chép …" button; no button when omitted. */
  copy?: string;
  testId?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
      <dt className="text-muted">{label}</dt>
      <dd className="flex min-w-0 items-center gap-1">
        <span className="font-semibold break-all text-ink" data-testid={testId}>
          {value}
        </span>
        {copy ? <CopyButton value={value} label={copy} /> : null}
      </dd>
    </div>
  );
}

function TotalRow({
  label,
  value,
  strong,
  testId,
}: {
  label: string;
  value: number;
  strong?: boolean;
  testId?: string;
}) {
  return (
    <div className={cn('flex justify-between gap-3', strong && 'font-bold')}>
      <dt>{label}</dt>
      <dd className="whitespace-nowrap" data-testid={testId}>
        {formatVnd(value)}
      </dd>
    </div>
  );
}

/** Payment block: "Đã thanh toán", or the VietQR code with the transfer details. */
function PaymentBlock({ invoice, copyable }: { invoice: PublicInvoice; copyable: boolean }) {
  const { payee, remaining } = invoice;

  if (remaining === 0)
    return (
      <Alert tone="success" title="Đã thanh toán" data-testid="public-invoice-paid">
        Hoá đơn đã được thanh toán đủ {formatVnd(invoice.total)}. Cảm ơn bạn!
      </Alert>
    );
  if (!payee)
    return (
      <p className="text-muted">
        Còn lại {formatVnd(remaining)}. Liên hệ chủ trọ để biết thông tin chuyển khoản.
      </p>
    );

  return (
    <div className="grid gap-4 sm:flex sm:items-start">
      {invoice.vietQrPayload ? (
        <div
          role="img"
          aria-label={`Mã VietQR chuyển khoản ${formatVnd(remaining)}`}
          className="justify-self-center rounded-control border border-line bg-surface p-2 text-ink"
          data-testid="public-invoice-qr"
          data-payload={invoice.vietQrPayload}
        >
          <QRCodeSVG
            value={invoice.vietQrPayload}
            size={192}
            level="M"
            marginSize={2}
            fgColor="currentColor"
            aria-hidden
          />
        </div>
      ) : null}
      <dl className="grid min-w-0 flex-1 gap-2 text-ui-sm">
        <PayField
          label="Ngân hàng"
          value={
            payee.bankShortName
              ? `${payee.bankShortName}${payee.bankName ? ` · ${payee.bankName}` : ''}`
              : payee.bankBin
          }
        />
        <PayField
          label="Số tài khoản"
          value={payee.accountNumber}
          copy={copyable ? 'số tài khoản' : undefined}
          testId="public-invoice-account"
        />
        <PayField
          label="Chủ tài khoản"
          value={payee.accountName}
          copy={copyable ? 'tên chủ tài khoản' : undefined}
        />
        <PayField
          label="Số tiền"
          value={formatVnd(remaining)}
          copy={copyable ? 'số tiền' : undefined}
        />
        <PayField
          label="Nội dung"
          value={invoice.transferContent}
          copy={copyable ? 'nội dung chuyển khoản' : undefined}
          testId="public-invoice-content"
        />
      </dl>
    </div>
  );
}

/**
 * The shared invoice (T-01) as the tenant sees it: on the public page (with copy buttons) and
 * rendered to the downloadable PNG. Only `PublicInvoice` data: no personal data or internal ids.
 */
export function InvoiceCard({
  invoice,
  copyable = false,
  headingLevel = 1,
  ref,
}: {
  invoice: PublicInvoice;
  copyable?: boolean;
  /** `2` when the card is rendered off-screen inside another page. */
  headingLevel?: 1 | 2;
  ref?: Ref<HTMLElement>;
}) {
  const titleId = useId();
  const describe = useLineDescription();

  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  const lines = invoice.lines.filter((line) => line.type !== 'rounding');

  return (
    <article
      ref={ref}
      aria-labelledby={titleId}
      className="grid min-w-0 gap-4 rounded-panel border border-line bg-surface p-4 text-ink sm:p-6 print:border-0 print:p-0"
      data-testid="public-invoice"
    >
      <header className="grid gap-1">
        <p className="font-semibold">{invoice.buildingName}</p>
        {invoice.buildingAddress ? (
          <p className="text-ui-sm text-muted">{invoice.buildingAddress}</p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Heading id={titleId} className="text-heading font-bold">
            Hoá đơn tiền phòng
          </Heading>
          <PublicStatusTag invoice={invoice} />
        </div>
        <p>
          Mã{' '}
          <strong className="break-all" data-testid="public-invoice-code">
            {invoice.code}
          </strong>
        </p>
        <p>
          Phòng <strong>{invoice.roomCode}</strong> · Kỳ {displayPeriod(invoice.period)} ·{' '}
          {INVOICE_KIND_LABELS[invoice.kind]}
        </p>
        <p className="text-ui-sm text-muted">
          {invoice.issuedOn ? `Phát hành ${displayDate(invoice.issuedOn)} · ` : ''}Hạn thanh toán{' '}
          {displayDate(invoice.dueOn)}
          {invoice.representative ? ` · Người đại diện ${invoice.representative}` : ''}
        </p>
      </header>

      <ul className="grid divide-y divide-line border-y border-line" aria-label="Các khoản">
        {lines.map((line, index) => {
          const formula = lineFormula(line);
          const readings = lineReadings(line);

          return (
            <li
              // Lines have no id in the public DTO; their order is fixed by the snapshot.
              key={index}
              className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 py-2"
            >
              <div className="grid min-w-0 flex-1 gap-0.5 break-words">
                <p className="font-medium">{describe(line)}</p>
                {formula ? <p className="text-ui-sm text-muted">{formula}</p> : null}
                {readings ? <p className="text-ui-sm text-muted">{readings}</p> : null}
              </div>
              <strong className="whitespace-nowrap">{formatVnd(line.amount)}</strong>
            </li>
          );
        })}
      </ul>

      <dl className="grid gap-1">
        {invoice.rounding !== 0 ? (
          <>
            <TotalRow label="Tạm tính" value={invoice.subtotal} />
            <TotalRow label="Làm tròn" value={invoice.rounding} />
          </>
        ) : null}
        <TotalRow label="Tổng" value={invoice.total} strong />
        <TotalRow label="Đã thanh toán" value={invoice.paidTotal} />
        <TotalRow
          label="Còn lại"
          value={invoice.remaining}
          strong
          testId="public-invoice-remaining"
        />
      </dl>

      <section aria-label="Thanh toán" className="grid gap-3 border-t border-line pt-4">
        <PaymentBlock invoice={invoice} copyable={copyable} />
      </section>
    </article>
  );
}
