import { Button } from '@itclabs/react-ui';
import {
  usePortalDocuments,
  usePortalInvoice,
  usePortalMe,
  usePortalNotifications,
} from '@stay/sdk/react';
import type { PortalInvoiceSummary, PortalOpenRequests } from '@stay/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { displayDate, formatVnd } from '@/libraries/format';
import { displayPeriod, INVOICE_KIND_LABELS } from '@/modules/invoices/invoice-ui';
import { PaymentBlock } from '@/modules/invoices/share/invoice-card';
import {
  ContactLinks,
  PortalInvoiceStatus,
  PortalQuery,
  PortalSection,
  portalPaths,
} from './portal-ui';

/** VietQR and transfer details of the current invoice, loaded when "Thanh toán" is pressed. */
function PaymentPanel({ id }: { id: string }) {
  const invoice = usePortalInvoice(id);

  return (
    <PortalQuery query={invoice}>{(data) => <PaymentBlock invoice={data} copyable />}</PortalQuery>
  );
}

function CurrentInvoice({ invoice }: { invoice: PortalInvoiceSummary }) {
  const [paying, setPaying] = useState(() => window.location.pathname.startsWith('/my'));

  return (
    <div className="grid gap-3" data-testid="portal-current-invoice">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">
          {INVOICE_KIND_LABELS[invoice.kind]} · Kỳ {displayPeriod(invoice.period)}
        </p>
        <PortalInvoiceStatus invoice={invoice} />
      </div>
      <dl className="grid gap-1">
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Mã hoá đơn</dt>
          <dd className="break-all" data-testid="portal-current-code">
            {invoice.code}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Tổng</dt>
          <dd>{formatVnd(invoice.total)}</dd>
        </div>
        <div className="flex justify-between gap-3 font-bold">
          <dt>Còn lại</dt>
          <dd data-testid="portal-current-remaining">{formatVnd(invoice.remaining)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Hạn thanh toán</dt>
          <dd>{displayDate(invoice.dueOn)}</dd>
        </div>
      </dl>
      <div className="flex flex-wrap gap-2">
        {invoice.remaining > 0 ? (
          <Button aria-expanded={paying} onClick={() => setPaying((value) => !value)}>
            {paying ? 'Ẩn thông tin thanh toán' : 'Thanh toán'}
          </Button>
        ) : null}
        <Link
          to={portalPaths.invoice(invoice.id)}
          className="inline-flex min-h-10 items-center px-2 font-semibold text-accent"
        >
          Xem chi tiết
        </Link>
      </div>
      {paying ? <PaymentPanel id={invoice.id} /> : null}
    </div>
  );
}

/** Open maintenance reports, own pending requests and claims, with the two entry buttons. */
function OpenRequests({ open }: { open: PortalOpenRequests }) {
  const navigate = useNavigate();
  const rows = [
    { count: open.maintenance, label: 'báo hỏng đang mở', to: portalPaths.maintenance },
    { count: open.requests, label: 'yêu cầu chờ duyệt', to: portalPaths.requests },
    { count: open.paymentClaims, label: 'báo chuyển khoản chờ xác nhận', to: portalPaths.invoices },
  ].filter((row) => row.count > 0);

  return (
    <PortalSection title="Báo hỏng và yêu cầu" testId="portal-open-requests">
      {rows.length === 0 ? (
        <p className="text-ui-sm text-muted">Không có báo hỏng hay yêu cầu nào đang chờ.</p>
      ) : (
        <ul className="grid gap-1">
          {rows.map((row) => (
            <li key={row.label}>
              <Link className="font-semibold text-accent" to={row.to}>
                {row.count} {row.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => navigate(portalPaths.maintenanceNew)}>Báo hỏng</Button>
        <Button variant="secondary" onClick={() => navigate(portalPaths.requestNew)}>
          Gửi yêu cầu
        </Button>
      </div>
    </PortalSection>
  );
}

function LatestNotifications() {
  const notifications = usePortalNotifications();

  return (
    <PortalSection title="Thông báo mới nhất">
      <PortalQuery query={notifications}>
        {(data) => (
          <>
            {data.items.slice(0, 3).map((item) => (
              <Link
                key={item.id}
                className="font-semibold text-accent"
                to={item.path.replace(/^\/p(?=\/|$)/, portalPaths.home)}
              >
                {item.title}
              </Link>
            ))}
            {data.items.length === 0 ? <p>Chưa có thông báo.</p> : null}
            <Link className="text-accent" to={portalPaths.notifications}>
              Xem thông báo và cài đặt
            </Link>
            <Link className="text-accent" to={portalPaths.notices}>
              Thông báo từ chủ trọ và nội quy
            </Link>
          </>
        )}
      </PortalQuery>
    </PortalSection>
  );
}

/** T-03 `/p`: current invoice and payment, debt, notices, open requests, contact. */
export default function PortalHomePage() {
  const { t } = useTranslation('portalDocuments');
  const documents = usePortalDocuments();
  const me = usePortalMe();

  const awaiting = (documents.data ?? []).filter((row) => row.awaitingMe);

  return (
    <PortalQuery query={me}>
      {(data) => (
        <>
          <div className="grid gap-1">
            <h1 className="text-heading font-bold">Phòng {data.roomCode}</h1>
            <p className="text-muted">Xin chào {data.tenantName}</p>
          </div>

          <PortalSection title="Hoá đơn hiện tại">
            {data.currentInvoice ? (
              <CurrentInvoice invoice={data.currentInvoice} />
            ) : (
              <p className="text-muted">Chưa có hoá đơn nào được phát hành.</p>
            )}
          </PortalSection>

          {data.totalDebt > 0 ? (
            <PortalSection title="Công nợ" testId="portal-debt">
              <p>
                Tổng còn phải trả <strong>{formatVnd(data.totalDebt)}</strong> ·{' '}
                {data.unpaidInvoiceCount} hoá đơn
              </p>
              {data.previousDebt > 0 ? (
                <p className="text-ui-sm text-muted">
                  Trong đó các hoá đơn trước còn {formatVnd(data.previousDebt)}.{' '}
                  <Link className="font-semibold text-accent" to={portalPaths.invoices}>
                    Xem hoá đơn
                  </Link>
                </p>
              ) : null}
            </PortalSection>
          ) : null}

          {data.pinnedNotices.length > 0 ? (
            <PortalSection title="Thông báo từ chủ trọ">
              <ul className="grid gap-3">
                {data.pinnedNotices.map((notice) => (
                  <li key={notice.id} className="grid gap-1">
                    <p className="font-semibold break-words">{notice.title}</p>
                    <p className="whitespace-pre-wrap break-words text-ui-sm">{notice.body}</p>
                  </li>
                ))}
              </ul>
              <Link className="font-semibold text-accent" to={portalPaths.notices}>
                Tất cả thông báo và nội quy
              </Link>
            </PortalSection>
          ) : null}

          {awaiting.length > 0 && (
            <PortalSection title={t('home.title')} testId="portal-awaiting-documents">
              <p>{t('home.awaiting', { count: awaiting.length })}</p>
              {awaiting.map((document) => (
                <Link
                  key={document.id}
                  className="font-semibold text-accent"
                  to={`${portalPaths.home}/documents/${document.id}`}
                >
                  {document.title} · {t('home.open')}
                </Link>
              ))}
            </PortalSection>
          )}
          <LatestNotifications />
          <OpenRequests open={data.openRequests} />

          <PortalSection title="Liên hệ chủ trọ">
            <ContactLinks phone={data.contactPhone} />
          </PortalSection>
        </>
      )}
    </PortalQuery>
  );
}
