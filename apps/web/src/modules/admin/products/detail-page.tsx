import {
  Button,
  type ColumnDef,
  DataTable,
  DescriptionList,
  EmptyState,
  Icon,
  StatusTag,
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
import { useConfirm } from '@/libraries/confirm';
import { DetailPage, DetailSection } from '@/modules/admin/layout/detail-page';
import {
  TRANSITIONS,
  useProductPublication,
  useProductStatusOptions,
  useSkuStatusOptions,
} from '@/modules/admin/products/components/product-status';

export default function AdminProductDetailPage() {
  const { t } = useTranslation();

  const confirm = useConfirm();

  const { formatCurrency, formatDate, formatNumber } = useFormatters();

  const { id = '' } = useParams();

  const navigate = useNavigate();

  const location = useLocation();

  const canWrite = useCanAccess('write', 'Catalog');

  const product = useProduct(id);

  const variants = useProductVariants(id);

  const savePublication = useProductPublication(() => {
    void product.refetch();
  });

  const statusOptions = useProductStatusOptions();

  const skuStatusOptions = useSkuStatusOptions();

  const [saving, setSaving] = useState(false);

  const listSearch =
    typeof location.state?.from === 'string' ? (location.state.from as string) : '';

  const backToList = () => navigate(`${ROUTES.admin.products}${listSearch}`);

  if (product.isPending) {
    return (
      <DetailPage
        title={t('adminProducts.productInfo')}
        back={{ label: t('adminProducts.backToList'), onClick: backToList }}
        loading
        aside={<DetailSection title={t('adminProducts.images')} />}
      />
    );
  }

  if (product.isError) {
    const notFound = product.error instanceof ApiSdkError && product.error.status === 404;

    const title = t(notFound ? 'adminProducts.notFound' : 'adminProducts.loadFailed');
    const action = notFound ? (
      <Button onClick={backToList}>
        <Icon name="arrowLeft" />
        {t('adminProducts.backToList')}
      </Button>
    ) : (
      <Button onClick={() => void product.refetch()}>
        <Icon name="refresh" />
        {t('adminProducts.retry')}
      </Button>
    );

    return (
      <DetailPage
        title={title}
        back={{ label: t('adminProducts.backToList'), onClick: backToList }}
        notFound={notFound ? { title, action } : undefined}
      >
        <EmptyState
          variant="error"
          headingLevel={2}
          title={title}
          description={getErrorMessage(product.error, '')}
          action={action}
        />
      </DetailPage>
    );
  }

  const data = product.data.data;
  const images = data.images ?? [];
  const media = [
    ...(data.thumbnail ? [{ ...data.thumbnail, id: data.thumbnail.fileId }] : []),
    ...images,
  ].filter(
    (image, index, items) => items.findIndex((item) => item.fileId === image.fileId) === index,
  );
  const next = statusOptions.filter((option) => TRANSITIONS[data.status].includes(option.value));
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
      cell: ({ row }) => <StatusTag value={row.original.status} options={skuStatusOptions} />,
    },
  ];

  return (
    <DetailPage
      back={{ label: t('adminProducts.backToList'), onClick: backToList }}
      title={data.name}
      meta={
        <>
          <StatusTag value={data.status} options={statusOptions} />
          {t('adminProducts.version', { version: data.version })}
        </>
      }
      actions={
        <div className="flex flex-wrap gap-2">
          {canWrite &&
            next.map((option) => (
              <Button
                key={option.value}
                variant={option.danger ? 'danger' : 'secondary'}
                loading={saving}
                onClick={async () => {
                  if (option.danger) {
                    await confirm({
                      title: t('adminProducts.archiveTitle'),
                      description: t('adminProducts.archiveConfirm', { name: data.name }),
                      tone: 'danger',
                      confirmLabel: t('adminProducts.archive'),
                      onConfirm: () => savePublication(data, option.value),
                    });
                    return;
                  }

                  setSaving(true);
                  try {
                    await savePublication(data, option.value);
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {option.icon &&
                  (typeof option.icon === 'string' ? (
                    <Icon name={option.icon} />
                  ) : (
                    <Icon glyph={option.icon} />
                  ))}
                {option.actionLabel}
              </Button>
            ))}
          {canWrite && data.status !== 'archived' && (
            <Button
              onClick={() =>
                navigate(ROUTES.admin['product-edit'](data.id), {
                  state: { from: listSearch, returnTo: 'detail' },
                })
              }
            >
              <Icon name="edit" />
              {t('adminProducts.edit')}
            </Button>
          )}
        </div>
      }
      aside={
        <DetailSection title={t('adminProducts.images')}>
          {media.length ? (
            <MediaGallery
              items={media.map((image, index) => ({
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
        </DetailSection>
      }
    >
      <DetailSection title={t('adminProducts.productInfo')}>
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
      </DetailSection>

      <DetailSection title={t('adminProducts.description')}>
        <RichTextView html={data.description} emptyFallback={t('adminProducts.noDescription')} />
      </DetailSection>

      <DetailSection
        title={t('adminProducts.variants')}
        description={t('adminProducts.variantsHint')}
        flush
        actions={
          canEditVariants ? (
            <Button
              size="sm"
              onClick={() =>
                navigate(ROUTES.admin['product-edit'](data.id), { state: { from: listSearch } })
              }
            >
              <Icon name="edit" />
              {t('adminProductForm.edit')}
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
      </DetailSection>
    </DetailPage>
  );
}
