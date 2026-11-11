import { Button, Tag } from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import { usePortalCancelClaim, usePortalInvoice } from '@stay/sdk/react';
import { getErrorMessage } from '@stay/sdk/shared';
import { isoDateInTimeZone, type PaymentMethod, type PortalPaymentClaim } from '@stay/shared';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { displayDate, formatVnd } from '@/libraries/format';
import { isNotFound } from '@/libraries/forms/api-errors';
import { InvoiceCard } from '@/modules/invoices/share/invoice-card';
import { ClaimForm } from './claim-form';
import { PortalQuery, PortalSection, portalPaths } from './portal-ui';
import { CLAIM_STATUS_LABELS, statusTone } from './request-labels';

const METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Tiền mặt',
  bank_transfer: 'Chuyển khoản',
  other: 'Khác',
  deposit: 'Cấn trừ cọc',
};

const dateOf = (iso: string) => displayDate(isoDateInTimeZone(new Date(iso)));

/** "Tôi đã chuyển khoản" claims: pending ("Đang chờ xác nhận"), confirmed, or the reject reason. */
function Claims({ claims }: { claims: PortalPaymentClaim[] }) {
  const cancel = usePortalCancelClaim();

  const withdraw = async (id: string) => {
    try {
      await cancel.mutateAsync(id);
      toast.success('Đã huỷ báo chuyển khoản.');
    } catch (cause) {
      toast.error(getErrorMessage(cause, 'Không huỷ được. Vui lòng thử lại.'));
    }
  };

  return (
    <ul className="grid gap-3" data-testid="portal-claims">
      {claims.map((claim) => (
        <li key={claim.id} className="grid gap-1 rounded-control border border-line p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <strong>{formatVnd(claim.amount)}</strong>
            <Tag tone={statusTone(claim.status)} size="sm">
              {CLAIM_STATUS_LABELS[claim.status]}
            </Tag>
          </div>
          <p className="text-ui-sm text-muted">
            Chuyển ngày {displayDate(claim.paidOn)} · báo lúc {dateOf(claim.createdAt)}
          </p>
          {claim.status === 'rejected' && claim.rejectReason ? (
            <p className="break-words text-ui-sm">Lý do: {claim.rejectReason}</p>
          ) : null}
          {claim.status === 'pending' && claim.isOwn ? (
            <Button
              variant="ghost"
              size="sm"
              className="justify-self-start"
              loading={cancel.isPending && cancel.variables === claim.id}
              onClick={() => void withdraw(claim.id)}
            >
              Huỷ báo chuyển khoản
            </Button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

/**
 * T-05 `/p/invoices/:id`: the invoice with VietQR (as T-01), its payment history and
 * "Tôi đã chuyển khoản" (a claim the owner confirms in the inbox).
 */
export default function PortalInvoicePage() {
  const { id = '' } = useParams();
  const invoice = usePortalInvoice(id);
  const [claiming, setClaiming] = useState(false);

  if (isNotFound(invoice.error))
    return (
      <>
        <h1 className="text-heading font-bold">Không tìm thấy hoá đơn</h1>
        <Link className="font-semibold text-accent" to={portalPaths.invoices}>
          Về danh sách hoá đơn
        </Link>
      </>
    );

  return (
    <PortalQuery query={invoice}>
      {(data) => {
        const pending = data.claims.some((claim) => claim.status === 'pending');

        return (
          <>
            <InvoiceCard invoice={data} copyable />
            <PortalSection title="Lịch sử thanh toán" testId="portal-payments">
              {data.payments.length === 0 ? (
                <p className="text-muted">Chưa có khoản thanh toán nào được ghi nhận.</p>
              ) : (
                <ul className="grid gap-2">
                  {data.payments.map((payment) => (
                    <li key={payment.id} className="flex flex-wrap justify-between gap-2">
                      <span>
                        {displayDate(payment.paidOn)} · {METHOD_LABELS[payment.method]}
                      </span>
                      <strong>{formatVnd(payment.amount)}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </PortalSection>
            {data.remaining > 0 || data.claims.length > 0 ? (
              <PortalSection title="Báo đã chuyển khoản" testId="portal-claim">
                {data.claims.length > 0 ? <Claims claims={data.claims} /> : null}
                {data.remaining > 0 && !pending ? (
                  claiming ? (
                    <ClaimForm
                      invoiceId={data.id}
                      remaining={data.remaining}
                      onDone={() => setClaiming(false)}
                    />
                  ) : (
                    <div className="grid gap-1">
                      <Button className="justify-self-start" onClick={() => setClaiming(true)}>
                        Tôi đã chuyển khoản
                      </Button>
                      <p className="text-ui-sm text-muted">
                        Đã chuyển khoản? Báo cho chủ trọ để xác nhận và ghi nhận thanh toán.
                      </p>
                    </div>
                  )
                ) : null}
              </PortalSection>
            ) : null}
            <Link className="font-semibold text-accent" to={portalPaths.invoices}>
              Về danh sách hoá đơn
            </Link>
          </>
        );
      }}
    </PortalQuery>
  );
}
