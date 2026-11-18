import { AlertDialog, Button, cn, EmptyState, Icon, IconButton } from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import { useDeleteInvoiceLine, useInvoice, useIssueInvoices } from '@stay/sdk/react';
import {
  addDays,
  type InvoiceShareLink,
  type StayInvoice,
  type StayInvoiceLine,
  type StayPayment,
} from '@stay/shared';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCanOn } from '@/libraries/ability';
import { displayDate, formatVnd } from '@/libraries/format';
import { isNotFound } from '@/libraries/forms/api-errors';
import { FormError, LoadError, LoadingRows } from '@/libraries/forms/page-states';
import { PaymentDialog } from '../payments/payment-dialog';
import { isCollectable, PAYMENT_METHOD_LABELS, PaymentStatusTag } from '../payments/payment-ui';
import { ReversePaymentDialog } from '../payments/reverse-dialog';
import { InvoiceLineDialog, VoidInvoiceDialog } from './invoice-dialogs';
import {
  billingRunPath,
  displayExpiry,
  displayPeriod,
  INVOICE_KIND_LABELS,
  InvoiceStatusTag,
  invoiceErrorMessage,
  lineFormula,
  lineReadings,
  useLineDescription,
} from './invoice-ui';
import { ShareInvoiceDialog } from './share/share-dialog';

/** O-22 Chi tiết hoá đơn. */
export default function InvoiceDetailPage() {
  const { id = '' } = useParams();
  const query = useInvoice(id);

  if (query.isPending) return <LoadingRows />;
  if (!query.data)
    return isNotFound(query.error) ? (
      <EmptyState
        headingLevel={1}
        variant="not-found"
        title="Không tìm thấy hoá đơn"
        action={<Link to="/invoices">Về danh sách hoá đơn</Link>}
      />
    ) : (
      <LoadError error={query.error} onRetry={() => void query.refetch()} />
    );

  return <InvoiceDetail invoice={query.data} reload={() => void query.refetch()} />;
}

function InvoiceDetail({ invoice, reload }: { invoice: StayInvoice; reload: () => void }) {
  const record = { buildingId: invoice.buildingId, contractId: invoice.contractId };
  const canUpdate = useCanOn('update', 'Invoice', record);
  const canIssue = useCanOn('issue', 'Invoice', record);
  const canVoid = useCanOn('void', 'Invoice', record);
  const canPay = useCanOn('create', 'Payment', record);
  const canReverse = useCanOn('void', 'Payment', record);
  const issue = useIssueInvoices();
  const remove = useDeleteInvoiceLine();
  const describe = useLineDescription();
  const [dialog, setDialog] = useState<'line' | 'void' | 'issue' | 'payment' | 'share' | null>(
    null,
  );
  // A created link is shown once (only its hash is stored): keep it while the page is open.
  const [shareLink, setShareLink] = useState<InvoiceShareLink | null>(null);
  const [deleting, setDeleting] = useState<StayInvoiceLine | null>(null);
  const [reversing, setReversing] = useState<StayPayment | null>(null);
  const [error, setError] = useState<string | null>(null);

  const draft = invoice.status === 'draft';
  const shareable =
    canUpdate &&
    (invoice.status === 'issued' ||
      invoice.status === 'partially_paid' ||
      invoice.status === 'paid');
  const voidable = canVoid && (draft || invoice.status === 'issued') && invoice.paidTotal === 0;
  const lines = invoice.lines.filter((line) => line.type !== 'rounding');
  const title = invoice.code ?? 'Hoá đơn nháp';

  const confirmIssue = async () => {
    setError(null);
    try {
      const result = await issue.mutateAsync({ ids: [invoice.id] });
      const code = result.invoices[0]?.code;

      toast.success(code ? `Đã phát hành hoá đơn ${code}.` : 'Đã phát hành hoá đơn.');
      setDialog(null);
    } catch (cause) {
      setError(invoiceErrorMessage(cause, 'Không thể phát hành hoá đơn.'));
      setDialog(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setError(null);
    try {
      await remove.mutateAsync({ id: invoice.id, lineId: deleting.id });
      toast.success('Đã xoá dòng.');
    } catch (cause) {
      setError(invoiceErrorMessage(cause, 'Không thể xoá dòng.'));
    }
    setDeleting(null);
  };

  return (
    <div className="grid min-w-0 gap-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid min-w-0 gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-heading font-bold break-all" data-testid="invoice-code">
              {title}
            </h1>
            <InvoiceStatusTag invoice={invoice} />
          </div>
          <p>
            Phòng {invoice.roomCode} · Kỳ {displayPeriod(invoice.period)} ·{' '}
            {INVOICE_KIND_LABELS[invoice.kind]}
          </p>
          <p className="text-ui-sm text-muted">
            {invoice.issuedOn ? `Phát hành ${displayDate(invoice.issuedOn)} · ` : ''}Hạn{' '}
            {displayDate(invoice.dueOn)}
            {invoice.overdueFrom !== addDays(invoice.dueOn, 1)
              ? ` (quá hạn từ ${displayDate(invoice.overdueFrom)})`
              : ''}{' '}
            · Hợp đồng{' '}
            <Link className="text-accent underline" to={`/contracts/${invoice.contractId}`}>
              {invoice.contractCode}
            </Link>
            {invoice.shareExpiresAt ? (
              <span data-testid="invoice-share-status">
                {' '}
                · Link chia sẻ đến {displayExpiry(invoice.shareExpiresAt)}
              </span>
            ) : null}
          </p>
        </div>
        {/* Secondary and destructive actions first, the primary action (issue / collect) last. */}
        <div className="flex flex-wrap gap-2">
          {voidable ? (
            <Button variant="danger" onClick={() => setDialog('void')}>
              <Icon name="delete" className="size-4" aria-hidden />
              Void
            </Button>
          ) : null}
          {shareable ? (
            <Button variant="secondary" onClick={() => setDialog('share')}>
              <Icon name="share" className="size-4" aria-hidden />
              Chia sẻ
            </Button>
          ) : null}
          {draft && canUpdate ? (
            <Button variant="secondary" onClick={() => setDialog('line')}>
              <Icon name="plus" className="size-4" aria-hidden />
              Thêm phụ thu / giảm trừ
            </Button>
          ) : null}
          {draft && canIssue ? (
            <Button onClick={() => setDialog('issue')}>
              <Icon name="send" className="size-4" aria-hidden />
              Phát hành
            </Button>
          ) : null}
          {canPay && isCollectable(invoice) ? (
            <Button onClick={() => setDialog('payment')}>
              <Icon name="moneyReceive" className="size-4" aria-hidden />
              Thu tiền
            </Button>
          ) : null}
        </div>
      </header>

      <FormError message={error} />

      {invoice.status === 'void' ? (
        <section
          aria-label="Đã void"
          className="grid gap-1 rounded-panel border border-line bg-surface p-4"
        >
          <h2 className="font-semibold">Hoá đơn đã void</h2>
          {invoice.voidedAt ? (
            <p className="text-ui-sm text-muted">
              {new Intl.DateTimeFormat('vi-VN', {
                dateStyle: 'short',
                timeStyle: 'short',
                timeZone: 'Asia/Ho_Chi_Minh',
              }).format(new Date(invoice.voidedAt))}
            </p>
          ) : null}
          <p className="whitespace-pre-wrap break-words" data-testid="void-reason">
            Lý do: {invoice.voidReason}
          </p>
        </section>
      ) : null}

      <section
        aria-labelledby="invoice-lines-title"
        className="grid min-w-0 gap-3 rounded-panel border border-line bg-surface p-4 sm:p-5"
      >
        <h2 id="invoice-lines-title" className="text-section font-semibold">
          Các dòng hoá đơn
        </h2>
        <ul className="grid divide-y divide-line" aria-label="Dòng hoá đơn">
          {lines.map((line) => {
            const formula = lineFormula(line);
            const readings = lineReadings(line);

            return (
              <li
                key={line.id}
                className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 py-3"
                data-testid="invoice-line"
              >
                <div className="grid min-w-0 flex-1 gap-0.5 break-words">
                  <p className="font-medium text-ink">{describe(line)}</p>
                  {formula ? <p className="text-ui-sm text-muted">{formula}</p> : null}
                  {readings ? <p className="text-ui-sm text-muted">{readings}</p> : null}
                </div>
                <div className="flex items-center gap-1">
                  <strong className="whitespace-nowrap">{formatVnd(line.amount)}</strong>
                  {draft && canUpdate && line.manual ? (
                    <IconButton
                      icon="delete"
                      label={`Xoá dòng ${describe(line)}`}
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleting(line)}
                    />
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
        <dl className="grid gap-2 border-t border-line pt-3" data-testid="invoice-totals">
          <TotalRow label="Tạm tính" value={invoice.subtotal} />
          <TotalRow label="Làm tròn" value={invoice.rounding} />
          <TotalRow label="Tổng" value={invoice.total} strong />
          <TotalRow label="Đã thu" value={invoice.paidTotal} />
          <TotalRow label="Còn lại" value={invoice.remaining} strong danger={invoice.overdue} />
        </dl>
      </section>

      <section
        aria-labelledby="invoice-payments-title"
        className="grid gap-2 rounded-panel border border-line bg-surface p-4 sm:p-5"
      >
        <h2 id="invoice-payments-title" className="text-section font-semibold">
          Lịch sử thanh toán
        </h2>
        {invoice.payments.length ? (
          <ul className="grid divide-y divide-line" aria-label="Các khoản đã thu">
            {invoice.payments.map((payment) => (
              <PaymentRow
                key={payment.id}
                payment={payment}
                onReverse={
                  canReverse && payment.status === 'recorded' && payment.method !== 'deposit'
                    ? () => setReversing(payment)
                    : undefined
                }
              />
            ))}
          </ul>
        ) : (
          <p className="text-muted">Chưa có thanh toán.</p>
        )}
      </section>

      <div className="flex flex-wrap gap-4">
        <Link to="/invoices" className="font-semibold text-accent">
          Về danh sách hoá đơn
        </Link>
        {draft && invoice.kind === 'monthly' && canIssue ? (
          <Link to={billingRunPath(invoice.period)} className="font-semibold text-accent">
            Lập hoá đơn kỳ {displayPeriod(invoice.period)}
          </Link>
        ) : null}
      </div>

      {dialog === 'line' ? (
        <InvoiceLineDialog invoice={invoice} onClose={() => setDialog(null)} onReload={reload} />
      ) : null}
      {dialog === 'void' ? (
        <VoidInvoiceDialog invoice={invoice} onClose={() => setDialog(null)} onReload={reload} />
      ) : null}
      {dialog === 'payment' ? (
        <PaymentDialog invoice={invoice} onClose={() => setDialog(null)} />
      ) : null}
      {dialog === 'share' ? (
        <ShareInvoiceDialog
          invoice={invoice}
          link={shareLink}
          onLinkChange={setShareLink}
          onClose={() => setDialog(null)}
        />
      ) : null}
      {reversing ? (
        <ReversePaymentDialog payment={reversing} onClose={() => setReversing(null)} />
      ) : null}
      <AlertDialog
        open={dialog === 'issue'}
        onOpenChange={(open) => {
          if (!open && !issue.isPending) setDialog(null);
        }}
        title="Phát hành hoá đơn?"
        description={`Phát hành 1 hoá đơn, tổng ${formatVnd(invoice.total)}. Hoá đơn được cấp mã, khoá chỉ số và không tính lại.`}
        confirmLabel="Phát hành"
        cancelLabel="Quay lại"
        closeOnConfirm={false}
        confirmLoading={issue.isPending}
        onConfirm={() => void confirmIssue()}
      />
      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open && !remove.isPending) setDeleting(null);
        }}
        title="Xoá dòng?"
        description={
          deleting ? `Xoá "${describe(deleting)}" (${formatVnd(deleting.amount)})?` : undefined
        }
        confirmLabel="Xoá dòng"
        cancelLabel="Quay lại"
        confirmVariant="danger"
        closeOnConfirm={false}
        confirmLoading={remove.isPending}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}

const recordedAt = (iso: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date(iso));

/** One payment: date, amount, method, who recorded it; reversed ones struck through with the reason. */
function PaymentRow({ payment, onReverse }: { payment: StayPayment; onReverse?: () => void }) {
  const reversed = payment.status === 'reversed';

  return (
    <li
      className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 py-3"
      data-testid="invoice-payment"
      data-payment-status={payment.status}
    >
      <div className="grid min-w-0 flex-1 gap-0.5 break-words">
        <p className="flex flex-wrap items-center gap-2">
          <strong className={cn('whitespace-nowrap', reversed && 'text-muted line-through')}>
            {formatVnd(payment.amount)}
          </strong>
          <span>{PAYMENT_METHOD_LABELS[payment.method]}</span>
          <PaymentStatusTag payment={payment} />
        </p>
        <p className="text-ui-sm text-muted">
          Ngày thu {displayDate(payment.paidOn)}
          {payment.actorName ? ` · Người ghi ${payment.actorName}` : ''}
          {payment.reference ? ` · Mã GD ${payment.reference}` : ''}
        </p>
        {payment.note ? <p className="text-ui-sm whitespace-pre-wrap">{payment.note}</p> : null}
        {reversed ? (
          <p className="text-ui-sm text-muted whitespace-pre-wrap" data-testid="reverse-reason">
            Đã huỷ{payment.reversedAt ? ` ${recordedAt(payment.reversedAt)}` : ''}
            {payment.reversedByName ? ` bởi ${payment.reversedByName}` : ''}:{' '}
            {payment.reverseReason}
          </p>
        ) : null}
      </div>
      {onReverse ? (
        <IconButton
          icon="rotateLeft"
          variant="ghost"
          size="sm"
          label={`Huỷ bút toán ${formatVnd(payment.amount)} ngày ${displayDate(payment.paidOn)}`}
          onClick={onReverse}
        />
      ) : null}
    </li>
  );
}

function TotalRow({
  label,
  value,
  strong,
  danger,
}: {
  label: string;
  value: number;
  strong?: boolean;
  danger?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex justify-between gap-3',
        strong && 'font-bold',
        danger && 'text-danger-700',
      )}
    >
      <dt>{label}</dt>
      <dd className="whitespace-nowrap">{formatVnd(value)}</dd>
    </div>
  );
}
