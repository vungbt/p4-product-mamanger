import { useGetShopConfig, useGetStorefrontHome } from '@p4/api-sdk/react';
import { getErrorMessage, type Product } from '@p4/api-sdk/shared';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export type HomeBannerSection = {
  id: string;
  type: 'banner';
  title: string;
  thumbnailUrl: string;
  href: string;
};

export type HomeCollectionSection = {
  id: string;
  type: 'collection';
  title: string;
  slug: string;
  products: Product[];
};
export type HomeSection = HomeBannerSection | HomeCollectionSection;

export default function useHome() {
  const { t } = useTranslation();

  const homeQuery = useGetStorefrontHome();

  const shopQuery = useGetShopConfig();

  const currency = shopQuery.data?.data?.currency ?? 'VND';

  const section = useMemo<HomeSection[]>(() => {
    const raw = homeQuery.data?.data?.sections ?? [];

    return raw.flatMap<HomeSection>((section) => {
      if (
        section.type === 'banner' &&
        'thumbnailUrl' in section.data &&
        section.data.thumbnailUrl &&
        section.data.title
      ) {
        return [
          {
            id: section.id,
            type: 'banner',
            title: section.data.title,
            thumbnailUrl: section.data.thumbnailUrl,
            href: section.data.href ?? '',
          },
        ];
      }
      if (
        section.type === 'collection' &&
        'slug' in section.data &&
        'products' in section.data &&
        Array.isArray(section.data.products) &&
        section.data.slug &&
        section.data.title
      ) {
        const activeProducts = section.data.products.filter(
          (product) => product.status === 'active',
        );
        if (activeProducts.length === 0) return [];
        return [
          {
            id: section.id,
            type: 'collection',
            slug: section.data.slug,
            title: section.data.title,
            products: activeProducts,
          },
        ];
      }
      return [];
    });
  }, [homeQuery.data]);
  const refresh = () => {
    void homeQuery.refetch();
  };
  return {
    section,
    currency,
    loading: homeQuery.isPending,
    error: homeQuery.isError
      ? getErrorMessage(homeQuery.error, t('storefront.homeLoadFailed'))
      : undefined,
    isEmpty: !homeQuery.isPending && !homeQuery.isError && section.length === 0,
    refresh,
  };
}
