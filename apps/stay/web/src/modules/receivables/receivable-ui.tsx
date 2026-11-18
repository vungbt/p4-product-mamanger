import { cn, Icon, IconButton, Tag, type TagTone } from '@itclabs/react-ui';
import type { ReceivableBucket, ReceivableInvoice, StayReceivable } from '@stay/shared';
import { Link } from 'react-router-dom';
import { displayDate, formatVnd } from '@/libraries/format';
import { displayExpiry, displayPeriod, invoicePath } from '../invoices/invoice-ui';
import { formatPhone } from '../tenants/tenant-ui';

export const BUCKET_LABELS: Record<ReceivableBucket, string> = {
  not_due: 'Chưa tới hạn',
  '1_7': 'Quá hạn 1–7 ngày',
  '8_30': 'Quá hạn 8–30 ngày',
  over_30: 'Quá hạn > 30 ngày',
};

const BUCKET_TONES: Record<ReceivableBucket, TagTone> = {
  not_due: 'neutral',
  '1_7': 'info',
  '8_30': 'warning',
  over_30: 'danger',
};

/** Days overdue with the tone of its bucket ("Chưa tới hạn" when nothing is overdue). */
export function OverdueTag({ row }: { row: Pick<StayReceivable, 'bucket' | 'overdueDays'> }) {
  return (
    <Tag tone={BUCKET_TONES[row.bucket]} size="sm" data-bucket={row.bucket}>
      {row.overdueDays > 0 ? `Quá hạn ${row.overdueDays} ngày` : BUCKET_LABELS.not_due}
    </Tag>
  );
}

export type RowActions = {
  /** "Thu tiền": the contract's unpaid invoices, `invoiceId` preselected (default: oldest). */
  onCollect?: (row: StayReceivable, invoiceId?: string) => void;
  /** "Gửi lại link" of one invoice (default: the oldest unpaid one). */
  onShare?: (row: StayReceivable, invoice: ReceivableInvoice) => void;
};

/** Thu tiền · Gọi · Gửi lại link, inline (at most three actions per row). */
export function ReceivableActions({
  row,
  onCollect,
  onShare,
}: RowActions & { row: StayReceivable }) {
  const oldest = row.invoices[0];
  const who = row.representativeName ?? `phòng ${row.roomCode}`;

  return (
    <div className="inline-flex shrink-0 items-center gap-1">
      {onCollect ? (
        <IconButton
          icon="moneyReceive"
          variant="ghost"
          size="sm"
          label={`Thu tiền phòng ${row.roomCode}`}
          onClick={() => onCollect(row)}
        />
      ) : null}
      {row.representativePhone ? (
        <a
          href={`tel:${row.representativePhone}`}
          className="inline-flex size-8 items-center justify-center rounded-control text-accent hover:bg-hover"
          aria-label={`Gọi ${who} (${formatPhone(row.representativePhone)})`}
        >
          <Icon name="phone" className="size-4" aria-hidden />
        </a>
      ) : null}
      {onShare && oldest ? (
        <IconButton
          icon="message"
          variant="ghost"
          size="sm"
          label={`Gửi lại link hoá đơn ${oldest.code ?? ''} phòng ${row.roomCode}`}
          onClick={() => onShare(row, oldest)}
        />
      ) : null}
    </div>
  );
}

/** The unpaid invoices of a row (expanded): link, period, due date, remaining, link status. */
export function ReceivableInvoices({
  row,
  onCollect,
  onShare,
}: RowActions & { row: StayReceivable }) {
  return (
    <ul className="grid gap-2" aria-label={`Hoá đơn chưa thu đủ phòng ${row.roomCode}`}>
      {row.invoices.map((invoice) => (
        <li
          key={invoice.id}
          className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-control border border-line bg-canvas px-3 py-2"
          data-testid="receivable-invoice"
        >
          <div className="grid min-w-0 gap-0.5">
            <Link className="font-semibold text-accent underline" to={invoicePath(invoice.id)}>
              {invoice.code ?? 'Hoá đơn'}
            </Link>
            <span className="text-ui-sm text-muted">
              Kỳ {displayPeriod(invoice.period)} · hạn {displayDate(invoice.dueOn)}
              {invoice.overdueDays > 0 ? ` · quá hạn ${invoice.overdueDays} ngày` : ''}
            </span>
            <span className="text-ui-sm text-muted">
              {invoice.shareExpiresAt
                ? `Link đến ${displayExpiry(invoice.shareExpiresAt)}`
                : 'Chưa gửi link'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span
              className={cn(
                'whitespace-nowrap font-semibold',
                invoice.overdueDays > 0 && 'text-danger-700',
              )}
            >
              {formatVnd(invoice.remaining)}
            </span>
            {onCollect ? (
              <IconButton
                icon="moneyReceive"
                variant="ghost"
                size="sm"
                label={`Thu tiền hoá đơn ${invoice.code ?? ''}`}
                onClick={() => onCollect(row, invoice.id)}
              />
            ) : null}
            {onShare ? (
              <IconButton
                icon="message"
                variant="ghost"
                size="sm"
                label={`Gửi lại link hoá đơn ${invoice.code ?? ''}`}
                onClick={() => onShare(row, invoice)}
              />
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
