import { Alert, Button, Dialog, Spinner } from '@itclabs/react-ui';
import { useTranslation } from 'react-i18next';
import useCategoryDetails from '../hooks/use-category-details';

export default function CategoryDetails({ id, onClose }: { id: string; onClose: () => void }) {
  const { t } = useTranslation();

  const { category, loading, error, retry } = useCategoryDetails(id);

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t('categories.details')}
    >
      {loading ? (
        <Spinner label={t('categories.loading')} />
      ) : error ? (
        <div className="grid gap-3">
          <Alert tone="danger">{error}</Alert>
          <Button variant="secondary" onClick={retry}>
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
