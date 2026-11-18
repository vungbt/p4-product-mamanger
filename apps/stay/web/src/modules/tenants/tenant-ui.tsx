import { Icon, Tag, type TagTone } from '@itclabs/react-ui';
import type { TenantStatus } from '@stay/shared';
import { useTranslation } from 'react-i18next';

const STATUS_TONES: Record<TenantStatus, TagTone> = {
  living: 'success',
  left: 'neutral',
  no_contract: 'warning',
};

/** Đang ở / Đã rời / Chưa có hợp đồng, plus "Đã lưu trữ" for archived profiles. */
export function TenantStatusTag({
  status,
  archived = false,
}: {
  status: TenantStatus;
  archived?: boolean;
}) {
  const { t } = useTranslation();

  if (archived)
    return (
      <Tag size="sm" tone="neutral">
        {t('tenants.status.archived')}
      </Tag>
    );

  return (
    <Tag size="sm" tone={STATUS_TONES[status]}>
      {t(`tenants.status.${status}`)}
    </Tag>
  );
}

/** `0901234567` → `0901 234 567` for reading. */
export function formatPhone(phone: string) {
  return phone.replace(/^(\d{4})(\d{3})(\d{3})$/, '$1 $2 $3');
}

/** `YYYY-MM-DD` → `dd/MM/yyyy`; `—` when empty. */
export function formatDate(value: string | null | undefined) {
  if (!value) return '—';

  const [year, month, day] = value.slice(0, 10).split('-');

  return `${day}/${month}/${year}`;
}

/** Call and Zalo links of a phone number (mobile contact shortcuts). */
export function ContactLinks({ phone, name }: { phone: string; name: string }) {
  const { t } = useTranslation();

  const linkClass =
    'inline-flex size-10 items-center justify-center rounded-control border border-line text-accent hover:bg-hover';

  return (
    <span className="flex shrink-0 gap-2">
      <a href={`tel:${phone}`} className={linkClass} aria-label={t('tenants.call', { name })}>
        <Icon name="phone" className="size-5" aria-hidden />
      </a>
      <a
        href={`https://zalo.me/${phone}`}
        target="_blank"
        rel="noreferrer"
        className={linkClass}
        aria-label={t('tenants.zalo', { name })}
      >
        <Icon name="message" className="size-5" aria-hidden />
      </a>
    </span>
  );
}

/** Text values of an import row (`values` is a column → text map). */
export function rowValues(values: unknown): Record<string, string> {
  if (!values || typeof values !== 'object' || Array.isArray(values)) return {};

  return Object.fromEntries(
    Object.entries(values).flatMap(([key, value]) =>
      typeof value === 'string' ? [[key, value]] : [],
    ),
  );
}
