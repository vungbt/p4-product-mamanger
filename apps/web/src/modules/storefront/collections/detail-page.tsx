import { Alert, Button, EmptyState, Icon, Skeleton } from '@itclabs/react-ui';
import { useGetCollectionsSlug } from '@p4/api-sdk/react';
import { ApiSdkError, getErrorMessage, type Product } from '@p4/api-sdk/shared';
import { ProductCard } from '@p4/blocks';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { ROUTES } from '@/constants/constants';

type CollectionDetail = {
  id: string;
  slug: string;
  title: string;
  products: Product[];
};

function isCollectionDetail(entry: unknown): entry is CollectionDetail {
  if (!entry || typeof entry !== 'object') return false;
  const candidate = entry as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.slug === 'string' &&
    typeof candidate.title === 'string' &&
    Array.isArray(candidate.products)
  );
}

function CollectionDetailSkeleton() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8'].map((key) => (
          <Skeleton className="aspect-[3/4] w-full rounded-panel" key={key} />
        ))}
      </div>
    </div>
  );
}

export default function CollectionDetailPage() {
  const { t } = useTranslation();
  const { slug = '' } = useParams<{ slug: string }>();

  const detailQuery = useGetCollectionsSlug(
    { params: { path: { slug } } },
    { enabled: Boolean(slug) },
  );

  const collection = useMemo(() => {
    const raw = detailQuery.data?.data;
    if (!isCollectionDetail(raw)) return undefined;
    return {
      ...raw,
      products: raw.products.filter((product) => product.status === 'active'),
    };
  }, [detailQuery.data]);

  const isNotFound =
    !slug ||
    (detailQuery.isError &&
      detailQuery.error instanceof ApiSdkError &&
      detailQuery.error.status === 404);

  if (detailQuery.isPending && slug) {
    return <CollectionDetailSkeleton />;
  }

  if (isNotFound) {
    return (
      <EmptyState
        icon="store"
        title={t('storefront.collections.notFoundTitle')}
        description={t('storefront.collections.notFoundDescription')}
        action={
          <Link to={ROUTES.storefront.collections}>
            <Button size="sm" variant="primary">
              {t('storefront.collections.backToList')}
            </Button>
          </Link>
        }
      />
    );
  }

  if (detailQuery.isError) {
    return (
      <Alert
        tone="danger"
        action={
          <Button size="sm" variant="secondary" onClick={() => void detailQuery.refetch()}>
            {t('common.retry')}
          </Button>
        }
      >
        {getErrorMessage(detailQuery.error, t('storefront.collections.loadFailed'))}
      </Alert>
    );
  }

  if (!collection) {
    return (
      <EmptyState
        icon="store"
        title={t('storefront.collections.notFoundTitle')}
        description={t('storefront.collections.notFoundDescription')}
        action={
          <Link to={ROUTES.storefront.collections}>
            <Button size="sm" variant="primary">
              {t('storefront.collections.backToList')}
            </Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <Link
          to={ROUTES.storefront.collections}
          className="inline-flex items-center gap-1.5 text-ui-sm font-medium text-muted hover:text-ink"
        >
          <Icon name="arrowLeft" size={16} />
          {t('storefront.collections.backToList')}
        </Link>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-heading font-bold text-ink">{collection.title}</h1>
          <span className="text-ui-sm text-muted">
            {t('storefront.collections.productCount', { count: collection.products.length })}
          </span>
        </div>
      </div>

      {collection.products.length === 0 ? (
        <EmptyState
          icon="store"
          title={t('storefront.collections.emptyProductsTitle')}
          description={t('storefront.collections.emptyProductsDescription')}
          action={
            <Link to={ROUTES.storefront.shop}>
              <Button size="sm" variant="primary">
                {t('storefront.home.shopNow')}
                <Icon name="arrowRight" size={20} />
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {collection.products.map((product) => (
            <ProductCard
              key={product.id}
              href={`${ROUTES.storefront.shop}?product=${product.slug}`}
              image={{
                url: product.thumbnailUrl ?? product.thumbnail?.url ?? '',
                alt: product.name,
              }}
              name={product.name}
              category={product.category?.name}
              price={product.price}
              stock={product.stock}
            />
          ))}
        </div>
      )}
    </div>
  );
}
