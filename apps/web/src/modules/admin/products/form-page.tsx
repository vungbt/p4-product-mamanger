import { Alert, Button, Icon, Skeleton } from '@itclabs/react-ui';
import { useProduct, useProductVariants } from '@p4/api-sdk/react';
import { getErrorMessage } from '@p4/api-sdk/shared';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { ProductEditor } from '@/modules/admin/products/components/product-editor';

export default function AdminProductFormPage() {
  const { id } = useParams<{ id: string }>();

  const { t } = useTranslation();

  const product = useProduct(id ?? '');

  const variants = useProductVariants(id ?? '');

  const reload = async () => {
    const response = await product.refetch();
    if (response.error) throw response.error;
    return response.data?.data;
  };

  if (id && (product.isPending || variants.isPending))
    return (
      <div className="grid gap-4" aria-busy="true">
        <span className="sr-only" role="status">
          {t('adminProductForm.loading')}
        </span>
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  if (id && (!product.data || !variants.data))
    return (
      <Alert
        tone="danger"
        action={
          <Button
            variant="secondary"
            onClick={() => void Promise.all([product.refetch(), variants.refetch()])}
          >
            <Icon name="refresh" />
            {t('adminProductForm.retry')}
          </Button>
        }
      >
        {getErrorMessage(product.error ?? variants.error, t('adminProductForm.loadFailed'))}
      </Alert>
    );

  return (
    <ProductEditor
      key={id ?? 'new'}
      initial={id ? product.data?.data : undefined}
      reload={reload}
      initialVariants={variants.data?.data ?? []}
      reloadVariants={async () => {
        const response = await variants.refetch();
        if (response.error) throw response.error;
        return response.data?.data ?? [];
      }}
    />
  );
}
