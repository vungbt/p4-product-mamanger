import { categoryKeys, useQuery } from '@p4/api-client';
import { useTranslation } from 'react-i18next';
import { categoryService } from '@/services/category-service';
import { categoryErrorMessage } from './use-categories';

export default function useCategoryDetails(id: string) {
  const { t } = useTranslation();

  const query = useQuery({
    queryKey: categoryKeys.detail(id),
    queryFn: () => categoryService.detail(id),
  });

  const category = query.data?.data;

  return {
    category,
    loading: query.isPending,
    error: query.isError
      ? categoryErrorMessage(query.error, t('categories.loadFailed'))
      : undefined,
    retry: () => {
      void query.refetch();
    },
  };
}
