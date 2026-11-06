import { Alert, Button, Dialog, Spinner } from '@itclabs/react-ui';
import { useCategory } from '@p4/api-sdk/react';
import { getErrorMessage } from '@p4/api-sdk/shared';
import { useTranslation } from 'react-i18next';

export default function CategoryDetails({ id, onClose }: { id: string; onClose: () => void }) {
  const { t } = useTranslation();

  const query = useCategory(id);

  const category = query.data?.data;

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t('categories.details')}
    >
      {query.isPending ? (
        <Spinner label={t('categories.loading')} />
      ) : query.isError ? (
        <div className="grid gap-3">
          <Alert tone="danger">{getErrorMessage(query.error, t('categories.loadFailed'))}</Alert>
          <Button variant="secondary" onClick={() => void query.refetch()}>
            {t('categories.retry')}
          </Button>
        </div>
      ) : category ? (
        <dl className="grid gap-4 text-control">
          {[
            [t('categories.categoryName'), category.name],
            [t('categories.slug'), category.slug],
            [t('categories.description'), category.description || t('categories.noDescription')],
          ].map(([label, value]) => (
            <div key={label} className="grid gap-1">
              <dt className="text-muted">{label}</dt>
              <dd className="whitespace-pre-wrap break-words">{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </Dialog>
  );
}
