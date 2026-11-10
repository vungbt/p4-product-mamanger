import { Alert, Button, Skeleton } from '@itclabs/react-ui';
import { getErrorMessage } from '@stay/sdk/shared';
import { useTranslation } from 'react-i18next';

/** Shown instead of a form or list while its data loads. */
export function LoadingRows({ rows = 4 }: { rows?: number }) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-3" role="status" aria-live="polite">
      <span className="sr-only">{t('app.loading')}</span>
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-16 w-full rounded-panel" />
      ))}
    </div>
  );
}

/** Load failure with a retry button (screens.md: đang tải / rỗng / lỗi + thử lại). */
export function LoadError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const { t } = useTranslation();

  return (
    <Alert
      tone="danger"
      title={t('errors.loadFailed')}
      action={
        <Button variant="secondary" size="sm" onClick={onRetry}>
          {t('errors.retry')}
        </Button>
      }
      data-testid="load-error"
    >
      {getErrorMessage(error, t('errors.loadFailed'))}
    </Alert>
  );
}

/** 409 on save: the record changed elsewhere; reloading discards the local edits. */
export function ConflictAlert({ onReload }: { onReload: () => void }) {
  const { t } = useTranslation('forms');

  return (
    <Alert
      tone="warning"
      role="alert"
      title={t('conflict.title')}
      action={
        <Button variant="secondary" size="sm" onClick={onReload}>
          {t('conflict.reload')}
        </Button>
      }
      data-testid="conflict-alert"
    >
      {t('conflict.description')}
    </Alert>
  );
}

/** Form-level API error (errors that belong to no field). */
export function FormError({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <Alert tone="danger" role="alert" data-testid="form-error">
      {message}
    </Alert>
  );
}
