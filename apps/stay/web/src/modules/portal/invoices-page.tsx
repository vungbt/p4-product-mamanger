import { EmptyState } from '@itclabs/react-ui';
import { usePortalInvoices } from '@stay/sdk/react';
import { Link } from 'react-router-dom';
import { formatVnd } from '@/libraries/format';
import { displayPeriod, INVOICE_KIND_LABELS } from '@/modules/invoices/invoice-ui';
import { PortalInvoiceStatus, PortalQuery, portalPaths } from './portal-ui';

/** T-04 `/p/invoices`: issued invoices of the contract, newest first. */
export default function PortalInvoicesPage() {
  const invoices = usePortalInvoices();

  return (
    <>
      <h1 className="text-heading font-bold">Hoá đơn của tôi</h1>
      <PortalQuery query={invoices}>
        {(rows) =>
          rows.length === 0 ? (
            <EmptyState
              title="Chưa có hoá đơn"
              description="Hoá đơn sẽ hiện ở đây khi chủ trọ phát hành."
            />
          ) : (
            <ul className="grid gap-3" aria-label="Danh sách hoá đơn">
              {rows.map((invoice) => (
                <li key={invoice.id}>
                  <Link
                    to={portalPaths.invoice(invoice.id)}
                    className="grid min-w-0 gap-2 rounded-panel border border-line bg-surface p-4 hover:border-accent"
                    data-testid="portal-invoice-row"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold">
                        Kỳ {displayPeriod(invoice.period)} · {INVOICE_KIND_LABELS[invoice.kind]}
                      </span>
                      <PortalInvoiceStatus invoice={invoice} />
                    </div>
                    <span className="text-ui-sm break-all text-muted">{invoice.code}</span>
                    <dl className="grid grid-cols-3 gap-2 text-ui-sm">
                      <div>
                        <dt className="text-muted">Tổng</dt>
                        <dd>{formatVnd(invoice.total)}</dd>
                      </div>
                      <div>
                        <dt className="text-muted">Đã thu</dt>
                        <dd>{formatVnd(invoice.paidTotal)}</dd>
                      </div>
                      <div>
                        <dt className="text-muted">Còn lại</dt>
                        <dd className="font-semibold">{formatVnd(invoice.remaining)}</dd>
                      </div>
                    </dl>
                  </Link>
                </li>
              ))}
            </ul>
          )
        }
      </PortalQuery>
    </>
  );
}
