import { Button, EmptyState, Spinner, Tag } from '@itclabs/react-ui';
import { isPortalSessionError } from '@stay/sdk/portal';
import type { PortalInvoiceSummary } from '@stay/shared';
import type { ReactNode } from 'react';
import { LoadError } from '@/libraries/forms/page-states';

/** Generic on purpose: titles and link previews never show names, rooms or amounts. */
export const PORTAL_TITLE = 'Cổng người thuê';

export const portalPaths = {
  home: '/p',
  invoices: '/p/invoices',
  invoice: (id: string) => `/p/invoices/${id}`,
  contract: '/p/contract',
  usage: '/p/usage',
  notices: '/p/notices',
  more: '/p/more',
  maintenance: '/p/maintenance',
  request: '/p/requests/new',
  signedOut: '/p/signed-out',
} as const;

const CONTACT_KEY = 'stay_portal_contact';

/**
 * The building's contact phone, remembered on this device after the portal opened once, so the
 * "link no longer valid" page can still show whom to call (it never says why the link failed).
 */
export function rememberContact(phone: string | null) {
  try {
    if (phone) localStorage.setItem(CONTACT_KEY, phone);
  } catch {
    /* storage disabled */
  }
}

function rememberedContact(): string | null {
  try {
    return localStorage.getItem(CONTACT_KEY);
  } catch {
    return null;
  }
}

/** Zalo opens a chat from a Vietnamese phone number (`0…`). */
function zaloUrl(phone: string) {
  return `https://zalo.me/${phone.replace(/\D/g, '')}`;
}

/** "Gọi" (tel:) and "Zalo" links of the building contact. */
export function ContactLinks({ phone }: { phone: string | null }) {
  if (!phone) return <p className="text-muted">Chủ trọ chưa cập nhật số điện thoại liên hệ.</p>;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={`tel:${phone}`}
        className="inline-flex min-h-10 items-center rounded-control border border-line px-3 font-semibold text-accent"
      >
        Gọi {phone}
      </a>
      <a
        href={zaloUrl(phone)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-10 items-center rounded-control border border-line px-3 font-semibold text-accent"
      >
        Nhắn Zalo
      </a>
    </div>
  );
}

/** T-11: the link or session is no longer valid (revoked, expired or unknown: never which). */
export function InvalidLink() {
  const phone = rememberedContact();

  return (
    <main className="min-h-dvh bg-canvas px-4 py-10">
      <div className="mx-auto grid w-full max-w-xl min-w-0 gap-4" data-testid="portal-invalid">
        <EmptyState
          headingLevel={1}
          variant="not-found"
          title="Link không còn hiệu lực"
          description="Link không còn hiệu lực, vui lòng liên hệ chủ trọ để nhận link mới."
        />
        {phone ? <ContactLinks phone={phone} /> : null}
      </div>
    </main>
  );
}

export function PortalSpinner() {
  return (
    <div className="flex min-h-64 items-center justify-center" role="status" aria-live="polite">
      <Spinner label="Đang tải" />
    </div>
  );
}

/**
 * Loading / invalid session (T-11) / error + retry for a portal query; renders `children` with
 * the data otherwise.
 */
export function PortalQuery<Data>({
  query,
  children,
}: {
  query: { data: Data | undefined; isPending: boolean; error: unknown; refetch: () => unknown };
  children: (data: Data) => ReactNode;
}) {
  if (query.data !== undefined) return children(query.data);
  if (query.isPending) return <PortalSpinner />;
  if (isPortalSessionError(query.error)) return <InvalidLink />;
  return <LoadError error={query.error} onRetry={() => void query.refetch()} />;
}

/** Status as the tenant reads it. */
export function PortalInvoiceStatus({ invoice }: { invoice: PortalInvoiceSummary }) {
  if (invoice.remaining === 0)
    return (
      <Tag tone="success" size="sm">
        Đã thanh toán
      </Tag>
    );
  if (invoice.overdue)
    return (
      <Tag tone="danger" size="sm">
        Quá hạn
      </Tag>
    );
  return invoice.status === 'partially_paid' ? (
    <Tag tone="warning" size="sm">
      Thanh toán một phần
    </Tag>
  ) : (
    <Tag tone="info" size="sm">
      Chưa thanh toán
    </Tag>
  );
}

/** Part-B actions (báo hỏng, yêu cầu, "Tôi đã chuyển khoản") are shown but not available yet. */
export function ComingSoonButton({ children }: { children: ReactNode }) {
  return (
    <Button variant="secondary" disabled>
      {children} · Sắp có
    </Button>
  );
}

/** Section card of the portal pages. */
export function PortalSection({
  title,
  children,
  testId,
}: {
  title: string;
  children: ReactNode;
  testId?: string;
}) {
  return (
    <section
      aria-label={title}
      className="grid min-w-0 gap-3 rounded-panel border border-line bg-surface p-4"
      data-testid={testId}
    >
      <h2 className="text-section font-semibold">{title}</h2>
      {children}
    </section>
  );
}
