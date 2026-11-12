import { Alert, Button, Tag } from '@itclabs/react-ui';
import { useAuditLog } from '@stay/sdk/react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { LoadingRows } from '@/libraries/forms/page-states';
import { Overlay } from '@/modules/invoices/invoice-dialogs';
import {
  type AuditEntry,
  auditTarget,
  fieldChanges,
  fieldLabel,
  formatDateTime,
  formatFieldValue,
  requestMeta,
  resourceLabel,
  verbMeta,
} from './audit-format';

function Meta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid min-w-0 gap-0.5">
      <dt className="text-ui-sm text-muted">{label}</dt>
      <dd className="min-w-0 break-words text-ink">{children}</dd>
    </div>
  );
}

/** Before/after table of the changed fields, or the recorded values when there is no diff. */
function ChangesTable({ entry }: { entry: AuditEntry }) {
  const rows = fieldChanges(entry.changes);
  const diff = rows.some((row) => 'before' in row);

  if (!rows.length)
    return <p className="text-ui-sm text-muted">Không có trường dữ liệu nào thay đổi.</p>;

  return (
    <div className="min-w-0 overflow-x-auto rounded-panel border border-line">
      <table className="w-full min-w-0 text-left text-ui-sm">
        <caption className="sr-only">Các trường thay đổi</caption>
        <thead className="bg-table-header text-muted">
          <tr>
            <th scope="col" className="px-3 py-2 font-semibold">
              Trường
            </th>
            {diff ? (
              <th scope="col" className="px-3 py-2 font-semibold">
                Trước
              </th>
            ) : null}
            <th scope="col" className="px-3 py-2 font-semibold">
              {diff ? 'Sau' : 'Giá trị'}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((row) => (
            <tr key={row.key} className="align-top">
              <th scope="row" className="px-3 py-2 font-medium text-ink">
                {fieldLabel(row.key)}
              </th>
              {diff ? (
                <td className="break-words px-3 py-2 text-muted">
                  {formatFieldValue(row.key, row.before)}
                </td>
              ) : null}
              <td className="break-words px-3 py-2 text-ink">
                {formatFieldValue(row.key, row.after)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DetailBody({ id }: { id: string }) {
  const { t } = useTranslation();
  const detail = useAuditLog(id);

  if (detail.isPending) return <LoadingRows rows={3} />;
  if (detail.isError)
    return (
      <Alert
        tone="danger"
        title={t('errors.loadFailed')}
        action={
          <Button variant="secondary" size="sm" onClick={() => void detail.refetch()}>
            {t('errors.retry')}
          </Button>
        }
      />
    );

  const entry = detail.data;
  const verb = verbMeta(entry.action);
  const target = auditTarget(entry);
  const meta = requestMeta(entry.changes);

  return (
    <div className="grid min-w-0 gap-5">
      <dl className="grid gap-3 sm:grid-cols-2">
        <Meta label="Người thực hiện">{entry.actorName ?? entry.actorId ?? t('audit.system')}</Meta>
        <Meta label="Thời điểm">
          <time dateTime={entry.createdAt}>{formatDateTime(entry.createdAt)}</time>
        </Meta>
        <Meta label="Thao tác">
          <span className="flex flex-wrap items-center gap-2">
            <Tag tone={verb.tone} size="sm">
              {verb.label}
            </Tag>
            <span className="text-ui-sm text-muted">{entry.action}</span>
          </span>
        </Meta>
        <Meta label="Đối tượng">
          {resourceLabel(entry.resourceType)}{' '}
          {target.href && target.name ? (
            <Link className="text-accent underline" to={target.href}>
              {target.name}
            </Link>
          ) : (
            target.name
          )}
        </Meta>
        <Meta label="Kết quả">
          <Tag tone={entry.outcome === 'success' ? 'success' : 'danger'} size="sm">
            {t(`audit.${entry.outcome}`)}
          </Tag>
        </Meta>
        <Meta label="Mã yêu cầu">
          <span className="break-all font-mono text-ui-sm">{meta.correlationId ?? '—'}</span>
          {meta.source ? <span className="text-ui-sm text-muted"> · {meta.source}</span> : null}
        </Meta>
      </dl>

      <section className="grid min-w-0 gap-2" aria-labelledby="audit-changes-title">
        <h3 id="audit-changes-title" className="font-semibold text-ink">
          Thay đổi
        </h3>
        <ChangesTable entry={entry} />
      </section>

      <details className="min-w-0 rounded-panel border border-line">
        <summary className="cursor-pointer px-3 py-2 text-ui-sm font-semibold text-ink">
          Dữ liệu gốc (JSON)
        </summary>
        <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-all border-t border-line bg-canvas p-3 text-ui-sm">
          {JSON.stringify(entry.changes, null, 2)}
        </pre>
      </details>
    </div>
  );
}

/** Detail of one audit entry: metadata, before/after table and the raw (redacted) payload. */
export function AuditDetailDialog({ id, onClose }: { id: string; onClose: () => void }) {
  return (
    <Overlay
      title="Chi tiết thay đổi"
      description="Giá trị nhạy cảm đã được ẩn ([REDACTED])."
      onClose={onClose}
    >
      <DetailBody id={id} />
    </Overlay>
  );
}
