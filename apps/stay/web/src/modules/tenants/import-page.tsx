import { Alert, Button, cn, Tag, type TagTone } from '@itclabs/react-ui';
import { toast } from '@itclabs/react-ui/toast';
import { useCommitTenantImport, usePreviewTenantImport, useStaySdk } from '@stay/sdk/react';
import { type components, createTenantApi, getErrorMessage } from '@stay/sdk/shared';
import { TENANT_IMPORT_COLUMNS } from '@stay/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useActiveBuilding } from '@/libraries/buildings/building-provider';
import { rowValues } from './tenant-ui';

type Preview = components['schemas']['TenantImportPreview'];
type ImportRow = Preview['rows'][number];
type ImportResult = components['schemas']['TenantImportResult'];

const STATUS_TONES: Record<ImportRow['status'], TagTone> = {
  valid: 'success',
  error: 'danger',
  duplicate: 'warning',
};

function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Step({
  index,
  title,
  children,
}: {
  index: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={`import-step-${index}`}
      className="grid gap-3 rounded-panel border border-line bg-surface p-4 sm:p-5"
    >
      <h2 id={`import-step-${index}`} className="text-section font-semibold text-ink">
        <span className="mr-2 text-muted">{index}.</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

/** One preview row: status, values; error cells tinted red with the reason shown under them. */
function PreviewRow({ row }: { row: ImportRow }) {
  const { t } = useTranslation();

  const values = rowValues(row.values);
  const errorOf = (column: string) => row.errors.find((error) => error.column === column);
  const duplicateLabel =
    row.duplicate?.field === 'idNumber'
      ? t('tenants.import.duplicateIdNumber')
      : t('tenants.import.duplicatePhone');

  return (
    <tr
      className="border-t border-line align-top"
      data-testid={`import-row-${row.line}`}
      data-status={row.status}
    >
      <td className="px-3 py-2 text-muted">{row.line}</td>
      <td className="px-3 py-2">
        <div className="grid gap-1">
          <Tag size="sm" tone={STATUS_TONES[row.status]}>
            {t(`tenants.import.rowStatus.${row.status}`)}
          </Tag>
          {row.status === 'duplicate' ? (
            <span className="text-ui-sm text-muted">
              {duplicateLabel}
              {row.duplicate?.tenantId ? (
                <>
                  {' · '}
                  <Link to={`/tenants/${row.duplicate.tenantId}`} className="text-accent underline">
                    {t('tenants.form.viewExisting')}
                  </Link>
                </>
              ) : null}
            </span>
          ) : null}
        </div>
      </td>
      {TENANT_IMPORT_COLUMNS.map((column) => {
        const error = errorOf(column.key);

        return (
          <td
            key={column.key}
            className={cn(
              'min-w-32 px-3 py-2 text-ink',
              error && 'bg-danger-50 text-danger-700 ring-1 ring-inset ring-danger-700',
            )}
            title={error?.message}
            aria-invalid={error ? true : undefined}
          >
            <span className="break-words">{values[column.key] ?? ''}</span>
            {error ? (
              <span className="mt-1 block text-ui-sm" data-testid="import-cell-error">
                {error.message}
              </span>
            ) : null}
          </td>
        );
      })}
    </tr>
  );
}

/** O-14: template → file → preview (per row and column) → create the valid rows → result. */
export default function TenantImportPage() {
  const { t } = useTranslation();
  const sdk = useStaySdk();
  const { buildingId, building } = useActiveBuilding();
  const preview = usePreviewTenantImport();
  const commit = useCommitTenantImport();
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<Preview | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);

  const download = async (format: 'xlsx' | 'csv') => {
    try {
      saveBlob(await createTenantApi(sdk).template(format), `mau-nguoi-thue.${format}`);
    } catch (error) {
      toast.error(getErrorMessage(error, t('errors.loadFailed')));
    }
  };

  const check = async () => {
    if (!file || !buildingId) return;

    setResult(null);
    setData(null);

    try {
      setData(await preview.mutateAsync({ buildingId, file }));
      // One key per previewed file: a retried commit of the same rows is not created twice.
      setIdempotencyKey(crypto.randomUUID());
    } catch {
      /* shown from preview.error */
    }
  };

  const validRows = data?.rows.filter((row) => row.status === 'valid') ?? [];

  const confirm = async () => {
    if (!data) return;

    try {
      setResult(
        await commit.mutateAsync({
          idempotencyKey,
          body: {
            buildingId: data.buildingId,
            rows: validRows.map(({ line, values }) => ({ line, values: rowValues(values) })),
          },
        }),
      );
    } catch {
      /* shown from commit.error */
    }
  };

  const restart = () => {
    setFile(null);
    setData(null);
    setResult(null);
    preview.reset();
    commit.reset();
  };

  return (
    <div className="grid min-w-0 gap-5" data-testid="tenant-import-page">
      <header className="grid gap-1">
        <h1 className="text-heading font-bold text-ink">{t('tenants.import.title')}</h1>
        <p className="text-ui-sm text-muted">
          {t('tenants.import.description', { building: building?.name ?? '' })}
        </p>
      </header>

      <Step index={1} title={t('tenants.import.templateStep')}>
        <p className="text-ui-sm text-muted">{t('tenants.import.templateHint')}</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => void download('xlsx')}>
            {t('tenants.import.downloadXlsx')}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => void download('csv')}>
            {t('tenants.import.downloadCsv')}
          </Button>
        </div>
      </Step>

      <Step index={2} title={t('tenants.import.fileStep')}>
        <label htmlFor="import-file" className="text-ui-sm font-medium text-ink">
          {t('tenants.import.file')}
        </label>
        <input
          id="import-file"
          type="file"
          accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="text-ui-sm text-muted file:mr-3 file:rounded-control file:border file:border-line file:bg-surface file:px-3 file:py-2 file:text-ink"
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
            setData(null);
            setResult(null);
          }}
        />
        {preview.error ? (
          <Alert tone="danger" role="alert">
            {getErrorMessage(preview.error, t('errors.loadFailed'))}
          </Alert>
        ) : null}
        <div>
          <Button
            onClick={() => void check()}
            disabled={!file || !buildingId}
            loading={preview.isPending}
          >
            {t('tenants.import.check')}
          </Button>
        </div>
      </Step>

      {data && !result ? (
        <Step index={3} title={t('tenants.import.previewStep')}>
          <p className="text-ui-sm text-ink" data-testid="import-summary">
            {t('tenants.import.summary', {
              total: data.totalRows,
              valid: data.validCount,
              error: data.errorCount,
              duplicate: data.duplicateCount,
            })}
          </p>
          <div className="max-h-[60vh] overflow-auto rounded-control border border-line">
            <table className="w-full min-w-max text-left text-ui-sm" data-testid="import-preview">
              <caption className="sr-only">{t('tenants.import.previewStep')}</caption>
              <thead className="sticky top-0 bg-table-header text-muted">
                <tr>
                  <th scope="col" className="px-3 py-2 font-semibold">
                    {t('tenants.import.line')}
                  </th>
                  <th scope="col" className="px-3 py-2 font-semibold">
                    {t('tenants.fields.status')}
                  </th>
                  {TENANT_IMPORT_COLUMNS.map((column) => (
                    <th key={column.key} scope="col" className="px-3 py-2 font-semibold">
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <PreviewRow key={row.line} row={row} />
                ))}
              </tbody>
            </table>
          </div>
          {commit.error ? (
            <Alert tone="danger" role="alert">
              {getErrorMessage(commit.error, t('errors.saveFailed'))}
            </Alert>
          ) : null}
          <p className="text-ui-sm text-muted">{t('tenants.import.noRooms')}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => void confirm()}
              disabled={validRows.length === 0}
              loading={commit.isPending}
            >
              {t('tenants.import.commit', { count: validRows.length })}
            </Button>
            <Button variant="ghost" onClick={restart}>
              {t('tenants.import.restart')}
            </Button>
          </div>
        </Step>
      ) : null}

      {result ? (
        <Step index={4} title={t('tenants.import.resultStep')}>
          <Alert tone="success" role="status" data-testid="import-result">
            {t('tenants.import.result', {
              created: result.createdCount,
              skipped: result.skippedCount,
            })}
          </Alert>
          <div className="flex flex-wrap gap-2">
            <Link to="/tenants" className="font-semibold text-accent">
              {t('tenants.backToList')}
            </Link>
            <Button variant="ghost" size="sm" onClick={restart}>
              {t('tenants.import.again')}
            </Button>
          </div>
        </Step>
      ) : null}
    </div>
  );
}
