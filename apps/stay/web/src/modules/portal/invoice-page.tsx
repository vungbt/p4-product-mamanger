import { usePortalInvoice } from '@stay/sdk/react';
import type { PaymentMethod } from '@stay/shared';
import { Link, useParams } from 'react-router-dom';
import { displayDate, formatVnd } from '@/libraries/format';
import { isNotFound } from '@/libraries/forms/api-errors';
import { InvoiceCard } from '@/modules/invoices/share/invoice-card';
import { ComingSoonButton, PortalQuery, PortalSection, portalPaths } from './portal-ui';

const METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Tiền mặt',
  bank_transfer: 'Chuyển khoản',
  other: 'Khác',
  deposit: 'Cấn trừ cọc',
};

/** T-05 `/p/invoices/:id`: the invoice with VietQR (as T-01) and its payment history. */
export default function PortalInvoicePage() {
  const { id = '' } = useParams();
  const invoice = usePortalInvoice(id);

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
      {(data) => (
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
            {data.remaining > 0 ? (
              <div className="grid gap-1">
                <ComingSoonButton>Tôi đã chuyển khoản</ComingSoonButton>
                <p className="text-ui-sm text-muted">
                  Sắp có: báo đã chuyển khoản để chủ trọ xác nhận. Hiện tại chủ trọ sẽ tự đối soát.
                </p>
              </div>
            ) : null}
          </PortalSection>
          <Link className="font-semibold text-accent" to={portalPaths.invoices}>
            Về danh sách hoá đơn
          </Link>
        </>
      )}
    </PortalQuery>
  );
}
