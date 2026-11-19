import {
  Button,
  Card,
  type ColumnDef,
  DataTable,
  DescriptionList,
  EmptyState,
  Icon,
  IconButton,
  PageHeader,
  Skeleton,
  Tag,
  useFormatters,
} from '@itclabs/react-ui';
import { MediaGallery } from '@itclabs/react-ui/media-gallery';
import { RichTextView } from '@itclabs/react-ui/rich-text-view';
import { useCanAccess } from '@p4/ability/browser';
import { useProduct, useProductVariants } from '@p4/api-sdk/react';
import { ApiSdkError, getErrorMessage } from '@p4/api-sdk/shared';
import type { ProductVariant } from '@p4/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ROUTES } from '@/constants/constants';
import {
  ProductStatusTag,
  productTransitions,
  useProductPublication,
} from '../components/product-status';
import VariantEditor from '../components/variant-editor';

export default function AdminProductDetailPage() {
  const { t } = useTranslation();
  const { formatCurrency, formatDate, formatNumber } = useFormatters();
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const canWrite = useCanAccess('write', 'Catalog');
  const product = useProduct(id);
  const variants = useProductVariants(id);
  const publication = useProductPublication(() => {
    void product.refetch();
  });
  const [editing, setEditing] = useState<{ variant?: ProductVariant } | null>(null);

  const reloadVariant = async () => {
    const result = await variants.refetch();

    return result.data?.data.find((item) => item.id === editing?.variant?.id);
  };

  const listSearch =
    typeof location.state?.from === 'string' ? (location.state.from as string) : '';
  const backToList = () => navigate(`${ROUTES.admin.products}${listSearch}`);

  if (product.isPending) {
    return (
      <div className="grid gap-4" aria-busy="true">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (product.isError) {
    const notFound = product.error instanceof ApiSdkError && product.error.status === 404;

    return (
      <EmptyState
        variant={notFound ? 'not-found' : 'error'}
        title={t(notFound ? 'adminProducts.notFound' : 'adminProducts.loadFailed')}
        description={notFound ? undefined : getErrorMessage(product.error, '')}
        action={
          notFound ? (
            <Button onClick={backToList}>{t('adminProducts.backToList')}</Button>
          ) : (
            <Button onClick={() => void product.refetch()}>{t('adminProducts.retry')}</Button>
          )
        }
      />
    );
  }

  const data = product.data.data;
  const images = data.images ?? [];
  const next = productTransitions(data.status);
  const canEditVariants = canWrite && data.status !== 'archived';

  const variantColumns: ColumnDef<ProductVariant, unknown>[] = [
    {
      accessorKey: 'sku',
      header: t('adminProducts.sku'),
      cell: ({ row }) => (
        <span className="font-medium text-ink">
          {row.original.sku}
          {row.original.isDefault ? (
            <Tag size="sm" tone="brand" className="ms-2">
              {t('adminProducts.defaultSku')}
            </Tag>
          ) : null}
        </span>
      ),
    },
    { accessorKey: 'size', header: t('adminProducts.size') },
    { accessorKey: 'color', header: t('adminProducts.color') },
    {
      accessorKey: 'price',
      header: t('adminProducts.price'),
      cell: ({ row }) => (
        <span className="tabular-nums">{formatCurrency(row.original.price, 'VND')}</span>
      ),
    },
    {
      accessorKey: 'available',
      header: t('adminProducts.available'),
      cell: ({ row }) => (
        <span className="tabular-nums">{formatNumber(row.original.available)}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: t('adminProducts.statusLabel'),
      cell: ({ row }) => (
        <Tag size="sm" tone={row.original.status === 'active' ? 'success' : 'neutral'}>
          {t(`adminProducts.skuStatus.${row.original.status}`)}
        </Tag>
      ),
    },
    ...(canEditVariants
      ? [
          {
            id: 'actions',
            header: t('adminProducts.actions'),
            enableSorting: false,
            cell: ({ row }: { row: { original: ProductVariant } }) => (
              <div className="flex justify-end">
                <IconButton
                  icon="edit"
                  variant="ghost"
                  size="sm"
                  label={`${t('adminProducts.variant.editTitle')}: ${row.original.sku}`}
                  onClick={() => setEditing({ variant: row.original })}
                />
              </div>
            ),
          } satisfies ColumnDef<ProductVariant, unknown>,
        ]
      : []),
  ];

  return (
    <div className="grid gap-6">
      <PageHeader
        classNames={{ title: 'text-heading' }}
        title={data.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <ProductStatusTag status={data.status} />
            {t('adminProducts.version', { version: data.version })}
          </span>
        }
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={backToList}>
              <Icon name="arrowRight" className="rotate-180" />
              {t('adminProducts.backToList')}
            </Button>
            {canWrite &&
              next.map((status) => (
                <Button
                  key={status}
                  variant={status === 'archived' ? 'danger' : 'secondary'}
                  loading={publication.changing === data.id}
                  onClick={() => publication.request(data, status)}
                >
                  {t(`adminProducts.action.${status}`)}
                </Button>
              ))}
            {canWrite && data.status !== 'archived' && (
              <Button
                onClick={() =>
                  navigate(ROUTES.admin['product-edit'](data.id), { state: location.state })
                }
              >
                <Icon name="edit" />
                {t('adminProducts.edit')}
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card title={t('adminProducts.productInfo')}>
          <DescriptionList
            columns={2}
            emptyValue="—"
            items={[
              { id: 'slug', label: t('adminProducts.slug'), value: data.slug },
              {
                id: 'category',
                label: t('adminProducts.category'),
                value: data.category?.name,
              },
              {
                id: 'price',
                label: t('adminProducts.price'),
                value: formatCurrency(data.price, 'VND'),
              },
              { id: 'stock', label: t('adminProducts.stock'), value: formatNumber(data.stock) },
              { id: 'brand', label: t('adminProducts.brand'), value: data.brand || undefined },
              {
                id: 'material',
                label: t('adminProducts.material'),
                value: data.material || undefined,
              },
              {
                id: 'seoTitle',
                label: t('adminProducts.seoTitle'),
                value: data.seoTitle || undefined,
                span: 'full',
              },
              {
                id: 'seoDescription',
                label: t('adminProducts.seoDescription'),
                value: data.seoDescription || undefined,
                span: 'full',
              },
              {
                id: 'care',
                label: t('adminProducts.careInstructions'),
                value: data.careInstructions || undefined,
                span: 'full',
              },
              {
                id: 'createdAt',
                label: t('adminProducts.createdAt'),
                value: formatDate(data.createdAt),
              },
              {
                id: 'updatedAt',
                label: t('adminProducts.updatedAt'),
                value: formatDate(data.updatedAt),
              },
            ]}
          />
        </Card>

        <Card title={t('adminProducts.images')}>
          {images.length ? (
            <MediaGallery
              items={images.map((image, index) => ({
                id: image.id,
                src: image.url,
                alt: t('adminProducts.imageAlt', { name: data.name, index: index + 1 }),
              }))}
              thumbnails="bottom"
              aspectRatio="1 / 1"
            />
          ) : (
            <EmptyState size="compact" icon="grid" title={t('adminProducts.noImages')} />
          )}
        </Card>
      </div>

      <Card title={t('adminProducts.description')}>
        <RichTextView html={data.description} emptyFallback={t('adminProducts.noDescription')} />
      </Card>

      <Card
        title={t('adminProducts.variants')}
        description={t('adminProducts.variantsHint')}
        contentClassName="p-0"
        action={
          canEditVariants ? (
            <Button size="sm" onClick={() => setEditing({})}>
              <Icon name="plus" />
              {t('adminProducts.variant.addTitle')}
            </Button>
          ) : undefined
        }
      >
        <DataTable
          className="rounded-none border-0 shadow-none"
          classNames={{ thead: 'bg-table-header text-ink', cell: 'align-middle' }}
          caption={t('adminProducts.variants')}
          rows={variants.data?.data ?? []}
          columns={variantColumns}
          rowId={(row) => row.id}
          loading={variants.isPending}
          error={
            variants.isError
              ? getErrorMessage(variants.error, t('adminProducts.variantsFailed'))
              : undefined
          }
          onRetry={() => void variants.refetch()}
          emptyText={t('adminProducts.noVariants')}
        />
      </Card>

      {publication.confirmDialog}
      {editing && (
        <VariantEditor
          key={editing.variant?.id ?? 'new'}
          productId={data.id}
          variant={editing.variant}
          images={images}
          onClose={() => setEditing(null)}
          onReload={reloadVariant}
        />
      )}
    </div>
  );
}
