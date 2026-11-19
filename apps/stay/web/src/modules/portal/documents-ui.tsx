import { Tag } from '@itclabs/react-ui';
import type { DocumentStatus } from '@stay/shared';
import { isoDateInTimeZone } from '@stay/shared';
import { useTranslation } from 'react-i18next';
import { displayDate } from '@/libraries/format';

type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

const STATUS_TONES: Record<DocumentStatus, Tone> = {
  draft: 'neutral',
  owner_signed: 'info',
  sent: 'warning',
  viewed: 'warning',
  signed_by_tenant: 'info',
  completed: 'success',
  rejected: 'danger',
  cancelled: 'neutral',
  completed_paper: 'success',
  superseded: 'neutral',
  expired: 'danger',
};

export const portalDocumentPaths = {
  list: '/p/documents',
  detail: (id: string) => `/p/documents/${id}`,
} as const;

/** Business date (Asia/Ho_Chi_Minh) of an ISO instant, `dd/MM/yyyy`. */
export const documentDate = (iso: string) => displayDate(isoDateInTimeZone(new Date(iso)));

/** Date and time of an ISO instant in Vietnam time. */
export function documentDateTime(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(iso));
}

export function DocumentStatusTag({ status }: { status: DocumentStatus }) {
  const { t } = useTranslation('portalDocuments');

  return (
    <Tag tone={STATUS_TONES[status]} size="sm">
      {(
        {
          draft: t('status.draft'),
          owner_signed: t('status.owner_signed'),
          sent: t('status.sent'),
          viewed: t('status.viewed'),
          signed_by_tenant: t('status.signed_by_tenant'),
          completed: t('status.completed'),
          rejected: t('status.rejected'),
          cancelled: t('status.cancelled'),
          completed_paper: t('status.completed_paper'),
          superseded: t('status.superseded'),
          expired: t('status.expired'),
        } as Record<string, string>
      )[status] ?? String(status)}
    </Tag>
  );
}
