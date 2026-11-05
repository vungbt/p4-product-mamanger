import { axiosClient } from '@p4/api-client';
import type { ApiSuccess, Category, CategoryInput } from '@p4/shared';

export const categoryService = {
  list: () => axiosClient.get<undefined, ApiSuccess<Category[]>>('/categories'),
  detail: (id: string) =>
    axiosClient.get<undefined, ApiSuccess<Category>>(`/categories/${encodeURIComponent(id)}`),
  create: (body: CategoryInput) =>
    axiosClient.post<CategoryInput, ApiSuccess<Category>>('/categories', body),
  update: (id: string, body: CategoryInput) =>
    axiosClient.put<CategoryInput, ApiSuccess<Category>>(
      `/categories/${encodeURIComponent(id)}`,
      body,
    ),
  remove: (id: string) =>
    axiosClient.delete<undefined, ApiSuccess<Category>>(`/categories/${encodeURIComponent(id)}`),
};
