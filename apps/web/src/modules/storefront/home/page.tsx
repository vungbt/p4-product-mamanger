// TODO: Home — landing page (featured products, hero banner, categories)

import { Alert, Button, EmptyState, Icon, Skeleton, UiImage } from '@itclabs/react-ui';
import type { Product } from '@p4/api-sdk/shared';
import { ProductCard } from '@p4/blocks';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/constants';
import useHome, { type HomeBannerSection, type HomeCollectionSection } from './hooks/use-home';

function HomeSkeleton() {
  return (
    <div className="grid gap-8">
      <Skeleton className="aspect-[21/9] w-full rounded-panel" />
      <div className="grid gap-4">
        <Skeleton className="h-7 w-48" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {['s1', 's2', 's3', 's4'].map((key) => (
            <Skeleton className="aspect-[3/4] w-full rounded-panel" key={key} />
          ))}
        </div>
      </div>
    </div>
  );
}

function BannerBlock({ section }: { section: HomeBannerSection }) {
  const href = section.href || ROUTES.storefront.shop;
  const isExternal = /^https?:\/\//i.test(href);

  const image = (
    <div className="overflow-hidden rounded-panel border border-line bg-surface">
      <UiImage
        src={section.thumbnailUrl}
        alt={section.title}
        className="aspect-[21/9] w-full object-cover"
      />
    </div>
  );

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noreferrer" aria-label={section.title} className="block">
        {image}
      </a>
    );
  }
  return (
    <Link to={href} aria-label={section.title} className="block">
      {image}
    </Link>
  );
}

function CollectionBlock({ section }: { section: HomeCollectionSection }) {
  const { t } = useTranslation();

  return (
    <section className="grid gap-4" aria-labelledby={`collection-${section.id}`}>
      <div className="flex items-center justify-between gap-3">
        <h2 id={`collection-${section.id}`} className="text-heading font-bold text-ink ">
          {section.title}
        </h2>
        <Link
          to={ROUTES.storefront.collectionDetail(section.slug)}
          className="text-ui-sm font-medium"
        >
          {t('storefront.viewAll')}
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {section.products.map((product: Product) => (
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
    </section>
  );
}

export default function HomePage() {
  const { t } = useTranslation();
  const { section, loading, error, isEmpty, refresh } = useHome();

  if (loading) return <HomeSkeleton />;

  if (error) {
    return (
      <Alert
        tone="danger"
        action={
          <Button size="sm" onClick={refresh} variant="secondary">
            {t('common.retry')}
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  if (isEmpty) {
    return (
      <EmptyState
        icon="store"
        title={t('storefront.home.title')}
        description={t('storefront.home.description')}
        action={
          <Link to={ROUTES.storefront.shop}>
            <Button size="sm" variant="primary">
              {t('storefront.home.shopNow')}
              <Icon name="arrowRight" size={20} />
            </Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid gap-8 ">
      {section.map((section) =>
        section.type === 'banner' ? (
          <BannerBlock key={section.id} section={section} />
        ) : (
          <CollectionBlock key={section.id} section={section} />
        ),
      )}
    </div>
  );
}
