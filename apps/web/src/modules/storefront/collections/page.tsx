import {
  Alert,
  Button,
  EmptyState,
  Icon,
  Input,
  Select,
  Skeleton,
  UiImage,
} from '@itclabs/react-ui';
import { useGetCollections } from '@p4/api-sdk/react';
import { getErrorMessage, type Product } from '@p4/api-sdk/shared';
import { useDeferredValue, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/constants';

type SortOption = 'newest' | 'oldest' | 'nameAsc' | 'nameDesc';

type CollectionItem = {
  id: string;
  slug: string;
  title: string;
  products: Product[];
};

const SORT_PARAMS: Record<SortOption, { sortBy: 'createdAt' | 'key'; sortOrder: 'asc' | 'desc' }> =
  {
    newest: { sortBy: 'createdAt', sortOrder: 'desc' },
    oldest: { sortBy: 'createdAt', sortOrder: 'asc' },
    nameAsc: { sortBy: 'key', sortOrder: 'asc' },
    nameDesc: { sortBy: 'key', sortOrder: 'desc' },
  };

function isCollectionEntry(entry: unknown): entry is CollectionItem {
  if (!entry || typeof entry !== 'object') return false;
  const candidate = entry as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.slug === 'string' &&
    candidate.slug.length > 0 &&
    typeof candidate.title === 'string' &&
    candidate.title.length > 0 &&
    Array.isArray(candidate.products)
  );
}

function CollectionsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {['c1', 'c2', 'c3', 'c4', 'c5', 'c6'].map((key) => (
        <div key={key} className="grid gap-3 rounded-panel border border-line bg-surface p-4">
          <Skeleton className="aspect-[16/9] w-full rounded-panel" />
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      ))}
    </div>
  );
}

export default function CollectionsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('newest');
  const deferredSearch = useDeferredValue(search.trim());

  const { sortBy, sortOrder } = SORT_PARAMS[sort];
  const collectionsQuery = useGetCollections({
    params: {
      query: {
        q: deferredSearch || undefined,
        sortBy,
        sortOrder,
      },
    },
  });

  const collections = useMemo<CollectionItem[]>(() => {
    const raw = collectionsQuery.data?.data ?? [];
    return raw.flatMap((entry) => {
      if (!isCollectionEntry(entry)) return [];
      const activeProducts = entry.products.filter((product) => product.status === 'active');
      if (activeProducts.length === 0) return [];
      return [
        {
          id: entry.id,
          slug: entry.slug,
          title: entry.title,
          products: activeProducts,
        },
      ];
    });
  }, [collectionsQuery.data]);

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'newest', label: t('storefront.collections.sortNewest') },
    { value: 'oldest', label: t('storefront.collections.sortOldest') },
    { value: 'nameAsc', label: t('storefront.collections.sortNameAsc') },
    { value: 'nameDesc', label: t('storefront.collections.sortNameDesc') },
  ];

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid gap-1">
          <h1 className="text-heading font-bold text-ink">{t('storefront.collections.title')}</h1>
          <p className="text-ui-sm text-muted">{t('storefront.collections.subtitle')}</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('storefront.collections.searchPlaceholder')}
            aria-label={t('storefront.collections.searchPlaceholder')}
            className="w-full sm:w-64"
          />
          <Select
            aria-label={t('storefront.collections.title')}
            rootClassName="w-full sm:w-44"
            size="sm"
            searchable={false}
            clearable={false}
            value={sort}
            options={sortOptions}
            onValueChange={(value) => {
              if (value) setSort(value as SortOption);
            }}
          />
        </div>
      </div>

      {collectionsQuery.isPending ? (
        <CollectionsSkeleton />
      ) : collectionsQuery.isError ? (
        <Alert
          tone="danger"
          action={
            <Button size="sm" variant="secondary" onClick={() => void collectionsQuery.refetch()}>
              {t('common.retry')}
            </Button>
          }
        >
          {getErrorMessage(collectionsQuery.error, t('storefront.collections.loadFailed'))}
        </Alert>
      ) : collections.length === 0 ? (
        <EmptyState
          icon="store"
          title={t('storefront.collections.emptyTitle')}
          description={t('storefront.collections.emptyDescription')}
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => {
            const cover = collection.products[0];
            const coverUrl = cover?.thumbnailUrl ?? cover?.thumbnail?.url ?? '';

            return (
              <Link
                key={collection.id}
                to={ROUTES.storefront.collectionDetail(collection.slug)}
                className="group grid gap-3 rounded-panel border border-line bg-surface p-4 transition-colors hover:border-ink/30"
              >
                <div className="overflow-hidden rounded-panel bg-canvas">
                  <UiImage
                    src={coverUrl}
                    alt={collection.title}
                    className="aspect-[16/9] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                </div>
                <div className="grid gap-1">
                  <h2 className="text-body font-semibold text-ink">{collection.title}</h2>
                  <p className="text-ui-sm text-muted">
                    {t('storefront.collections.productCount', {
                      count: collection.products.length,
                    })}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
