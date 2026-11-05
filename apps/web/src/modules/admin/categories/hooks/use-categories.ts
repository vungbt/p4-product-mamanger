import { categoryKeys, useMutation, useQuery, useQueryClient } from '@p4/api-client';
import type { CategoryInput } from '@p4/shared';
import { categoryService } from '@/services/category-service';

export function categoryErrorMessage(error: unknown, fallback: string) {
  return error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
    ? error.message
    : fallback;
}

export default function useCategories() {
  const client = useQueryClient();

  const query = useQuery({ queryKey: categoryKeys.list(), queryFn: categoryService.list });

  const refresh = () => client.invalidateQueries({ queryKey: categoryKeys.all });

  const create = useMutation({ mutationFn: categoryService.create, onSuccess: refresh });

  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: CategoryInput }) =>
      categoryService.update(id, body),
    onSuccess: refresh,
  });

  const remove = useMutation({ mutationFn: categoryService.remove, onSuccess: refresh });

  return { query, create, update, remove };
}
